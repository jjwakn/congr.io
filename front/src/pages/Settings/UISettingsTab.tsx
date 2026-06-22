import { useAppContext } from '@hooks/useAppContext';
import { useAuth } from '@hooks/useAuth';
import { useNotificationContext } from '@hooks/useNotifications';
import { useSetup } from '@hooks/useSetup';
import { useTheme } from '@hooks/useTheme';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import {
  Button,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { UsersService } from '@services/users';
import { FRONTEND_VERSION } from '@utils/constants';
import { HttpRequestError, httpRequest } from '@utils/http';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { UISettingsTabProps } from './settings.types';

export const UISettingsTab = ({ language, onLanguageChange }: UISettingsTabProps) => {
  const { t } = useTranslation();
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
          return leftLabel.localeCompare(rightLabel);
        }),
    [visibleSections],
  );
  const [pageSizes, setPageSizes] = useState<Record<string, number>>(() => ({
    default: 50,
    ...(user?.preferences?.page_sizes ?? {}),
  }));
  const [sidebarOrder, setSidebarOrder] = useState<string[]>(() => {
    const stored = user?.preferences?.sidebar_order ?? [];
    return [...stored.filter((id) => defaultOrder.includes(id)), ...defaultOrder.filter((id) => !stored.includes(id))];
  });
  const [saving, setSaving] = useState(false);
  const pageSizeOptions = [10, 25, 50, 100, 250];

  const savePreferences = async () => {
    setSaving(true);
    try {
      await httpRequest({
        service: UsersService.updatePreferences,
        data: { page_sizes: pageSizes, sidebar_order: sidebarOrder },
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
  };

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
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

        <Button
          variant="outlined"
          fullWidth
          startIcon={mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          onClick={toggleMode}
          aria-label={t('pages.settings.themeMode.ariaLabel')}
          sx={{ minHeight: 40 }}
        >
          {mode === 'dark' ? t('pages.settings.themeMode.toggleToLight') : t('pages.settings.themeMode.toggleToDark')}
        </Button>
      </Stack>

      <Divider />
      <Typography variant="h6">{t('pages.settings.interface.paginationTitle')}</Typography>
      <Typography variant="body2" color="text.secondary">
        {t('pages.settings.interface.paginationDescription')}
      </Typography>
      <FormControl fullWidth>
        <InputLabel id="default-page-size-label">{t('pages.settings.interface.defaultPageSize')}</InputLabel>
        <Select
          labelId="default-page-size-label"
          label={t('pages.settings.interface.defaultPageSize')}
          value={pageSizes.default ?? 50}
          onChange={(event) => setPageSizes((current) => ({ ...current, default: Number(event.target.value) }))}
        >
          {pageSizeOptions.map((size) => (
            <MenuItem key={size} value={size}>
              {size}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} useFlexGap flexWrap="wrap">
        {visibleSections.map((section) => (
          <FormControl key={section.id} sx={{ minWidth: 180, flex: 1 }}>
            <InputLabel id={`${section.id}-page-size-label`}>{section.label}</InputLabel>
            <Select
              labelId={`${section.id}-page-size-label`}
              label={section.label}
              value={pageSizes[`${section.id}-list`] ?? pageSizes.default ?? 50}
              onChange={(event) =>
                setPageSizes((current) => ({
                  ...current,
                  [`${section.id}-list`]: Number(event.target.value),
                }))
              }
            >
              {pageSizeOptions.map((size) => (
                <MenuItem key={size} value={size}>
                  {size}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ))}
      </Stack>

      <Divider />
      <Typography variant="h6">{t('pages.settings.interface.sidebarTitle')}</Typography>
      <Typography variant="body2" color="text.secondary">
        {t('pages.settings.interface.sidebarDescription')}
      </Typography>
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

      <Button variant="contained" onClick={() => void savePreferences()} disabled={saving}>
        {t('pages.settings.actions.save')}
      </Button>

      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'right' }}>
        {t('pages.settings.frontendVersion', { version: FRONTEND_VERSION })}
      </Typography>
    </Stack>
  );
};
