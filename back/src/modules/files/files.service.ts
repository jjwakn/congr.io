import { I18nService } from 'nestjs-i18n';
import { randomUUID } from 'node:crypto';
import { createReadStream, promises as fs } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { getUserCongregationContext } from 'src/utils/congregation-context';
import { IsNull, Repository } from 'typeorm';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Congregation } from '../congregation/congregation.entity';
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
  ) {}

  private get provider(): FileProvider {
    const value = (process.env.FILE_STORAGE_PROVIDER ?? 'local').toLowerCase();
    return PROVIDERS.includes(value as FileProvider) ? (value as FileProvider) : 'local';
  }

  private get storagePath() {
    return resolve(process.env.FILE_STORAGE_PATH ?? '/tmp/congrio-storage');
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
    if (!file || !file.mimetype.startsWith('image/'))
      throw new BadRequestException(this.i18n.t('errors.files.imageRequired'));
    if (!congregationId) throw new BadRequestException(this.i18n.t('errors.congregation.notFound'));
    const { congregation } = await getUserCongregationContext({
      userId,
      congregationId,
      userRepository: this.userRepository,
      congregationRepository: this.congregationRepository,
      i18n: this.i18n,
    });
    if (this.provider !== 'local') throw new BadRequestException(this.i18n.t('errors.files.providerUploadUnavailable'));

    await fs.mkdir(this.storagePath, { recursive: true });
    const extension = extname(file.originalname)
      .toLowerCase()
      .replace(/[^.a-z0-9]/g, '')
      .slice(0, 12);
    const storageKey = `${randomUUID()}${extension}`;
    await fs.writeFile(join(this.storagePath, storageKey), file.buffer);

    const entity = this.repository.create({
      congregation_id: congregation.id,
      provider: 'local',
      storage_key: storageKey,
      original_name: file.originalname,
      mime_type: file.mimetype,
      size: file.size,
      public: isPublic,
      created_by: { id: userId },
    });
    const result = await this.repository.save(entity);
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

  async setPublic(id: string, isPublic: boolean) {
    await this.repository.update({ id }, { public: isPublic });
  }

  async getFile(id: string, publicOnly = false, congregationId?: string) {
    if (!publicOnly && !congregationId) throw new BadRequestException(this.i18n.t('errors.congregation.notFound'));
    const file = await this.repository.findOne({
      where: { id, deleted_at: IsNull(), ...(publicOnly ? {} : { congregation_id: congregationId }) },
    });
    if (!file || (publicOnly && !file.public)) throw new NotFoundException(this.i18n.t('errors.files.notFound'));
    return { file, stream: createReadStream(join(this.storagePath, file.storage_key)) };
  }
}
