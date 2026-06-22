import { Stack, TextField } from '@mui/material';
import { ModuleListTable } from './ModuleListTable';
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
  const sectionActions =
    actions ??
    (refreshAction ? (
      <ModuleStandardActions createAction={createAction} refreshAction={refreshAction} extraActions={extraActions} />
    ) : null);

  return (
    <Stack spacing={2} sx={{ height: '100%', minHeight: 0 }}>
      {title || sectionActions ? (
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

          {sectionActions ? (
            <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
              {sectionActions}
            </Stack>
          ) : null}
        </Stack>
      ) : null}

      {alerts ? <Stack spacing={1}>{alerts}</Stack> : null}

      {search ? (
        <TextField
          size="small"
          label={search.label}
          placeholder={search.placeholder}
          value={search.value}
          onChange={(event) => search.onChange(event.target.value)}
          sx={search.sx}
        />
      ) : null}

      {table ? <ModuleListTable<RowType> {...table} /> : null}

      {children}
    </Stack>
  );
};
