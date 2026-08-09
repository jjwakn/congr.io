import { IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { ModuleRowActionsProps } from './ModuleRowActions.types';

const resolveBoolean = <RowType,>(value: boolean | ((row: RowType) => boolean) | undefined, row: RowType): boolean =>
  typeof value === 'function' ? value(row) : Boolean(value);
const resolveText = <RowType,>(
  value: string | ((row: RowType) => string) | undefined,
  row: RowType,
): string | undefined => (typeof value === 'function' ? value(row) : value);

export const ModuleRowActions = <RowType,>({ row, actions, emptyLabel = '-' }: ModuleRowActionsProps<RowType>) => {
  const visibleActions = actions.filter((action) => !resolveBoolean(action.hidden, row));

  return visibleActions.length ? (
    <Stack direction="row" spacing={1} justifyContent="flex-end">
      {visibleActions.map((action) => {
        const Icon = action.icon;

        return (
          <Tooltip key={action.id} title={resolveText(action.tooltip, row) ?? action.label}>
            <span>
              <IconButton
                size="small"
                color={action.color ?? 'default'}
                disabled={resolveBoolean(action.disabled, row)}
                onClick={() => action.onClick(row)}
              >
                <Icon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        );
      })}
    </Stack>
  ) : (
    <Typography variant="body2" color="text.secondary">
      {emptyLabel}
    </Typography>
  );
};
