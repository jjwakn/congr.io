import type { ModuleListColumn, ModuleListHeaderCell } from '@components/common/modules/ModuleListTable.types';
import { ModuleSection } from '@components/common/modules/ModuleSection';
import { useModuleList } from '@components/common/modules/useModuleList';
import { Alert, Box, Button, MenuItem, Paper, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { ServiceAttendanceService, ServicesService } from '@services/services';
import { httpRequest } from '@utils/http';
import { DateTime } from 'luxon';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotificationContext } from '@/hooks/useNotifications';
import type {
  Service,
  ServiceAttendance,
  ServiceAttendanceCount,
  ServiceAttendanceListResponse,
  ServiceListResponse,
} from '@/types/service.types';

type PendingDeltas = Record<string, number>;

const isTodayService = (service: Service) => service.day_of_week === DateTime.local().weekday % 7;

const ServiceAttendanceManagement = () => {
  const { t } = useTranslation();
  const { showNotification } = useNotificationContext();
  const list = useModuleList({
    moduleKey: 'service-attendance-list',
    defaultSort: 'date',
    defaultDirection: 'DESC',
  });
  const saveTimerRef = useRef<number | null>(null);
  const [tab, setTab] = useState<'today' | 'history'>('today');
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [todayAttendance, setTodayAttendance] = useState<ServiceAttendance | null>(null);
  const [localCounts, setLocalCounts] = useState<ServiceAttendanceCount[]>([]);
  const [pendingDeltas, setPendingDeltas] = useState<PendingDeltas>({});
  const [rows, setRows] = useState<ServiceAttendance[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const today = DateTime.local().toISODate() ?? '';

  const loadServices = useCallback(async () => {
    const response = await httpRequest<ServiceListResponse>({
      service: ServicesService.list,
      data: { page: 0, size: 200, order: 'day_of_week', direction: 'ASC' },
    });
    const enabled = response.result.filter((service) => service.enabled);
    setServices(enabled);
    setSelectedServiceId((current) => current || enabled.find(isTodayService)?.id || enabled[0]?.id || '');
  }, []);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await httpRequest<ServiceAttendanceListResponse>({
        service: ServiceAttendanceService.list,
        data: {
          page: list.page,
          size: list.pageSize,
          order: list.sort,
          direction: list.direction,
          search: list.debouncedSearch || undefined,
        },
      });
      setRows(response.result);
      setTotal(response.total);
    } catch (value) {
      setError(value instanceof Error ? value.message : t('pages.services.attendance.error'));
    } finally {
      setLoading(false);
    }
  }, [list.debouncedSearch, list.direction, list.page, list.pageSize, list.sort, t]);

  const loadToday = useCallback(async () => {
    if (!selectedServiceId) return;
    setLoading(true);
    try {
      const response = await httpRequest<ServiceAttendanceListResponse>({
        service: ServiceAttendanceService.list,
        data: { page: 0, size: 10, order: 'date', direction: 'DESC', search: today },
      });
      const selected = response.result.find(
        (record) => record.service_id === selectedServiceId && record.date === today,
      );
      const service = services.find(({ id }) => id === selectedServiceId);
      setTodayAttendance(selected ?? null);
      setLocalCounts(
        selected?.counts ??
          service?.attendance_groups.map((group) => ({
            group_id: group.id,
            label: group.label,
            color: group.color,
            count: 0,
          })) ??
          [],
      );
    } finally {
      setLoading(false);
    }
  }, [selectedServiceId, services, today]);

  useEffect(() => {
    void loadServices();
  }, [loadServices]);

  useEffect(() => {
    void (tab === 'today' ? loadToday() : loadHistory());
  }, [loadHistory, loadToday, tab]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (tab === 'today' && !saving) void loadToday();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [loadToday, saving, tab]);

  useEffect(() => {
    if (!Object.keys(pendingDeltas).length || !selectedServiceId) return undefined;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);

    saveTimerRef.current = window.setTimeout(() => {
      const deltas = Object.entries(pendingDeltas).map(([group_id, delta]) => ({ group_id, delta }));
      setPendingDeltas({});
      setSaving(true);
      httpRequest<ServiceAttendance>({
        service: ServiceAttendanceService.delta,
        data: { service_id: selectedServiceId, date: today, deltas },
      })
        .then((record) => {
          setTodayAttendance(record);
          setLocalCounts(record.counts);
          showNotification(t('pages.services.attendance.saved'), { severity: 'success' });
        })
        .catch((value) => {
          showNotification(value instanceof Error ? value.message : t('pages.services.attendance.error'), {
            severity: 'error',
          });
        })
        .finally(() => setSaving(false));
    }, 700);

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [pendingDeltas, selectedServiceId, showNotification, t, today]);

  const changeCount = (groupId: string, delta: number) => {
    setLocalCounts((current) =>
      current.map((count) =>
        count.group_id === groupId ? { ...count, count: Math.max(0, count.count + delta) } : count,
      ),
    );
    setPendingDeltas((current) => ({ ...current, [groupId]: (current[groupId] ?? 0) + delta }));
  };

  const columns = useMemo<ModuleListColumn<ServiceAttendance>[]>(
    () => [
      { id: 'date', render: (row) => row.date },
      {
        id: 'service',
        render: (row) => services.find(({ id }) => id === row.service_id)?.name ?? row.service?.name ?? '-',
      },
      {
        id: 'count',
        render: (row) => row.counts.reduce((sum, count) => sum + count.count, 0),
      },
    ],
    [services],
  );

  const headerRows = useMemo<ModuleListHeaderCell[][]>(
    () => [
      [
        { id: 'date', label: t('pages.services.attendance.date'), sortKey: 'date' },
        { id: 'service', label: t('pages.services.attendance.service'), sortKey: 'service_id' },
        { id: 'count', label: t('pages.services.attendance.count') },
      ],
    ],
    [t],
  );

  return (
    <Stack spacing={2} sx={{ minHeight: 0, flex: 1 }}>
      <Tabs value={tab} onChange={(_event, value: 'today' | 'history') => setTab(value)}>
        <Tab value="today" label={t('pages.services.attendance.today')} />
        <Tab value="history" label={t('pages.services.attendance.history')} />
      </Tabs>

      {tab === 'today' ? (
        <Stack spacing={2}>
          <TextField
            select
            label={t('pages.services.attendance.service')}
            value={selectedServiceId}
            onChange={(event) => setSelectedServiceId(event.target.value)}
          >
            {services.map((service) => (
              <MenuItem key={service.id} value={service.id}>
                {service.name}
              </MenuItem>
            ))}
          </TextField>
          {!selectedServiceId ? <Alert severity="info">{t('pages.services.attendance.noCurrent')}</Alert> : null}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            {localCounts.map((count) => (
              <Paper key={count.group_id} variant="outlined" sx={{ flex: 1, p: 2, borderColor: count.color }}>
                <Stack spacing={1.5} alignItems="center">
                  <Typography variant="h6">{count.label}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button variant="outlined" onClick={() => changeCount(count.group_id, -1)} disabled={loading}>
                      -1
                    </Button>
                    <Typography variant="h3">{count.count}</Typography>
                    <Button variant="contained" onClick={() => changeCount(count.group_id, 1)} disabled={loading}>
                      +1
                    </Button>
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>
          {todayAttendance ? <Typography variant="body2">{todayAttendance.date}</Typography> : null}
        </Stack>
      ) : (
        <ModuleSection<ServiceAttendance>
          title=""
          alerts={error ? <Alert severity="error">{error}</Alert> : null}
          search={{
            label: t('pages.modules.common.search'),
            value: list.search,
            onChange: list.setSearch,
          }}
          refreshAction={{
            id: 'refresh-service-attendance',
            label: t('pages.modules.common.refresh'),
            onClick: () => void loadHistory(),
          }}
          table={{
            headerRows,
            columns,
            rows,
            getRowId: (row) => row.id,
            loading,
            loadingLabel: t('pages.services.attendance.loading'),
            emptyLabel: t('pages.services.attendance.empty'),
            sort: list.sort,
            direction: list.direction,
            onSort: list.handleSort,
            page: list.page,
            pageSize: list.pageSize,
            total,
            onPageChange: list.handleChangePage,
            onPageSizeChange: list.handleChangeRowsPerPage,
            rowsPerPageLabel: t('pages.modules.common.rowsPerPage'),
          }}
        />
      )}
    </Stack>
  );
};

export default ServiceAttendanceManagement;
