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
    <Stack spacing={2}>
      {title || sectionActions ? (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent={title ? 'space-between' : 'flex-end'}
        >
          {title ? <SectionTitle title={title} /> : null}

          {sectionActions ? (
            <Stack direction="row" spacing={1}>
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
