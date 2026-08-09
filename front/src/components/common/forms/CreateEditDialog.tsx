import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  type SxProps,
  type Theme,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useMemo } from 'react';
import { CreateEditDialogProps } from './CreateEditDialog.types';
import { DialogTitleBar } from './DialogTitleBar';

const DEFAULT_CONTENT_SX = {
  mt: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
} as const;

const mergeSx = (...values: Array<SxProps<Theme> | undefined>): SxProps<Theme> =>
  values.reduce<Array<Exclude<SxProps<Theme>, null | undefined | false>>>((accumulator, value) => {
    if (!value) return accumulator;

    if (Array.isArray(value)) {
      value.forEach((nestedValue) => {
        if (nestedValue) accumulator.push(nestedValue);
      });

      return accumulator;
    }

    accumulator.push(value);
    return accumulator;
  }, []) as SxProps<Theme>;

export const CreateEditDialog = ({
  open,
  mode,
  submitting,
  submitDisabled = false,
  onClose,
  onSubmit,
  onEnter,
  maxWidth = 'md',
  fullWidth = true,
  mobileFullScreen = true,
  contentSx,
  extraActions,
  children,
  labels,
}: CreateEditDialogProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const title = useMemo(
    () => (mode === 'create' ? labels.createTitle : labels.editTitle),
    [labels.createTitle, labels.editTitle, mode],
  );

  const submitLabel = useMemo(
    () => (mode === 'create' ? labels.createSubmit : labels.editSubmit),
    [labels.createSubmit, labels.editSubmit, mode],
  );

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth={fullWidth}
      maxWidth={maxWidth}
      fullScreen={mobileFullScreen && isMobile}
      TransitionProps={onEnter ? { onEnter } : undefined}
    >
      <DialogTitleBar title={title} closeDisabled={submitting} onClose={onClose} />

      <DialogContent>
        <Box sx={mergeSx(DEFAULT_CONTENT_SX, contentSx)}>{children}</Box>
      </DialogContent>

      <DialogActions>
        {extraActions ? <Box sx={{ mr: 'auto', display: 'flex', gap: 1 }}>{extraActions}</Box> : null}
        <Button onClick={onClose} disabled={submitting}>
          {labels.cancel}
        </Button>
        <Button onClick={onSubmit} variant="contained" disabled={submitting || submitDisabled}>
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
