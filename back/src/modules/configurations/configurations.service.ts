import { I18nService } from 'nestjs-i18n';
import { RequestType } from 'src/common/common.types';
import { Repository } from 'typeorm';
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Congregation } from '../congregation/congregation.entity';
import { User } from '../user/user.entity';
import { Configuration } from './configurations.entity';
import { DEFAULT_THEME_PALETTE_CONFIG, THEME_PALETTE_CONFIG_KEY, ThemePaletteConfig } from './configurations.types';

@Injectable()
export class ConfigurationsService {
  constructor(
    @InjectRepository(Configuration)
    private readonly repository: Repository<Configuration>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Congregation)
    private readonly congregationRepository: Repository<Congregation>,

    private readonly i18n: I18nService,
  ) {}

  private getUserIdOrThrow(request: RequestType): string {
    const userId = request.user?.userId;
    if (userId) return userId;

    throw new UnauthorizedException(this.i18n.t('errors.auth.notIncluded'));
  }

  private async getFirstCongregationForUser(userId: string): Promise<{
    congregation: Congregation;
    user: User;
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      withDeleted: true,
      relations: { congregations: true },
    });

    if (!user) throw new NotFoundException(this.i18n.t('errors.user.notFound'));

    const congregationId = user.congregations?.[0]?.id;
    if (!congregationId) throw new NotFoundException(this.i18n.t('errors.congregation.notFound'));

    const congregation = await this.congregationRepository.findOne({
      where: { id: congregationId },
      withDeleted: true,
    });

    if (!congregation) throw new NotFoundException(this.i18n.t('errors.congregation.notFound'));

    return { congregation, user };
  }

  async getThemePaletteConfig(request: RequestType): Promise<ThemePaletteConfig> {
    const userId = this.getUserIdOrThrow(request);
    const { congregation } = await this.getFirstCongregationForUser(userId);

    return this.getThemePaletteConfigByCongregationId(congregation.id);
  }

  async getThemePaletteConfigByCongregationId(congregationId: string): Promise<ThemePaletteConfig> {
    const config = await this.repository.findOne({
      where: {
        congregation_id: congregationId,
        config_key: THEME_PALETTE_CONFIG_KEY,
      },
    });

    if (!config) {
      const defaultConfig = this.repository.create({
        congregation_id: congregationId,
        config_key: THEME_PALETTE_CONFIG_KEY,
        config_value: DEFAULT_THEME_PALETTE_CONFIG as unknown as Record<string, unknown>,
      });

      await this.repository
        .createQueryBuilder()
        .insert()
        .into(Configuration)
        .values(defaultConfig as unknown as Record<string, unknown>)
        .orIgnore()
        .execute();

      const insertedOrExisting = await this.repository.findOne({
        where: {
          congregation_id: congregationId,
          config_key: THEME_PALETTE_CONFIG_KEY,
        },
      });

      return (insertedOrExisting?.config_value as unknown as ThemePaletteConfig) ?? DEFAULT_THEME_PALETTE_CONFIG;
    }

    return (config.config_value as unknown as ThemePaletteConfig) ?? DEFAULT_THEME_PALETTE_CONFIG;
  }

  async upsertThemePaletteConfig({
    request,
    themePalette,
  }: {
    request: RequestType;
    themePalette: ThemePaletteConfig;
  }): Promise<ThemePaletteConfig> {
    const userId = this.getUserIdOrThrow(request);
    const { congregation, user } = await this.getFirstCongregationForUser(userId);

    const existing = await this.repository.findOne({
      where: {
        congregation_id: congregation.id,
        config_key: THEME_PALETTE_CONFIG_KEY,
      },
      relations: {
        created_by: true,
      },
    });

    if (existing) {
      existing.config_value = themePalette as unknown as Record<string, unknown>;
      existing.updated_by = user;
      await this.repository.save(existing);
      return themePalette;
    }

    const created = this.repository.create({
      congregation_id: congregation.id,
      congregation,
      config_key: THEME_PALETTE_CONFIG_KEY,
      config_value: themePalette as unknown as Record<string, unknown>,
      created_by: user,
    });

    await this.repository.save(created);
    return themePalette;
  }
}
