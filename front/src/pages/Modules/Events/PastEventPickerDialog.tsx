import { DialogTitleBar } from '@components/common/forms/DialogTitleBar';
import {
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
  TextField,
} from '@mui/material';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import type { PastEventPickerDialogProps } from './PastEventPickerDialog.types';

const getEventLabel = (event: PastEventPickerDialogProps['events'][number], language: string) =>
  `${event.name} · ${DateTime.fromISO(event.start_datetime).setLocale(language).toLocaleString(DateTime.DATETIME_MED)}`;

export const PastEventPickerDialog = ({
  confirmLabel,
  eventLabel,
  events,
  loading,
  loadingLabel,
  noOptionsLabel,
  onChange,
  onClose,
  onConfirm,
  open,
  selectedEvent,
  title,
}: PastEventPickerDialogProps) => {
  const { i18n, t } = useTranslation();

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitleBar title={title} closeDisabled={loading} onClose={onClose} />
      <DialogContent dividers>
        <Stack spacing={2}>
          <Autocomplete<PastEventPickerDialogProps['events'][number], false, false, false>
            value={selectedEvent}
            options={events}
            loading={loading}
            noOptionsText={noOptionsLabel}
            getOptionLabel={(event) => getEventLabel(event, i18n.language)}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onChange={(_event, value) => onChange(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label={eventLabel}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading ? <CircularProgress color="inherit" size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {t('form.field.cancel')}
        </Button>
        <Button variant="contained" onClick={onConfirm} disabled={loading || !selectedEvent}>
          {loading ? loadingLabel : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
