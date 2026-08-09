import { DialogTitleBar } from '@components/common/forms/DialogTitleBar';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
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
import type { UIEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { PastEventPickerDialogProps } from './PastEventPickerDialog.types';

const getEventLabel = (event: PastEventPickerDialogProps['events'][number], language: string) =>
  `${DateTime.fromISO(event.start_datetime).setLocale(language).toFormat('yyyy/LLL/dd, HH:mm')} · ${event.name}`;

export const PastEventPickerDialog = ({
  confirmLabel,
  eventLabel,
  events,
  hasMore,
  loading,
  loadingLabel,
  noOptionsLabel,
  onChange,
  onClose,
  onConfirm,
  onLoadMore,
  onSearchChange,
  open,
  search,
  selectedEvent,
  title,
}: PastEventPickerDialogProps) => {
  const { i18n, t } = useTranslation();
  const handleScroll = (event: UIEvent<HTMLUListElement>) => {
    const list = event.currentTarget;
    const isNearBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 24;
    if (isNearBottom && hasMore && !loading) onLoadMore();
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitleBar title={title} closeDisabled={loading} onClose={onClose} />
      <DialogContent dividers>
        <Stack spacing={2}>
          <Autocomplete<PastEventPickerDialogProps['events'][number], false, false, false>
            value={selectedEvent}
            options={events}
            loading={loading}
            inputValue={selectedEvent ? getEventLabel(selectedEvent, i18n.language) : search}
            clearIcon={<ClearRoundedIcon />}
            clearOnEscape
            filterOptions={(options) => options}
            noOptionsText={noOptionsLabel}
            getOptionLabel={(event) => getEventLabel(event, i18n.language)}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onChange={(_event, value) => {
              onSearchChange('');
              onChange(value);
            }}
            onInputChange={(_event, value, reason) => {
              if (reason === 'input') {
                if (selectedEvent) onChange(null);
                onSearchChange(value);
              }
              if (reason === 'clear') {
                onChange(null);
                onSearchChange('');
              }
            }}
            ListboxProps={{ onScroll: handleScroll }}
            sx={{
              '& .MuiAutocomplete-clearIndicator': {
                visibility: selectedEvent ? 'visible' : undefined,
              },
            }}
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
