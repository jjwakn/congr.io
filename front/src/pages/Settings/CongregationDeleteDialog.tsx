import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CongregationDeleteDialogProps } from './settings.types';

export const CongregationDeleteDialog = ({
  congregation,
  preview,
  confirming,
  onClose,
  onConfirm,
}: CongregationDeleteDialogProps) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmationName, setConfirmationName] = useState('');
  const counts = [
    ['usersDeleted', preview.usersDeleted],
    ['usersDetached', preview.usersDetached],
    ['locationsDeleted', preview.locationsDeleted],
    ['locationsDetached', preview.locationsDetached],
    ['events', preview.events],
    ['eventTypes', preview.eventTypes],
    ['processes', preview.processes],
    ['processSteps', preview.processSteps],
    ['configurations', preview.configurations],
  ] as const;
  const matchesName = confirmationName.trim() === congregation.name;

  return (
    <Dialog open fullWidth maxWidth="sm" onClose={confirming ? undefined : onClose}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        {t('pages.settings.congregation.delete.title', { name: congregation.name })}
        <Tooltip title={t('form.field.close')}>
          <IconButton onClick={onClose} disabled={confirming} aria-label={t('form.field.close')}>
            <CloseRoundedIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <DialogContent dividers>
        {step === 1 ? (
          <>
            <Alert severity="error" sx={{ mb: 2 }}>
              {t('pages.settings.congregation.delete.dataLossWarning')}
            </Alert>
            <Typography variant="body2">{t('pages.settings.congregation.delete.previewDescription')}</Typography>
            <List dense>
              {counts.map(([key, count]) => (
                <ListItem key={key} disableGutters>
                  <ListItemText primary={t(`pages.settings.congregation.delete.counts.${key}`, { count })} />
                </ListItem>
              ))}
            </List>
          </>
        ) : (
          <>
            <Alert severity="error" sx={{ mb: 2 }}>
              {t('pages.settings.congregation.delete.finalWarning')}
            </Alert>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {t('pages.settings.congregation.delete.typeName', { name: congregation.name })}
            </Typography>
            <TextField
              autoFocus
              fullWidth
              value={confirmationName}
              label={t('pages.settings.congregation.delete.confirmationLabel')}
              onChange={(event) => setConfirmationName(event.target.value)}
            />
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={confirming}>
          {t('form.field.cancel')}
        </Button>
        {step === 1 ? (
          <Button color="error" variant="contained" onClick={() => setStep(2)}>
            {t('pages.settings.congregation.delete.continue')}
          </Button>
        ) : (
          <Button color="error" variant="contained" onClick={onConfirm} disabled={confirming || !matchesName}>
            {t('pages.settings.congregation.delete.confirm')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
