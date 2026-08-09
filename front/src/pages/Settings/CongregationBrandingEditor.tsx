import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import { Box, Button, Stack, Typography } from '@mui/material';
import { FilesService } from '@services/files';
import { API_URL } from '@utils/constants';
import { httpRequest } from '@utils/http';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CongregationBrandingEditorProps, CongregationLogoUpload } from './settings.types';

const fileUrl = (id?: string | null) => (id ? `${API_URL.replace(/\/$/, '')}/files/public/${id}` : undefined);

export const CongregationBrandingEditor = ({
  congregationId,
  smallLogoId,
  bigLogoId,
  disabled,
  onChange,
}: CongregationBrandingEditorProps) => {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState<'small' | 'big' | null>(null);

  const upload = async (kind: 'small' | 'big', file?: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(kind);
    try {
      const form = new FormData();
      form.append('file', file);
      const uploaded = await httpRequest<CongregationLogoUpload>({
        service: kind === 'small' ? FilesService.uploadCongregationLogoSmall : FilesService.uploadCongregationLogoBig,
        data: form,
        headers: { 'X-Congregation-Id': congregationId },
      });
      onChange(kind === 'small' ? { smallLogoId: uploaded.id, bigLogoId } : { smallLogoId, bigLogoId: uploaded.id });
    } finally {
      setUploading(null);
    }
  };

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1">{t('pages.settings.congregation.branding.title')}</Typography>
      <Typography variant="body2" color="text.secondary">
        {t('pages.settings.congregation.branding.publicNotice')}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
        {(['small', 'big'] as const).map((kind) => {
          const id = kind === 'small' ? smallLogoId : bigLogoId;
          return (
            <Box
              key={kind}
              sx={{
                minHeight: 180,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.5,
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                void upload(kind, event.dataTransfer.files[0]);
              }}
            >
              {id ? (
                <Box
                  component="img"
                  src={fileUrl(id)}
                  alt={t(`pages.settings.congregation.branding.${kind}`)}
                  sx={{ maxWidth: '100%', maxHeight: 100, objectFit: 'contain' }}
                />
              ) : null}
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUploadOutlinedIcon />}
                disabled={disabled || Boolean(uploading)}
              >
                {uploading === kind
                  ? t('pages.settings.congregation.branding.uploading')
                  : t(`pages.settings.congregation.branding.${kind}`)}
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(event) => void upload(kind, event.target.files?.[0])}
                />
              </Button>
            </Box>
          );
        })}
      </Box>
    </Stack>
  );
};
