import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { Box, DialogTitle, IconButton, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { DialogTitleBarProps } from './DialogTitleBar.types';

export const DialogTitleBar = ({ action, closeDisabled = false, onClose, title }: DialogTitleBarProps) => {
  const { t } = useTranslation();

  return (
    <DialogTitle
      sx={{
        alignItems: 'center',
        display: 'flex',
        gap: 2,
        justifyContent: 'space-between',
        pl: { xs: 2, sm: 3 },
        pr: { xs: 1, sm: 1.5 },
      }}
    >
      <Box component="span" sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {title}
      </Box>

      <Box sx={{ alignItems: 'center', display: 'inline-flex', flexShrink: 0, gap: 0.5 }}>
        {action}
        <Tooltip title={t('form.field.close')}>
          <span>
            <IconButton onClick={onClose} disabled={closeDisabled} aria-label={t('form.field.close')} sx={{ mr: 0 }}>
              <CloseRoundedIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </DialogTitle>
  );
};
