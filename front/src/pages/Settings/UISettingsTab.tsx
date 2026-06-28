import { useAppContext } from '@hooks/useAppContext';
import { useAuth } from '@hooks/useAuth';
import { useNotificationContext } from '@hooks/useNotifications';
import { useSetup } from '@hooks/useSetup';
import { useTheme } from '@hooks/useTheme';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import SortByAlphaRoundedIcon from '@mui/icons-material/SortByAlphaRounded';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { UsersService } from '@services/users';
import { FRONTEND_VERSION } from '@utils/constants';
import { HttpRequestError, httpRequest } from '@utils/http';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { JsonObject } from '@/types/json.types';
import type { UISettingsTabProps } from './settings.types';

type UiSection = 'browser' | 'pagination' | 'sidebar';
type TimeFormat = '24h' | '12h';

const normalizePageSize = (value: number) => Math.max(5, Math.min(500, Math.trunc(value || 50)));

export const UISettingsTab = ({ language, onLanguageChange }: UISettingsTabProps) => {
  const { i18n, t } = useTranslation();
  const { mode, setMode } = useTheme();
  const { congregation } = useAppContext();
  const { user, hasPermission, refreshSession } = useAuth();
  const { showNotification } = useNotificationContext();
  const { features } = useSetup();
  const [expanded, setExpanded] = useState<UiSection | false>('browser');
  const savedTimeFormat = user?.preferences?.time_format ?? '24h';
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(savedTimeFormat);
  const visibleSections = useMemo(() => {
    const byId = new Map(features.map((feature) => [feature.id, feature.title]));
    const permissions: Record<string, [string, 'get']> = {
      users: ['user', 'get'],
      members: ['person', 'get'],
      processes: ['process', 'get'],
      events_calendar: ['event', 'get'],
      events: ['event', 'get'],
      events_attendance: ['event_attendance', 'get'],
    };
    const ids = (congregation?.features ?? []).filter((id) =>
      permissions[id] ? hasPermission(...permissions[id]) : false,
    );
    if (ids.includes('events_calendar') && hasPermission('event', 'get')) ids.push('events');
    if (ids.includes('users') && hasPermission('role', 'get')) ids.push('roles');
    if (ids.includes('events_attendance') && hasPermission('event_registration', 'get')) ids.push('event_registration');
    return Array.from(new Set(ids)).map((id) => ({
      id,
      label:
        id === 'roles'
          ? t('pages.modules.roles.title')
          : id === 'events'
            ? t('pages.events.title')
            : id === 'event_registration'
              ? t('pages.registration.title')
              : id === 'events_calendar'
                ? t('pages.events.calendar')
                : (byId.get(id) ?? id),
    }));
  }, [congregation?.features, features, hasPermission, t]);
  const defaultOrder = useMemo(
    () =>
      visibleSections
        .map(({ id }) => id)
        .sort((left, right) => {
          const leftLabel = visibleSections.find((section) => section.id === left)?.label ?? left;
          const rightLabel = visibleSections.find((section) => section.id === right)?.label ?? right;
          return leftLabel.localeCompare(rightLabel, i18n.language, { sensitivity: 'base' });
        }),
    [i18n.language, visibleSections],
  );
  const savedPageSizes = useMemo(() => ({ default: 50, ...(user?.preferences?.page_sizes ?? {}) }), [user]);
  const [pageSizes, setPageSizes] = useState<Record<string, number>>(savedPageSizes);
  const [masterPageSize, setMasterPageSize] = useState(savedPageSizes.default ?? 50);
  const [sidebarOrder, setSidebarOrder] = useState<string[]>(() => {
    const stored = user?.preferences?.sidebar_order ?? [];
    return [...stored.filter((id) => defaultOrder.includes(id)), ...defaultOrder.filter((id) => !stored.includes(id))];
  });
  const [sidebarReset, setSidebarReset] = useState(false);
  const [saving, setSaving] = useState<UiSection | null>(null);
  const pageSizesChanged = JSON.stringify(pageSizes) !== JSON.stringify(savedPageSizes);
  const sidebarOrderChanged = sidebarReset || sidebarOrder.some((id, index) => id !== defaultOrder[index]);
  const browserChanged = timeFormat !== savedTimeFormat;

  const savePreferences = async (section: UiSection, data: JsonObject) => {
    setSaving(section);
    try {
      await httpRequest({ service: UsersService.updatePreferences, data });
      await refreshSession();
      showNotification(t('pages.settings.success.saved'), { severity: 'success' });
    } catch (value) {
      const message =
        value instanceof HttpRequestError || value instanceof Error
          ? value.message
          : t('pages.settings.error.saveFailed');
      showNotification(message, { severity: 'error' });
    } finally {
      setSaving(null);
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

  const resetPaginationToDefault = () => {
    setMasterPageSize(50);
    setPageSizes((current) =>
      Object.fromEntries(
        Object.keys(current).length ? Object.keys(current).map((key) => [key, 50]) : [['default', 50]],
      ),
    );
  };

  const renderSummary = (
    section: UiSection,
    title: string,
    changed: boolean,
    onSave: () => void,
    onDiscard: () => void,
    extraAction?: ReactNode,
  ) => (
    <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%', minWidth: 0 }}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          {title}
        </Typography>
        {expanded === section ? (
          <Box onClick={(event) => event.stopPropagation()} sx={{ display: 'flex', gap: 1 }}>
            {extraAction}
            <Button size="small" disabled={!changed || saving === section} onClick={onDiscard}>
              {t('form.field.discard')}
            </Button>
            <Button size="small" variant="contained" disabled={!changed || saving === section} onClick={onSave}>
              {t('pages.settings.actions.save')}
            </Button>
          </Box>
        ) : null}
      </Stack>
    </AccordionSummary>
  );

  return (
    <Stack spacing={2}>
      <Accordion expanded={expanded === 'browser'} onChange={(_event, open) => setExpanded(open ? 'browser' : false)}>
        {renderSummary(
          'browser',
          t('pages.settings.interface.browser'),
          browserChanged,
          () => void savePreferences('browser', { time_format: timeFormat }),
          () => setTimeFormat(savedTimeFormat),
        )}
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
            <ToggleButtonGroup exclusive value={mode} onChange={(_event, value) => value && setMode(value)}>
              <ToggleButton value="light">{t('pages.settings.themeMode.light')}</ToggleButton>
              <ToggleButton value="dark">{t('pages.settings.themeMode.dark')}</ToggleButton>
            </ToggleButtonGroup>
            <ToggleButtonGroup exclusive value={timeFormat} onChange={(_event, value) => value && setTimeFormat(value)}>
              <ToggleButton value="24h">{t('pages.settings.interface.time24')}</ToggleButton>
              <ToggleButton value="12h">{t('pages.settings.interface.time12')}</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion
        expanded={expanded === 'pagination'}
        onChange={(_event, open) => setExpanded(open ? 'pagination' : false)}
      >
        {renderSummary(
          'pagination',
          t('pages.settings.interface.paginationTitle'),
          pageSizesChanged,
          () => void savePreferences('pagination', { page_sizes: pageSizes }),
          () => {
            setPageSizes(savedPageSizes);
            setMasterPageSize(savedPageSizes.default ?? 50);
          },
          <Button size="small" onClick={resetPaginationToDefault}>
            {t('pages.settings.interface.resetToDefault')}
          </Button>,
        )}
        <AccordionDetails>
          <Stack spacing={1.5}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}
            >
              <TextField
                type="number"
                label={t('pages.settings.interface.defaultPageSize')}
                value={masterPageSize}
                inputProps={{ min: 5, max: 500 }}
                onChange={(event) => {
                  const value = normalizePageSize(Number(event.target.value));
                  setMasterPageSize(value);
                  setPageSizes(() =>
                    Object.fromEntries(
                      [{ id: 'default' }, ...visibleSections].map((section) => [
                        section.id === 'default' ? 'default' : `${section.id}-list`,
                        value,
                      ]),
                    ),
                  );
                }}
              />
            </Stack>
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
                        <TableCell sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <TextField
                            type="number"
                            size="small"
                            value={pageSizes[key] ?? 50}
                            inputProps={{ min: 5, max: 500 }}
                            onChange={(event) => {
                              const value = normalizePageSize(Number(event.target.value));
                              setPageSizes((current) => ({ ...current, [key]: value }));
                            }}
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

      <Accordion expanded={expanded === 'sidebar'} onChange={(_event, open) => setExpanded(open ? 'sidebar' : false)}>
        {renderSummary(
          'sidebar',
          t('pages.settings.interface.sidebarTitle'),
          sidebarOrderChanged,
          () => void savePreferences('sidebar', { sidebar_order: sidebarReset ? [] : sidebarOrder }),
          () => {
            const stored = user?.preferences?.sidebar_order ?? [];
            setSidebarOrder([
              ...stored.filter((id) => defaultOrder.includes(id)),
              ...defaultOrder.filter((id) => !stored.includes(id)),
            ]);
            setSidebarReset(false);
          },
        )}
        <AccordionDetails>
          <Stack spacing={1.5}>
            <Button
              startIcon={<SortByAlphaRoundedIcon />}
              onClick={() => {
                setSidebarOrder(defaultOrder);
                setSidebarReset(true);
              }}
              sx={{ alignSelf: 'flex-start' }}
            >
              {t('pages.settings.interface.sortAlphabetically')}
            </Button>
            <List dense disablePadding>
              {sidebarOrder.map((id, index) => (
                <ListItem
                  key={id}
                  divider
                  secondaryAction={
                    <Stack direction="row">
                      <Button
                        size="small"
                        startIcon={<ArrowUpwardRoundedIcon />}
                        disabled={index === 0}
                        onClick={() => moveSection(index, -1)}
                      >
                        {t('form.common.moveUp')}
                      </Button>
                      <Button
                        size="small"
                        startIcon={<ArrowDownwardRoundedIcon />}
                        disabled={index === sidebarOrder.length - 1}
                        onClick={() => moveSection(index, 1)}
                      >
                        {t('form.common.moveDown')}
                      </Button>
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

      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'right' }}>
        {t('pages.settings.frontendVersion', { version: FRONTEND_VERSION })}
      </Typography>
    </Stack>
  );
};
