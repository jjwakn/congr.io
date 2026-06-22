import { ConfirmDialog } from '@components/common/forms/ConfirmDialog';
import { ModuleRowActions } from '@components/common/modules/ModuleRowActions';
import { ModuleSection } from '@components/common/modules/ModuleSection';
import { useModuleList } from '@components/common/modules/useModuleList';
import { useAuth } from '@hooks/useAuth';
import { useNotificationContext } from '@hooks/useNotifications';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { ProcessesService } from '@services/processes';
import { httpRequest } from '@utils/http';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Process, ProcessInput } from '@/types/process.types';
import { FlowEditorDialog } from './FlowEditorDialog';

export const FlowsManagement = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const { showNotification } = useNotificationContext();
  const list = useModuleList({ moduleKey: 'processes-list', defaultSort: 'name' });
  const [rows, setRows] = useState<Process[]>([]);
  const [total, setTotal] = useState(0);
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
          ...(list.search ? { search: list.search } : {}),
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
  }, [list.direction, list.page, list.pageSize, list.search, list.sort, showNotification, t]);

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

  const columns = useMemo(
    () => [
      { id: 'name', minWidth: 180, render: (row: Process) => row.name },
      { id: 'description', minWidth: 260, render: (row: Process) => row.description },
      { id: 'steps', width: 100, align: 'center' as const, render: (row: Process) => row.steps.length },
      {
        id: 'actions',
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
    [hasPermission, t],
  );

  return (
    <>
      <ModuleSection<Process>
        title={t('pages.flows.title')}
        createAction={
          hasPermission('process', 'create')
            ? { id: 'create-flow', label: t('pages.flows.create'), onClick: () => setEditor(null) }
            : undefined
        }
        refreshAction={{ id: 'refresh-flows', label: t('pages.modules.common.refresh'), onClick: () => void refresh() }}
        search={{ label: t('pages.modules.common.search'), value: list.search, onChange: list.setSearch }}
        table={{
          headerRows: [
            [
              { id: 'name', label: t('form.field.name') },
              { id: 'description', label: t('pages.flows.description') },
              { id: 'steps', label: t('pages.flows.steps'), align: 'center' },
              { id: 'actions', label: t('pages.settings.congregation.actions'), align: 'right' },
            ],
          ],
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
