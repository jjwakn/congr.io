import { Stack } from '@mui/material';
import { DashboardSectionActionsContext } from '@pages/Dashboard/DashboardSectionActionsContext';
import { useContext, useEffect, useMemo } from 'react';
import { ModuleListTable } from './ModuleListTable';
import { ModuleSearchField } from './ModuleSearchField';
import { ModuleSectionProps } from './ModuleSection.types';
import { ModuleStandardActions } from './ModuleStandardActions';
import { SectionTitle } from './SectionTitle';

export const ModuleSection = <RowType,>({
  title,
  actions,
  createAction,
  refreshAction,
  extraActions,
  alerts,
  search,
  table,
  children,
}: ModuleSectionProps<RowType>) => {
  const sectionActions = useMemo(
    () =>
      actions ??
      (refreshAction ? (
        <ModuleStandardActions createAction={createAction} refreshAction={refreshAction} extraActions={extraActions} />
      ) : null),
    [actions, createAction, extraActions, refreshAction],
  );
  const frameActionsContext = useContext(DashboardSectionActionsContext);
  const shouldPublishFrameActions = Boolean(frameActionsContext && !title && sectionActions);
  const setFrameActions = frameActionsContext?.setActions;

  useEffect(() => {
    if (!shouldPublishFrameActions || !setFrameActions) return undefined;

    setFrameActions(sectionActions);

    return () => setFrameActions(null);
  }, [sectionActions, setFrameActions, shouldPublishFrameActions]);

  return (
    <Stack spacing={2} sx={{ height: '100%', minHeight: 0 }}>
      {title || (sectionActions && !shouldPublishFrameActions) ? (
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="flex-start"
          justifyContent={title ? 'space-between' : 'flex-end'}
        >
          {title ? (
            <Stack sx={{ minWidth: 0, flex: 1 }}>
              <SectionTitle title={title} />
            </Stack>
          ) : null}

          {sectionActions && !shouldPublishFrameActions ? (
            <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
              {sectionActions}
            </Stack>
          ) : null}
        </Stack>
      ) : null}

      {alerts ? <Stack spacing={1}>{alerts}</Stack> : null}

      {search ? <ModuleSearchField {...search} /> : null}

      {table ? <ModuleListTable<RowType> {...table} /> : null}

      {children}
    </Stack>
  );
};
