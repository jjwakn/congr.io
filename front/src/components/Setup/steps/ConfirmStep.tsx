import { Box, Chip, Divider, Typography } from '@mui/material';
import { ReactNode, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSetup } from '../../../hooks/useSetup';
import { SetupData } from '../../../types/setup.types';
import { FormContainer } from '../../common/FormContainer';

const ConfirmSection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <Box
    sx={{
      border: ({ palette }) => `1px solid ${palette.divider}`,
      borderRadius: 2,
      p: 2,
      display: 'flex',
      flexDirection: 'column',
      gap: 1.5,
    }}
  >
    <Typography variant="subtitle1" fontWeight={600}>
      {title}
    </Typography>
    {children}
  </Box>
);

const FieldRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '120px 1fr', sm: '160px 1fr' },
      gap: 1,
      alignItems: 'start',
    }}
  >
    <Typography variant="body2" color="text.secondary" fontWeight={500}>
      {label}
    </Typography>
    <Box>{value}</Box>
  </Box>
);

export const ConfirmStep = ({
  data,
  onFinish,
  disabled,
  onBack,
}: {
  data: SetupData;
  onFinish: () => void;
  disabled?: boolean;
  onBack: () => void;
}) => {
  const { t } = useTranslation();
  const { features } = useSetup();
  const congregationType =
    data.congregation.type || t('setup.form.defaultType');

  const form = useForm<{ noop: boolean }>({
    defaultValues: {
      noop: true,
    },
  });

  const featureTitleById = useMemo(() => {
    const byId = new Map<string, string>();
    features.forEach((feature) => {
      byId.set(feature.id, feature.title);
    });
    return byId;
  }, [features]);

  return (
    <FormContainer<{ noop: boolean }>
      form={form}
      onSubmit={() => onFinish()}
      title={t('setup.form.confirm')}
      subtitle={t('setup.form.confirmSubtitle', { type: congregationType })}
      submitText={t('setup.form.submitText')}
      disabled={disabled}
      onCancel={onBack}
      cancelText={t('form.field.back')}
    >
      <Typography variant="h6" gutterBottom>
        {t('setup.confirm.review')}
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
        <ConfirmSection
          title={t('setup.confirm.sections.congregation', {
            type: congregationType,
          })}
        >
          <FieldRow
            label={t('form.field.name')}
            value={
              <Typography variant="body2">
                {data.congregation.name || '-'}
              </Typography>
            }
          />
          <FieldRow
            label={t('form.field.type')}
            value={
              <Typography variant="body2">
                {data.congregation.type || '-'}
              </Typography>
            }
          />
        </ConfirmSection>

        <ConfirmSection title={t('setup.confirm.sections.features')}>
          <FieldRow
            label={t('setup.confirm.sections.features')}
            value={
              data.features.features.length > 0 ? (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {data.features.features.map((feature) => (
                    <Chip
                      key={feature}
                      label={featureTitleById.get(feature) ?? feature}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2">
                  {t('setup.confirm.none')}
                </Typography>
              )
            }
          />
        </ConfirmSection>

        <ConfirmSection title={t('setup.confirm.sections.locations')}>
          <FieldRow
            label={t('setup.confirm.sections.locations')}
            value={
              data.locations.locations.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {data.locations.locations.map((location) => (
                    <Typography
                      variant="body2"
                      key={`${location.order}-${location.name}-${location.address}`}
                    >
                      {location.order}. {location.name} -{' '}
                      {location.address || '-'}
                    </Typography>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2">
                  {t('setup.confirm.none')}
                </Typography>
              )
            }
          />
        </ConfirmSection>

        <ConfirmSection title={t('setup.confirm.sections.admin')}>
          <FieldRow
            label={t('form.field.username')}
            value={
              <Typography variant="body2">
                {data.admin.username || '-'}
              </Typography>
            }
          />
          <FieldRow
            label={t('form.field.name')}
            value={
              <Typography variant="body2">{data.admin.name || '-'}</Typography>
            }
          />
          <FieldRow
            label={t('setup.confirm.fullAccessRole')}
            value={
              <Typography variant="body2">
                {data.admin.roleName || '-'}
              </Typography>
            }
          />
        </ConfirmSection>
      </Box>
    </FormContainer>
  );
};

export default ConfirmStep;
