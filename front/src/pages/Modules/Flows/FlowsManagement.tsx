import { ConfirmDialog } from '@components/common/forms/ConfirmDialog';
import type { ModuleListColumn, ModuleListHeaderCell } from '@components/common/modules/ModuleListTable.types';
import { ModuleRowActions } from '@components/common/modules/ModuleRowActions';
import { ModuleSection } from '@components/common/modules/ModuleSection';
import {
  CRUD_AUDIT_COLUMN_IDS,
  type CrudAuditColumnId,
  getCrudAuditColumnDefinitions,
} from '@components/common/modules/crudAuditColumns';
import { useModuleColumnVisibility } from '@components/common/modules/useModuleColumnVisibility';
import { useModuleList } from '@components/common/modules/useModuleList';
import { useAuth } from '@hooks/useAuth';
import { useNotificationContext } from '@hooks/useNotifications';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { ProcessesService } from '@services/processes';
import { httpRequest } from '@utils/http';
import { getPreloadedResource } from '@utils/preload';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Process, ProcessInput } from '@/types/process.types';
import { FlowEditorDialog } from './FlowEditorDialog';

type FlowColumnId = 'id' | 'name' | 'description' | 'steps' | 'actions' | CrudAuditColumnId;
const FLOW_COLUMN_IDS: FlowColumnId[] = ['id', 'name', 'description', 'steps', 'actions'];
const DEFAULT_FLOW_VISIBLE_COLUMNS: FlowColumnId[] = ['name', 'description', 'steps', 'actions'];

export const FlowsManagement = () => {
  const { i18n, t } = useTranslation();
  const { auth, hasPermission } = useAuth();
  const { showNotification } = useNotificationContext();
  const list = useModuleList({ moduleKey: 'processes-list', defaultSort: 'name' });
  const allColumnIds = useMemo<FlowColumnId[]>(
    () => [...FLOW_COLUMN_IDS, ...(auth?.fullAccess ? CRUD_AUDIT_COLUMN_IDS : [])],
    [auth?.fullAccess],
  );
  const columnVisibility = useModuleColumnVisibility<FlowColumnId>({
    moduleKey: 'processes-list',
    allColumnIds,
    defaultVisibleColumnIds: DEFAULT_FLOW_VISIBLE_COLUMNS,
    fixedColumnIds: ['actions'],
    defaultSearchColumnIds: ['name', 'description'],
  });
  const cached = getPreloadedResource<{ result: Process[]; total: number }>('processes');
  const [rows, setRows] = useState<Process[]>(cached?.result ?? []);
  const [total, setTotal] = useState(cached?.total ?? 0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editor, setEditor] = useState<Process | null | undefined>();
  const [pendingDelete, setPendingDelete] = useState<Process>();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await httpRequest<{ result: Process[]; total: number }>({
        service: ProcessesService.list,
        data: {
          page: list.page,
          size: list.pageSize,
          order: list.sort,
          direction: list.direction,
          columns: columnVisibility.columnsQuery,
          search_columns: columnVisibility.searchColumnsQuery,
          ...(list.debouncedSearch ? { search: list.debouncedSearch } : {}),
        },
      });
      setRows(response.result);
      setTotal(response.total);
    } catch (value) {
      showNotification(value instanceof Error ? value.message : t('pages.flows.loadFailed'), {
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [
    columnVisibility.columnsQuery,
    columnVisibility.searchColumnsQuery,
    list.debouncedSearch,
    list.direction,
    list.page,
    list.pageSize,
    list.sort,
    showNotification,
    t,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = async (value: ProcessInput) => {
    setSubmitting(true);
    try {
      await httpRequest({
        service: editor ? ProcessesService.update : ProcessesService.create,
        data: { ...(editor ? { id: editor.id } : {}), ...value },
      });
      setEditor(undefined);
      await refresh();
      showNotification(t('pages.flows.saved'), { severity: 'success' });
    } catch (error) {
      showNotification(error instanceof Error ? error.message : t('pages.flows.saveFailed'), {
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const auditColumnDefinitions = useMemo(
    () =>
      auth?.fullAccess
        ? getCrudAuditColumnDefinitions<Process>({
            language: i18n.language,
            t,
          }).columns
        : [],
    [auth?.fullAccess, i18n.language, t],
  );

  const columnDefinitions = useMemo<
    Array<
      {
        id: FlowColumnId;
        label: string;
        sortKey?: string;
      } & ModuleListColumn<Process>
    >
  >(
    () => [
      { id: 'id', label: t('pages.modules.common.id'), minWidth: 260, render: (row: Process) => row.id },
      {
        id: 'name',
        label: t('form.field.name'),
        sortKey: 'name',
        minWidth: 180,
        render: (row: Process) => row.name,
      },
      {
        id: 'description',
        label: t('pages.flows.description'),
        sortKey: 'description',
        minWidth: 260,
        render: (row: Process) => row.description,
      },
      {
        id: 'steps',
        label: t('pages.flows.steps'),
        width: 100,
        align: 'center' as const,
        render: (row: Process) => row.steps.length,
      },
      ...auditColumnDefinitions,
      {
        id: 'actions',
        label: t('pages.settings.congregation.actions'),
        width: 100,
        align: 'right' as const,
        render: (row: Process) => (
          <ModuleRowActions
            row={row}
            actions={[
              {
                id: 'edit',
                label: t('pages.flows.edit'),
                icon: EditOutlinedIcon,
                hidden: !hasPermission('process', 'update'),
                onClick: setEditor,
              },
              {
                id: 'delete',
                label: t('form.common.delete'),
                icon: DeleteOutlineRoundedIcon,
                color: 'error',
                hidden: !hasPermission('process', 'delete'),
                onClick: setPendingDelete,
              },
            ]}
          />
        ),
      },
    ],
    [auditColumnDefinitions, hasPermission, t],
  );
  const visibleColumnDefinitions = useMemo(
    () =>
      columnDefinitions.filter(
        (column) => column.id === 'actions' || columnVisibility.visibleColumnIds.includes(column.id),
      ),
    [columnDefinitions, columnVisibility.visibleColumnIds],
  );
  const columns = useMemo<ModuleListColumn<Process>[]>(
    () =>
      visibleColumnDefinitions.map((column) => ({
        id: column.id,
        minWidth: column.minWidth,
        width: column.width,
        align: column.align,
        render: column.render,
      })),
    [visibleColumnDefinitions],
  );
  const headerRows = useMemo<ModuleListHeaderCell[][]>(
    () => [
      visibleColumnDefinitions.map((column) => ({
        id: column.id,
        label: column.label,
        sortKey: column.sortKey,
        align: column.align,
      })),
    ],
    [visibleColumnDefinitions],
  );

  return (
    <>
      <ModuleSection<Process>
        createAction={
          hasPermission('process', 'create')
            ? { id: 'create-flow', label: t('pages.flows.create'), onClick: () => setEditor(null) }
            : undefined
        }
        refreshAction={{ id: 'refresh-flows', label: t('pages.modules.common.refresh'), onClick: () => void refresh() }}
        search={{ label: t('pages.modules.common.search'), value: list.search, onChange: list.setSearch }}
        table={{
          headerRows,
          columns,
          rows,
          getRowId: (row) => row.id,
          loading,
          loadingLabel: t('pages.flows.loading'),
          emptyLabel: t('pages.flows.empty'),
          sort: list.sort,
          direction: list.direction,
          onSort: list.handleSort,
          page: list.page,
          pageSize: list.pageSize,
          total,
          onPageChange: list.handleChangePage,
          onPageSizeChange: list.handleChangeRowsPerPage,
          rowsPerPageLabel: t('pages.modules.common.rowsPerPage'),
          columnVisibility: {
            label: t('pages.modules.common.columns'),
            options: columnDefinitions
              .filter((column) => column.id !== 'actions')
              .map((column) => ({ id: column.id, label: column.label })),
            visibleIds: columnVisibility.visibleColumnIds,
            disabled: loading,
            onChange: (value) => columnVisibility.setVisibleColumnIds(value as FlowColumnId[]),
          },
        }}
      />
      {editor !== undefined ? (
        <FlowEditorDialog
          flow={editor}
          submitting={submitting}
          onClose={() => setEditor(undefined)}
          onSubmit={(value) => void save(value)}
        />
      ) : null}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t('pages.flows.deleteTitle')}
        message={t('pages.flows.deleteMessage')}
        confirmLabel={t('form.common.delete')}
        cancelLabel={t('form.field.cancel')}
        confirming={submitting}
        confirmColor="error"
        onClose={() => setPendingDelete(undefined)}
        onConfirm={() =>
          void (async () => {
            if (!pendingDelete) return;
            setSubmitting(true);
            try {
              await httpRequest({ service: ProcessesService.remove, data: { id: pendingDelete.id } });
              setPendingDelete(undefined);
              await refresh();
            } finally {
              setSubmitting(false);
            }
          })()
        }
      />
    </>
  );
};

export default FlowsManagement;
