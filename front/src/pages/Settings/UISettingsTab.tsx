import { useAppContext } from '@hooks/useAppContext';
import { useAuth } from '@hooks/useAuth';
import { useNotificationContext } from '@hooks/useNotifications';
import { useSetup } from '@hooks/useSetup';
import { useTheme } from '@hooks/useTheme';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import LightModeIcon from '@mui/icons-material/LightMode';
import SortByAlphaRoundedIcon from '@mui/icons-material/SortByAlphaRounded';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Button,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { UsersService } from '@services/users';
import { FRONTEND_VERSION } from '@utils/constants';
import { HttpRequestError, httpRequest } from '@utils/http';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { UISettingsTabProps } from './settings.types';

export const UISettingsTab = ({ language, onLanguageChange }: UISettingsTabProps) => {
  const { i18n, t } = useTranslation();
  const { mode, toggleMode } = useTheme();
  const { congregation } = useAppContext();
  const { user, hasPermission, refreshSession } = useAuth();
  const { showNotification } = useNotificationContext();
  const { features } = useSetup();
  const visibleSections = useMemo(() => {
    const byId = new Map(features.map((feature) => [feature.id, feature.title]));
    const permissions: Record<string, [string, 'get']> = {
      users: ['user', 'get'],
      members: ['person', 'get'],
      processes: ['process', 'get'],
      events_calendar: ['event', 'get'],
      events_attendance: ['event_attendance', 'get'],
    };
    const ids = (congregation?.features ?? []).filter((id) =>
      permissions[id] ? hasPermission(...permissions[id]) : false,
    );
    if (ids.includes('users') && hasPermission('role', 'get')) ids.push('roles');
    if (ids.includes('events_attendance') && hasPermission('event_registration', 'get')) ids.push('event_registration');
    return Array.from(new Set(ids)).map((id) => ({
      id,
      label:
        id === 'roles'
          ? t('pages.modules.roles.title')
          : id === 'event_registration'
            ? t('pages.registration.title')
            : (byId.get(id) ?? id),
    }));
  }, [congregation?.features, features, hasPermission, t]);
  const defaultOrder = useMemo(
    () =>
      visibleSections
        .map(({ id }) => id)
        .sort((left, right) => {
          const leftLabel = visibleSections.find(({ id }) => id === left)?.label ?? left;
          const rightLabel = visibleSections.find(({ id }) => id === right)?.label ?? right;
          return leftLabel.localeCompare(rightLabel, i18n.language, { sensitivity: 'base' });
        }),
    [i18n.language, visibleSections],
  );
  const [pageSizes, setPageSizes] = useState<Record<string, number>>(() => ({
    default: 50,
    ...(user?.preferences?.page_sizes ?? {}),
  }));
  const [sidebarOrder, setSidebarOrder] = useState<string[]>(() => {
    const stored = user?.preferences?.sidebar_order ?? [];
    return [...stored.filter((id) => defaultOrder.includes(id)), ...defaultOrder.filter((id) => !stored.includes(id))];
  });
  const [sidebarReset, setSidebarReset] = useState(false);
  const [saving, setSaving] = useState(false);
  const pageSizeOptions = [10, 25, 50, 100, 250];
  const sidebarOrderChanged = sidebarReset || sidebarOrder.some((id, index) => id !== defaultOrder[index]);

  const savePreferences = async () => {
    setSaving(true);
    try {
      await httpRequest({
        service: UsersService.updatePreferences,
        data: { page_sizes: pageSizes, sidebar_order: sidebarReset ? [] : sidebarOrderChanged ? sidebarOrder : [] },
      });
      await refreshSession();
      showNotification(t('pages.settings.success.saved'), { severity: 'success' });
    } catch (value) {
      const message =
        value instanceof HttpRequestError || value instanceof Error
          ? value.message
          : t('pages.settings.error.saveFailed');
      showNotification(message, { severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const moveSection = (index: number, offset: number) => {
    const target = index + offset;
    if (target < 0 || target >= sidebarOrder.length) return;
    setSidebarOrder((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setSidebarReset(false);
  };

  return (
    <Stack spacing={2}>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
          <Typography variant="h6">{t('pages.settings.interface.browser')}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1.5}>
            <FormControl fullWidth>
              <InputLabel id="settings-language-label">{t('pages.settings.language.label')}</InputLabel>
              <Select
                labelId="settings-language-label"
                value={language}
                label={t('pages.settings.language.label')}
                onChange={onLanguageChange}
              >
                <MenuItem value="en">{t('pages.settings.language.english')}</MenuItem>
                <MenuItem value="es">{t('pages.settings.language.spanish')}</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={mode === 'dark'}
                  onChange={() => toggleMode()}
                  icon={<LightModeIcon fontSize="small" />}
                  checkedIcon={<DarkModeIcon fontSize="small" />}
                  inputProps={{ 'aria-label': t('pages.settings.themeMode.ariaLabel') }}
                />
              }
              label={
                mode === 'dark'
                  ? t('pages.settings.themeMode.toggleToLight')
                  : t('pages.settings.themeMode.toggleToDark')
              }
            />
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
          <Typography variant="h6">{t('pages.settings.interface.paginationTitle')}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary">
              {t('pages.settings.interface.paginationDescription')}
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('pages.settings.interface.section')}</TableCell>
                  <TableCell width={180}>{t('pages.settings.interface.itemsPerPage')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[{ id: 'default', label: t('pages.settings.interface.defaultPageSize') }, ...visibleSections].map(
                  (section) => {
                    const key = section.id === 'default' ? 'default' : `${section.id}-list`;
                    return (
                      <TableRow key={key}>
                        <TableCell>{section.label}</TableCell>
                        <TableCell>
                          <Autocomplete
                            freeSolo
                            options={pageSizeOptions.map(String)}
                            value={String(pageSizes[key] ?? pageSizes.default ?? 50)}
                            onChange={(_event, value) => {
                              const parsed = Number(value);
                              if (!Number.isInteger(parsed)) return;
                              setPageSizes((current) => ({ ...current, [key]: parsed }));
                            }}
                            onInputChange={(_event, value) => {
                              const parsed = Number(value);
                              if (!Number.isInteger(parsed) || parsed < 5 || parsed > 500) return;
                              setPageSizes((current) => ({ ...current, [key]: parsed }));
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                size="small"
                                inputProps={{ ...params.inputProps, inputMode: 'numeric' }}
                              />
                            )}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  },
                )}
              </TableBody>
            </Table>
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
          <Typography variant="h6">{t('pages.settings.interface.sidebarTitle')}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                {t('pages.settings.interface.sidebarDescription')}
              </Typography>
              <Button
                startIcon={<SortByAlphaRoundedIcon />}
                onClick={() => {
                  setSidebarOrder(defaultOrder);
                  setSidebarReset(true);
                }}
              >
                {t('pages.settings.interface.sortAlphabetically')}
              </Button>
            </Stack>
            <List dense disablePadding>
              {sidebarOrder.map((id, index) => (
                <ListItem
                  key={id}
                  divider
                  secondaryAction={
                    <Stack direction="row">
                      <IconButton
                        aria-label={t('form.common.moveUp')}
                        disabled={index === 0}
                        onClick={() => moveSection(index, -1)}
                      >
                        <ArrowUpwardRoundedIcon />
                      </IconButton>
                      <IconButton
                        aria-label={t('form.common.moveDown')}
                        disabled={index === sidebarOrder.length - 1}
                        onClick={() => moveSection(index, 1)}
                      >
                        <ArrowDownwardRoundedIcon />
                      </IconButton>
                    </Stack>
                  }
                >
                  <ListItemText primary={visibleSections.find((section) => section.id === id)?.label ?? id} />
                </ListItem>
              ))}
            </List>
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Button variant="contained" onClick={() => void savePreferences()} disabled={saving}>
        {t('pages.settings.actions.save')}
      </Button>

      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'right' }}>
        {t('pages.settings.frontendVersion', { version: FRONTEND_VERSION })}
      </Typography>
    </Stack>
  );
};
