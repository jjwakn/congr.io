import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Tooltip,
  Typography,
} from '@mui/material';
import { ReactNode } from 'react';
import { FieldValues, FormProvider, UseFormReturn } from 'react-hook-form';

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
}: {
  children: ReactNode;
  form: UseFormReturn<FormData, unknown, FormData>;
  onSubmit: (data: FormData) => void;
  loading?: boolean;
  title?: string;
  subtitle?: string;
  disabled?: boolean;
  submitText: string;
  loadingTooltip?: string;
}) => {
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
      }}
    >
      <Card sx={{ maxWidth: 500, width: '100%' }}>
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
                  sx={{ mb: 3 }}
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
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
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
