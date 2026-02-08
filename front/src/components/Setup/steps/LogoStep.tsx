import { Box, Typography } from '@mui/material';
import { useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNotificationContext } from '../../../hooks/useNotifications';
import { useSetup } from '../../../hooks/useSetup';
import { SetupData } from '../../../types/setup.types';
import { ImageTypes } from '../../../utils/constants';
import FileUploader from '../../common/FileUploader';
import { FormContainer } from '../../common/FormContainer';

export const LogoStep = ({
  goNext,
  goBack,
  loading,
}: {
  goNext: () => void;
  goBack: () => void;
  loading?: boolean;
}) => {
  const { t } = useTranslation();
  const { setupData, setSetupData } = useSetup();
  const { showNotification } = useNotificationContext();
  const form = useForm<SetupData['logo']>({
    defaultValues: {
      small: setupData.logo.small,
      large: setupData.logo.large,
    },
  });

  const smallLogo = useWatch({
    control: form.control,
    name: 'small',
  });
  const largeLogo = useWatch({
    control: form.control,
    name: 'large',
  });

  const smallImageUrl =
    smallLogo?.url ||
    (smallLogo?.data ? URL.createObjectURL(smallLogo.data) : null);
  const largeImageUrl =
    largeLogo?.url ||
    (largeLogo?.data ? URL.createObjectURL(largeLogo.data) : null);

  const handleFileChange = useCallback(
    (field: keyof SetupData['logo']) => (uploadedFile: File | FileList) => {
      const fileToUse =
        uploadedFile instanceof FileList ? uploadedFile[0] : uploadedFile;
      if (!fileToUse) return;

      form.setValue(
        field,
        {
          url: URL.createObjectURL(fileToUse),
          data: fileToUse,
        },
        { shouldValidate: true },
      );
      form.clearErrors(field);
    },
    [form],
  );

  const handleDeleteImage = useCallback(
    (field: keyof SetupData['logo']) => () => {
      form.setValue(field, null, { shouldValidate: true });
    },
    [form],
  );

  const handleNext = useCallback(
    (values: SetupData['logo']) => {
      let hasError = false;

      if (!values.small) {
        hasError = true;
        form.setError('small', {
          type: 'required',
          message: t('setup.form.logoRequired'),
        });
      }
      if (!values.large) {
        hasError = true;
        form.setError('large', {
          type: 'required',
          message: t('setup.form.logoRequired'),
        });
      }

      if (hasError) return;

      setSetupData((prev) => ({ ...prev, logo: values }));
      goNext();
    },
    [form, goNext, setSetupData, t],
  );

  return (
    <FormContainer<SetupData['logo']>
      form={form}
      onSubmit={handleNext}
      title={t('setup.form.logo')}
      subtitle={t('setup.form.logoText')}
      submitText={t('form.field.next')}
      loading={loading}
      onCancel={goBack}
      cancelText={t('form.field.back')}
    >
      <Box sx={{ display: 'grid', gap: 2 }}>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t('setup.form.smallLogo')}
          </Typography>
          <FileUploader
            multiple={false}
            handleChange={handleFileChange('small')}
            name="smallLogo"
            types={ImageTypes}
            maxSize={2}
            showMenu={Boolean(smallImageUrl)}
            onDelete={handleDeleteImage('small')}
            previewImage={smallImageUrl || undefined}
            previewAlt={t('setup.form.smallLogoPreviewAlt')}
            onTypeError={() =>
              showNotification(t('setup.form.logoTypeError'), {
                severity: 'error',
              })
            }
          >
            {!smallImageUrl ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <span>{t('setup.form.uploadSmallLogo')}</span>
                <span style={{ fontSize: '12px', color: '#999' }}>
                  {t('setup.form.supportedFormats')} {ImageTypes.join(', ')}
                </span>
              </Box>
            ) : null}
          </FileUploader>
          {form.formState.errors.small?.message ? (
            <Typography variant="caption" color="error">
              {form.formState.errors.small.message}
            </Typography>
          ) : null}
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t('setup.form.largeLogo')}
          </Typography>
          <FileUploader
            multiple={false}
            handleChange={handleFileChange('large')}
            name="largeLogo"
            types={ImageTypes}
            maxSize={2}
            showMenu={Boolean(largeImageUrl)}
            onDelete={handleDeleteImage('large')}
            previewImage={largeImageUrl || undefined}
            previewAlt={t('setup.form.largeLogoPreviewAlt')}
            onTypeError={() =>
              showNotification(t('setup.form.logoTypeError'), {
                severity: 'error',
              })
            }
          >
            {!largeImageUrl ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <span>{t('setup.form.uploadLargeLogo')}</span>
                <span style={{ fontSize: '12px', color: '#999' }}>
                  {t('setup.form.supportedFormats')} {ImageTypes.join(', ')}
                </span>
              </Box>
            ) : null}
          </FileUploader>
          {form.formState.errors.large?.message ? (
            <Typography variant="caption" color="error">
              {form.formState.errors.large.message}
            </Typography>
          ) : null}
        </Box>
      </Box>
    </FormContainer>
  );
};

export default LogoStep;
