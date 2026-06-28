import { ViewDialog } from '@components/common/forms/ViewDialog';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { IconButton, TextField, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { EventTypeDetailsDialogProps } from './eventTypes.types';

export const EventTypeDetailsDialog = ({
  open,
  eventType,
  editDisabled,
  onClose,
  onEdit,
}: EventTypeDetailsDialogProps) => {
  const { t } = useTranslation();
  const editLabel = t('pages.settings.eventTypes.actions.edit');

  return (
    <ViewDialog
      open={open}
      title={t('pages.settings.eventTypes.dialogs.viewTitle')}
      closeLabel={t('form.field.close')}
      onClose={onClose}
      titleAction={
        <Tooltip title={editLabel}>
          <span>
            <IconButton onClick={onEdit} disabled={editDisabled} aria-label={editLabel}>
              <EditOutlinedIcon />
            </IconButton>
          </span>
        </Tooltip>
      }
    >
      <TextField
        fullWidth
        label={t('form.field.name')}
        value={eventType?.name ?? ''}
        slotProps={{ input: { readOnly: true } }}
      />
      <TextField
        fullWidth
        multiline
        minRows={3}
        label={t('pages.settings.eventTypes.fields.description')}
        value={eventType?.description ?? ''}
        slotProps={{ input: { readOnly: true } }}
      />
    </ViewDialog>
  );
};
