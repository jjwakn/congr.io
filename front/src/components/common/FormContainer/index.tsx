import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Tooltip,
  Typography,
} from '@mui/material';
import { FieldValues, FormProvider } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { FormContainerProps } from './FormContainer.types';

export const FormContainer = <FormData extends FieldValues>({
  children,
  form,
  onSubmit,
  loading,
  title,
  subtitle,
  disabled,
  submitText,
  loadingTooltip,
  onCancel,
  cancelText,
}: FormContainerProps<FormData>) => {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
        maxWidth: 500,
        width: '100%',
      }}
    >
      <Card sx={{ width: '100%' }}>
        <CardContent sx={{ padding: 3 }}>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {title ? (
                <Typography variant="h4" align="center">
                  {title}
                </Typography>
              ) : null}

              {subtitle ? (
                <Typography
                  variant="body1"
                  gutterBottom
                  align="center"
                  color="text.secondary"
                  sx={{ mb: 3, whiteSpace: 'pre-line' }}
                >
                  {subtitle}
                </Typography>
              ) : null}

              {children}

              <Box
                sx={{
                  mt: 3,
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center',
                }}
              >
                {onCancel ? (
                  <Button
                    fullWidth
                    variant="outlined"
                    disabled={disabled}
                    onClick={onCancel}
                  >
                    {cancelText ?? t('form.field.cancel')}
                  </Button>
                ) : null}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={disabled}
                >
                  {submitText}
                </Button>

                {loading ? (
                  <Tooltip title={loadingTooltip} placement="top">
                    <CircularProgress size="2rem" />
                  </Tooltip>
                ) : null}
              </Box>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </Box>
  );
};
