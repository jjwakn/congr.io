import { I18nService } from 'nestjs-i18n';
import { randomUUID } from 'node:crypto';
import { createReadStream, promises as fs } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { MAX_CONGREGATION_STORAGE_BYTES, MAX_UPLOAD_BYTES } from 'src/config/security';
import { getUserCongregationContext } from 'src/utils/congregation-context';
import { EntityManager, IsNull, LessThan, Repository } from 'typeorm';
import { BadRequestException, Injectable, NotFoundException, Optional, PayloadTooLargeException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Congregation } from '../congregation/congregation.entity';
import { Event } from '../event/event.entity';
import { SecurityAuditService } from '../security/security-audit.service';
import { SecurityAuditEvent } from '../security/security.types';
import { User } from '../user/user.entity';
import { StoredFile } from './files.entity';
import type { FileProvider, FileProviderStatus } from './files.types';

const PROVIDERS: FileProvider[] = ['local', 'url', 'aws', 'gcp', 'onedrive', 'google_drive'];

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(StoredFile)
    private readonly repository: Repository<StoredFile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Congregation)
    private readonly congregationRepository: Repository<Congregation>,
    private readonly i18n: I18nService,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,

    @Optional()
    private readonly securityAudit?: SecurityAuditService,
  ) {}

  private get provider(): FileProvider {
    const value = (process.env.FILE_STORAGE_PROVIDER ?? 'local').toLowerCase();
    return PROVIDERS.includes(value as FileProvider) ? (value as FileProvider) : 'local';
  }

  private get storagePath() {
    return resolve(process.env.FILE_STORAGE_PATH ?? '/tmp/congrio-storage');
  }

  private async saveWithinQuota({
    congregationId,
    entityData,
    storedPath,
    processed,
  }: {
    congregationId: string;
    entityData: Partial<StoredFile>;
    storedPath: string;
    processed: Buffer;
  }): Promise<StoredFile> {
    const persist = async (repository: Repository<StoredFile>): Promise<StoredFile> => {
      const currentUsage = Number(
        (await repository.sum('size', { congregation_id: congregationId, deleted_at: IsNull() })) ?? 0,
      );
      if (currentUsage + processed.length > MAX_CONGREGATION_STORAGE_BYTES) {
        throw new PayloadTooLargeException(this.i18n.t('errors.files.quotaExceeded'));
      }

      await fs.writeFile(storedPath, processed, { flag: 'wx' });
      try {
        return await repository.save(repository.create(entityData));
      } catch (error) {
        await fs.unlink(storedPath).catch(() => undefined);
        throw error;
      }
    };

    const manager = this.repository.manager as EntityManager | undefined;
    if (!manager?.transaction) return persist(this.repository);

    return manager.transaction(async (transactionManager) => {
      await transactionManager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        `stored-file-quota:${congregationId}`,
      ]);
      return persist(transactionManager.getRepository(StoredFile));
    });
  }

  private async cleanupAbandonedUploads(congregationId: string): Promise<void> {
    if (typeof this.repository.find !== 'function') return;
    const candidates = await this.repository.find({
      where: {
        congregation_id: congregationId,
        created_at: LessThan(new Date(Date.now() - 24 * 60 * 60_000)),
        deleted_at: IsNull(),
      },
      take: 100,
    });
    await Promise.all(candidates.map(({ id }) => this.releaseIfUnreferenced(id)));
  }

  getStatus(): { selected: FileProvider; providers: FileProviderStatus[] } {
    const requirements: Record<FileProvider, string[]> = {
      local: ['FILE_STORAGE_PATH'],
      url: ['FILE_PUBLIC_BASE_URL'],
      aws: ['FILE_BUCKET', 'FILE_REGION', 'FILE_ACCESS_KEY', 'FILE_SECRET'],
      gcp: ['FILE_BUCKET', 'FILE_PROJECT_ID', 'FILE_CREDENTIALS'],
      onedrive: ['FILE_DRIVE_FOLDER_ID', 'FILE_CLIENT_ID', 'FILE_CLIENT_SECRET', 'FILE_TENANT_ID'],
      google_drive: ['FILE_DRIVE_FOLDER_ID', 'FILE_CREDENTIALS'],
    };
    return {
      selected: this.provider,
      providers: PROVIDERS.map((id) => {
        const required = requirements[id];
        const missing = id === 'local' ? [] : required.filter((key) => !process.env[key]?.trim());
        const available = id === 'local' || id === 'url';
        return {
          id,
          selected: id === this.provider,
          configured: available && missing.length === 0,
          available,
          missing,
        };
      }),
    };
  }

  getEventImageOptions() {
    return {
      allow_upload: this.provider === 'local',
      allow_public_url: this.provider === 'url',
    };
  }

  async uploadImage({
    file,
    congregationId,
    userId,
    isPublic = false,
  }: {
    file?: Express.Multer.File;
    congregationId?: string;
    userId: string;
    isPublic?: boolean;
  }) {
    if (!file) throw new BadRequestException(this.i18n.t('errors.files.imageRequired'));
    if (file.size > MAX_UPLOAD_BYTES || file.buffer.length > MAX_UPLOAD_BYTES)
      throw new PayloadTooLargeException(this.i18n.t('errors.files.tooLarge'));
    if (!congregationId) throw new BadRequestException(this.i18n.t('errors.congregation.notFound'));
    const { congregation } = await getUserCongregationContext({
      userId,
      congregationId,
      userRepository: this.userRepository,
      congregationRepository: this.congregationRepository,
      i18n: this.i18n,
    });
    if (this.provider !== 'local') throw new BadRequestException(this.i18n.t('errors.files.providerUploadUnavailable'));

    let processed: Buffer;
    let extension: string;
    let mimeType: string;
    try {
      const image = sharp(file.buffer, { animated: false, limitInputPixels: 40_000_000 });
      const metadata = await image.metadata();
      if (metadata.format === 'jpeg') {
        processed = await image.jpeg({ quality: 90 }).toBuffer();
        extension = '.jpg';
        mimeType = 'image/jpeg';
      } else if (metadata.format === 'png') {
        processed = await image.png().toBuffer();
        extension = '.png';
        mimeType = 'image/png';
      } else if (metadata.format === 'webp') {
        processed = await image.webp({ quality: 90 }).toBuffer();
        extension = '.webp';
        mimeType = 'image/webp';
      } else {
        throw new Error('unsupported image format');
      }
    } catch {
      throw new BadRequestException(this.i18n.t('errors.files.imageRequired'));
    }
    if (processed.length > MAX_UPLOAD_BYTES) throw new PayloadTooLargeException(this.i18n.t('errors.files.tooLarge'));

    await this.cleanupAbandonedUploads(congregation.id);
    await fs.mkdir(this.storagePath, { recursive: true });
    const storageKey = `${randomUUID()}${extension}`;
    const storedPath = join(this.storagePath, storageKey);
    const result = await this.saveWithinQuota({
      congregationId: congregation.id,
      storedPath,
      processed,
      entityData: {
        congregation_id: congregation.id,
        provider: 'local',
        storage_key: storageKey,
        original_name: file.originalname.slice(0, 255),
        mime_type: mimeType,
        size: processed.length,
        public: isPublic,
        created_by: { id: userId },
      } as Partial<StoredFile>,
    });
    this.securityAudit?.record(SecurityAuditEvent.fileVisibilityChanged, {
      action: 'uploaded',
      actor_id: userId,
      congregation_id: congregation.id,
      file_id: result.id,
      public: isPublic,
      size: processed.length,
    });
    return { id: result.id, url: `/files/${result.id}`, mime_type: result.mime_type, size: Number(result.size) };
  }

  async uploadCongregationLogo({
    file,
    congregationId,
    userId,
    kind,
  }: {
    file?: Express.Multer.File;
    congregationId?: string;
    userId: string;
    kind: string;
  }) {
    if (!congregationId) throw new BadRequestException(this.i18n.t('errors.congregation.notFound'));
    if (kind !== 'small' && kind !== 'big') throw new BadRequestException(this.i18n.t('errors.files.invalidLogoKind'));

    const uploaded = await this.uploadImage({ file, congregationId, userId, isPublic: true });
    return { ...uploaded, url: `/files/public/${uploaded.id}` };
  }

  async setPublic(id: string, _isPublic: boolean, userId: string, congregationId?: string) {
    const { congregation } = await getUserCongregationContext({
      userId,
      congregationId,
      userRepository: this.userRepository,
      congregationRepository: this.congregationRepository,
      i18n: this.i18n,
    });
    const file = await this.repository.findOne({
      where: { id, congregation_id: congregation.id, deleted_at: IsNull() },
    });
    if (!file) throw new NotFoundException(this.i18n.t('errors.files.notFound'));
    const [publicEventReferences, congregationReferences] = await Promise.all([
      this.eventRepository.count({
        where: {
          image_file_id: id,
          congregation_id: congregation.id,
          is_public: true,
          enabled: true,
          deleted_at: IsNull(),
        },
      }),
      this.congregationRepository.count({
        where: [
          { id: congregation.id, logo_small_file_id: id, enabled: true, deleted_at: IsNull() },
          { id: congregation.id, logo_big_file_id: id, enabled: true, deleted_at: IsNull() },
        ],
      }),
    ]);
    const referencedPublicly = Boolean(publicEventReferences || congregationReferences);
    await this.repository.update({ id: file.id, congregation_id: congregation.id }, { public: referencedPublicly });
    this.securityAudit?.record(SecurityAuditEvent.fileVisibilityChanged, {
      action: 'visibility_synced',
      actor_id: userId,
      congregation_id: congregation.id,
      file_id: file.id,
      public: referencedPublicly,
    });
  }

  async assertOwnedFile(id: string, userId: string, congregationId?: string): Promise<StoredFile> {
    const { congregation } = await getUserCongregationContext({
      userId,
      congregationId,
      userRepository: this.userRepository,
      congregationRepository: this.congregationRepository,
      i18n: this.i18n,
    });
    const file = await this.repository.findOne({
      where: { id, congregation_id: congregation.id, deleted_at: IsNull() },
    });
    if (!file) throw new NotFoundException(this.i18n.t('errors.files.notFound'));
    return file;
  }

  async getFile(id: string, publicOnly = false, congregationId?: string, userId?: string) {
    if (!publicOnly && !congregationId) throw new BadRequestException(this.i18n.t('errors.congregation.notFound'));
    if (!publicOnly) {
      if (!userId) throw new NotFoundException(this.i18n.t('errors.files.notFound'));
      await getUserCongregationContext({
        userId,
        congregationId,
        userRepository: this.userRepository,
        congregationRepository: this.congregationRepository,
        i18n: this.i18n,
      });
    }
    const file = await this.repository.findOne({
      where: { id, deleted_at: IsNull(), ...(publicOnly ? {} : { congregation_id: congregationId }) },
    });
    if (!file || (publicOnly && !file.public)) throw new NotFoundException(this.i18n.t('errors.files.notFound'));
    return { file, stream: createReadStream(join(this.storagePath, file.storage_key)) };
  }

  async releaseIfUnreferenced(id: string): Promise<void> {
    const file = await this.repository.findOne({ where: { id, deleted_at: IsNull() } });
    if (!file) return;
    const [eventReferences, congregationReferences] = await Promise.all([
      this.eventRepository?.count({ where: { image_file_id: id, deleted_at: IsNull() } }) ?? Promise.resolve(0),
      this.congregationRepository.count({
        where: [
          { logo_small_file_id: id, deleted_at: IsNull() },
          { logo_big_file_id: id, deleted_at: IsNull() },
        ],
      }),
    ]);
    if (eventReferences || congregationReferences) return;

    await this.repository.update({ id, deleted_at: IsNull() }, { public: false });
    await this.repository.softDelete(id);
    await fs.unlink(join(this.storagePath, file.storage_key)).catch(() => undefined);
  }
}
