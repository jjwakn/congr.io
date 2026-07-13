import type { ModuleListColumn, ModuleListHeaderCell } from '@components/common/modules/ModuleListTable.types';
import { ModuleSection } from '@components/common/modules/ModuleSection';
import { useModuleColumnVisibility } from '@components/common/modules/useModuleColumnVisibility';
import { useModuleList } from '@components/common/modules/useModuleList';
import { Alert } from '@mui/material';
import { ServiceNewPeopleService, ServicesService } from '@services/services';
import { httpRequest } from '@utils/http';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  ServiceListResponse,
  ServiceNewPeople,
  ServiceNewPeopleListResponse,
  ServiceNewPerson,
} from '@/types/service.types';

interface FollowUpRow {
  id: string;
  personName: string;
  phone: string;
  firstVisit: string;
  serviceName: string;
  status: 'pending' | 'completed';
}

type FollowUpColumnId = 'id' | 'person' | 'phone' | 'firstVisit' | 'serviceName' | 'status';

const personName = (entry: ServiceNewPerson) =>
  `${entry.person.code} · ${entry.person.first_name} ${entry.person.last_name}`.trim();

const getFollowUpSortValue = (row: FollowUpRow, sort: string) => {
  if (sort === 'id') return row.id;
  if (sort === 'phone') return row.phone;
  if (sort === 'firstVisit') return row.firstVisit;
  if (sort === 'serviceName') return row.serviceName;
  if (sort === 'status') return row.status;
  return row.personName;
};

const ServiceFollowUpManagement = () => {
  const { t } = useTranslation();
  const list = useModuleList({
    moduleKey: 'services-follow-up-list',
    defaultSort: 'firstVisit',
    defaultDirection: 'ASC',
  });
  const [rows, setRows] = useState<FollowUpRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const columnVisibility = useModuleColumnVisibility<FollowUpColumnId>({
    moduleKey: 'services-follow-up-list',
    allColumnIds: ['id', 'person', 'phone', 'firstVisit', 'serviceName', 'status'],
    defaultVisibleColumnIds: ['person', 'phone', 'firstVisit', 'serviceName', 'status'],
    defaultSearchColumnIds: ['person', 'phone', 'firstVisit', 'serviceName'],
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [servicesResponse, groupsResponse] = await Promise.all([
        httpRequest<ServiceListResponse>({
          service: ServicesService.list,
          data: { page: 0, size: 200, order: 'name', direction: 'ASC' },
        }),
        httpRequest<ServiceNewPeopleListResponse>({
          service: ServiceNewPeopleService.list,
          data: {
            page: list.page,
            size: list.pageSize,
            order: list.sort === 'serviceName' ? 'service_id' : 'date',
            direction: list.direction,
            ...(list.debouncedSearch ? { search: list.debouncedSearch } : {}),
          },
        }),
      ]);
      const details = await Promise.all(
        groupsResponse.result.map((group) =>
          httpRequest<ServiceNewPeople>({ service: ServiceNewPeopleService.get, data: { id: group.id } }),
        ),
      );
      setRows(
        details.flatMap((group) =>
          (group.people ?? []).map((entry) => ({
            id: entry.id,
            personName: personName(entry),
            phone: entry.person.phone,
            firstVisit: group.date,
            serviceName:
              servicesResponse.result.find(({ id }) => id === group.service_id)?.name ?? group.service?.name ?? '-',
            status: 'pending' as const,
          })),
        ),
      );
    } catch (value) {
      setError(value instanceof Error ? value.message : t('pages.services.followUp.empty'));
    } finally {
      setLoading(false);
    }
  }, [list.debouncedSearch, list.direction, list.page, list.pageSize, list.sort, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredRows = useMemo(() => {
    const terms = list.debouncedSearch.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return rows;
    return rows.filter((row) =>
      terms.every((term) =>
        [row.personName, row.phone, row.firstVisit, row.serviceName].some((value) =>
          value.toLowerCase().includes(term),
        ),
      ),
    );
  }, [list.debouncedSearch, rows]);

  const sortedRows = useMemo(() => {
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

    return [...filteredRows].sort((left, right) => {
      const leftValue = getFollowUpSortValue(left, list.sort);
      const rightValue = getFollowUpSortValue(right, list.sort);
      const result = collator.compare(String(leftValue), String(rightValue));

      return list.direction === 'ASC' ? result : -result;
    });
  }, [filteredRows, list.direction, list.sort]);

  const columnDefinitions = useMemo<ModuleListColumn<FollowUpRow>[]>(
    () => [
      { id: 'id', render: (row) => row.id },
      { id: 'person', render: (row) => row.personName },
      { id: 'phone', render: (row) => row.phone || '-' },
      { id: 'firstVisit', render: (row) => row.firstVisit },
      { id: 'serviceName', render: (row) => row.serviceName },
      { id: 'status', render: (row) => t(`pages.services.followUp.${row.status}`) },
    ],
    [t],
  );

  const headerDefinitions = useMemo<ModuleListHeaderCell[]>(
    () => [
      { id: 'id', label: t('pages.modules.common.id'), sortKey: 'id' },
      { id: 'person', label: t('pages.services.followUp.person'), sortKey: 'person' },
      { id: 'phone', label: t('pages.services.followUp.phone'), sortKey: 'phone' },
      { id: 'firstVisit', label: t('pages.services.followUp.firstVisit'), sortKey: 'firstVisit' },
      { id: 'serviceName', label: t('pages.services.newPeople.service'), sortKey: 'serviceName' },
      { id: 'status', label: t('pages.services.followUp.status'), sortKey: 'status' },
    ],
    [t],
  );

  const columns = useMemo<ModuleListColumn<FollowUpRow>[]>(
    () =>
      columnDefinitions.filter((column) => columnVisibility.visibleColumnIds.includes(column.id as FollowUpColumnId)),
    [columnDefinitions, columnVisibility.visibleColumnIds],
  );

  const headerRows = useMemo<ModuleListHeaderCell[][]>(
    () => [headerDefinitions.filter((cell) => columnVisibility.visibleColumnIds.includes(cell.id as FollowUpColumnId))],
    [columnVisibility.visibleColumnIds, headerDefinitions],
  );

  return (
    <ModuleSection<FollowUpRow>
      title=""
      alerts={error ? <Alert severity="error">{error}</Alert> : null}
      search={{
        label: t('pages.modules.common.search'),
        value: list.search,
        onChange: list.setSearch,
      }}
      refreshAction={{
        id: 'refresh-service-follow-up',
        label: t('pages.modules.common.refresh'),
        onClick: () => void load(),
      }}
      table={{
        headerRows,
        columns,
        rows: sortedRows,
        getRowId: (row) => row.id,
        loading,
        loadingLabel: t('pages.services.followUp.loading'),
        emptyLabel: t('pages.services.followUp.empty'),
        sort: list.sort,
        direction: list.direction,
        onSort: list.handleSort,
        page: list.page,
        pageSize: list.pageSize,
        total: sortedRows.length,
        onPageChange: list.handleChangePage,
        onPageSizeChange: list.handleChangeRowsPerPage,
        rowsPerPageLabel: t('pages.modules.common.rowsPerPage'),
        columnVisibility: {
          label: t('pages.modules.common.columns'),
          options: headerDefinitions.map((cell) => ({
            id: cell.id,
            label: cell.label,
          })),
          visibleIds: columnVisibility.visibleColumnIds,
          onChange: (value) => columnVisibility.setVisibleColumnIds(value as FollowUpColumnId[]),
        },
      }}
    />
  );
};

export default ServiceFollowUpManagement;
