import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import RemoveCircleOutlineRoundedIcon from '@mui/icons-material/RemoveCircleOutlineRounded';
import { Box } from '@mui/material';
import { CrudPermissionStatusProps } from './CrudPermissionStatus.types';

export const CrudPermissionStatus = ({
  enabled,
}: CrudPermissionStatusProps) => (
  <Box
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {enabled ? (
      <CheckCircleOutlineRoundedIcon color="success" fontSize="small" />
    ) : (
      <RemoveCircleOutlineRoundedIcon color="disabled" fontSize="small" />
    )}
  </Box>
);
