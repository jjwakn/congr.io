import { DialogTitleBar } from '@components/common/forms/DialogTitleBar';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  FormControlLabel,
  List,
  ListItem,
  Switch,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ModuleColumnVisibilityDialogProps } from './ModuleColumnVisibilityDialog.types';

const areStringArraysEqual = (left: string[], right: string[]) =>
  left.length === right.length && left.every((value, index) => right[index] === value);

export const ModuleColumnVisibilityDialog = ({
  open,
  title,
  options,
  visibleIds,
  onClose,
  onSave,
}: ModuleColumnVisibilityDialogProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [draftVisibleIds, setDraftVisibleIds] = useState<string[]>(visibleIds);

  const hasChanges = useMemo(() => !areStringArraysEqual(draftVisibleIds, visibleIds), [draftVisibleIds, visibleIds]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" fullScreen={isMobile}>
      <DialogTitleBar title={title} onClose={onClose} />

      <DialogContent>
        <List disablePadding>
          {options.map((option) => (
            <ListItem key={option.id} disableGutters>
              <FormControlLabel
                control={
                  <Switch
                    checked={draftVisibleIds.includes(option.id)}
                    disabled={option.disabled}
                    onChange={(_event, checked) => {
                      setDraftVisibleIds((currentVisibleIds) =>
                        checked
                          ? Array.from(new Set([...currentVisibleIds, option.id]))
                          : currentVisibleIds.filter((columnId) => columnId !== option.id),
                      );
                    }}
                  />
                }
                label={option.label}
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t('form.field.cancel')}</Button>
        <Button variant="contained" disabled={!hasChanges} onClick={() => onSave(draftVisibleIds)}>
          {t('form.field.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
