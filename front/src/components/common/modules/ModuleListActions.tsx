import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { Box, Button, Stack } from '@mui/material';
import { ModuleListActionsProps } from './ModuleListActions.types';

export const ModuleListActions = ({ refreshLabel, isRefreshing, onRefresh, children }: ModuleListActionsProps) => (
  <Stack
    direction={{ xs: 'column', sm: 'row' }}
    spacing={1}
    alignItems={{ xs: 'stretch', sm: 'center' }}
    justifyContent="space-between"
  >
    {children ? <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>{children}</Box> : null}
    <Button
      variant="outlined"
      startIcon={<RefreshRoundedIcon fontSize="small" />}
      disabled={isRefreshing}
      onClick={onRefresh}
      sx={{ alignSelf: { xs: 'flex-end', sm: 'auto' } }}
    >
      {refreshLabel}
    </Button>
  </Stack>
);
