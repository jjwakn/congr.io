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
import { CRUD_AUDIT_COLUMN_IDS } from './crudAuditColumns';

const areStringArraysEqual = (left: string[], right: string[]) =>
  left.length === right.length && left.every((value, index) => right[index] === value);

const auditColumnIdSet = new Set<string>(CRUD_AUDIT_COLUMN_IDS);

const getLabelText = (label: ModuleColumnVisibilityDialogProps['options'][number]['label'], fallback: string) => {
  if (typeof label !== 'string' && typeof label !== 'number') return fallback;

  return String(label).trim() || fallback;
};

export const ModuleColumnVisibilityDialog = ({
  open,
  title,
  options,
  visibleIds,
  defaultVisibleIds,
  onClose,
  onSave,
}: ModuleColumnVisibilityDialogProps) => {
  const { i18n, t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [draftVisibleIds, setDraftVisibleIds] = useState<string[]>(visibleIds);

  const hasChanges = useMemo(() => !areStringArraysEqual(draftVisibleIds, visibleIds), [draftVisibleIds, visibleIds]);
  const resetVisibleIds = defaultVisibleIds ?? visibleIds;
  const isDefaultDraft = useMemo(
    () => areStringArraysEqual(draftVisibleIds, resetVisibleIds),
    [draftVisibleIds, resetVisibleIds],
  );

  const sortedOptions = useMemo(() => {
    const collator = new Intl.Collator(i18n.language, { numeric: true, sensitivity: 'base' });

    return [...options].sort((left, right) => {
      if (left.id === 'id' || right.id === 'id') return left.id === 'id' ? -1 : 1;

      const leftIsAudit = auditColumnIdSet.has(left.id);
      const rightIsAudit = auditColumnIdSet.has(right.id);

      if (leftIsAudit !== rightIsAudit) return leftIsAudit ? 1 : -1;

      return collator.compare(getLabelText(left.label, left.id), getLabelText(right.label, right.id));
    });
  }, [i18n.language, options]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" fullScreen={isMobile}>
      <DialogTitleBar title={title} onClose={onClose} />

      <DialogContent>
        <List disablePadding>
          {sortedOptions.map((option) => (
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
        <Button disabled={isDefaultDraft} onClick={() => setDraftVisibleIds(resetVisibleIds)}>
          {t('pages.settings.actions.reset')}
        </Button>
        <Button onClick={onClose}>{t('form.field.cancel')}</Button>
        <Button variant="contained" disabled={!hasChanges} onClick={() => onSave(draftVisibleIds)}>
          {t('form.field.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
