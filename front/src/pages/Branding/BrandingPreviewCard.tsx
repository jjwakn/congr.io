import { Alert, Box, Card, CardContent, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { BrandingPreviewCardProps } from './BrandingPreviewCard.types';

const BrandingPreviewCard = ({ previews, isLoading, error }: BrandingPreviewCardProps) => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="h6">{t('brandingGenerator.previewsTitle')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('brandingGenerator.previewsIntro')}
          </Typography>
        </Box>

        {error ? <Alert severity="error">{error}</Alert> : null}
        {isLoading ? (
          <Typography variant="body2" color="text.secondary">
            {t('brandingGenerator.previewsLoading')}
          </Typography>
        ) : null}

        {!isLoading && !error && previews.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t('brandingGenerator.previewsEmpty')}
          </Typography>
        ) : null}

        {previews.length > 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            {previews.map((item) => (
              <Box
                key={item.id}
                sx={{
                  flex: { xs: '1 1 100%', sm: '1 1 220px' },
                  minWidth: { xs: 0, sm: 220 },
                  maxWidth: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    height: 120,
                    borderRadius: 1,
                    bgcolor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    p: 1,
                  }}
                >
                  <Box
                    component="img"
                    src={item.url}
                    alt={item.label}
                    sx={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                    }}
                  />
                </Box>

                <Typography variant="subtitle2">{item.label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.path}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default BrandingPreviewCard;
