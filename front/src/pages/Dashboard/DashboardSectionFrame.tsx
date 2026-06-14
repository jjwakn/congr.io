import { SectionTitle } from '@components/common/modules/SectionTitle';
import { Box, Paper } from '@mui/material';
import { DashboardSectionFrameProps } from './DashboardSectionFrame.types';

export const DashboardSectionFrame = ({ title, children }: DashboardSectionFrameProps) => (
  <Paper
    variant="outlined"
    sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}
  >
    <Box
      sx={{
        px: { xs: 2, md: 3 },
        pt: { xs: 2, md: 3 },
        pb: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        position: 'sticky',
        top: 0,
        zIndex: 2,
      }}
    >
      <SectionTitle title={title} />
    </Box>

    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        px: { xs: 2, md: 3 },
        py: 2,
      }}
    >
      {children}
    </Box>
  </Paper>
);
