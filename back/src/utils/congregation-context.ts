import { I18nService } from 'nestjs-i18n';
import { Congregation } from 'src/modules/congregation/congregation.entity';
import { User } from 'src/modules/user/user.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

export const getUserCongregationContext = async ({
  userId,
  userRepository,
  congregationRepository,
  i18n,
}: {
  userId: string;
  userRepository: Repository<User>;
  congregationRepository: Repository<Congregation>;
  i18n: I18nService;
}): Promise<{
  user: User;
  congregation: Congregation;
}> => {
  const user = await userRepository.findOne({
    where: { id: userId },
    withDeleted: true,
    relations: {
      congregations: true,
    },
  });

  if (!user) throw new NotFoundException(i18n.t('errors.user.notFound'));

  const congregationId = user.congregations?.[0]?.id;
  if (!congregationId) throw new NotFoundException(i18n.t('errors.congregation.notFound'));

  const congregation = await congregationRepository.findOne({
    where: { id: congregationId },
    withDeleted: true,
  });

  if (!congregation) throw new NotFoundException(i18n.t('errors.congregation.notFound'));

  return { user, congregation };
};
