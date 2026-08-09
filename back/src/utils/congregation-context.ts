import { I18nService } from 'nestjs-i18n';
import { Congregation } from 'src/modules/congregation/congregation.entity';
import { User } from 'src/modules/user/user.entity';
import { IsNull, Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

export const getUserCongregationContext = async ({
  userId,
  congregationId,
  userRepository,
  congregationRepository,
  i18n,
}: {
  userId: string;
  congregationId?: string;
  userRepository: Repository<User>;
  congregationRepository: Repository<Congregation>;
  i18n: I18nService;
}): Promise<{
  user: User;
  congregation: Congregation;
}> => {
  const user = await userRepository.findOne({
    where: { id: userId, enabled: true, deleted_at: IsNull(), deleted_by: IsNull() },
    relations: {
      congregations: true,
    },
  });

  if (!user) throw new NotFoundException(i18n.t('errors.user.notFound'));

  const resolvedCongregationId = congregationId ?? user.congregations?.[0]?.id;
  const hasCongregation = user.congregations?.some(({ id }) => id === resolvedCongregationId);
  if (!resolvedCongregationId || !hasCongregation) throw new NotFoundException(i18n.t('errors.congregation.notFound'));

  const congregation = await congregationRepository.findOne({
    where: { id: resolvedCongregationId, enabled: true, deleted_at: IsNull(), deleted_by: IsNull() },
  });

  if (!congregation) throw new NotFoundException(i18n.t('errors.congregation.notFound'));

  return { user, congregation };
};
