import { SectionTitle } from '@components/common/modules/SectionTitle';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import { Box, IconButton, Paper, Tooltip } from '@mui/material';
import { DashboardSectionFrameProps } from './DashboardSectionFrame.types';

export const DashboardSectionFrame = ({
  title,
  children,
  favorite,
  favoriteLabel,
  onToggleFavorite,
}: DashboardSectionFrameProps) => (
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
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <SectionTitle title={title} />
        </Box>
        {onToggleFavorite ? (
          <Tooltip title={favoriteLabel}>
            <IconButton
              size="small"
              onClick={onToggleFavorite}
              aria-label={favoriteLabel}
              color={favorite ? 'warning' : 'default'}
            >
              {favorite ? <StarRoundedIcon /> : <StarBorderRoundedIcon />}
            </IconButton>
          </Tooltip>
        ) : null}
      </Box>
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
