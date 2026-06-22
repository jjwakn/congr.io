import { SectionTitle } from '@components/common/modules/SectionTitle';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import { Box, IconButton, Paper, Tooltip } from '@mui/material';
import { type ReactNode, useMemo, useState } from 'react';
import { DashboardSectionActionsContext } from './DashboardSectionActionsContext';
import { DashboardSectionFrameProps } from './DashboardSectionFrame.types';

export const DashboardSectionFrame = ({
  title,
  children,
  favorite,
  favoriteLabel,
  onToggleFavorite,
}: DashboardSectionFrameProps) => {
  const [actions, setActions] = useState<ReactNode>(null);
  const actionsContextValue = useMemo(() => ({ actions, setActions }), [actions]);

  return (
    <DashboardSectionActionsContext.Provider value={actionsContextValue}>
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
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
            {onToggleFavorite ? (
              <Tooltip title={favoriteLabel}>
                <IconButton
                  size="small"
                  onClick={onToggleFavorite}
                  aria-label={favoriteLabel}
                  color={favorite ? 'warning' : 'default'}
                  sx={{ mt: 0.25 }}
                >
                  {favorite ? <StarRoundedIcon /> : <StarBorderRoundedIcon />}
                </IconButton>
              </Tooltip>
            ) : null}
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <SectionTitle title={title} />
            </Box>
            {actions ? <Box sx={{ display: 'flex', flexShrink: 0 }}>{actions}</Box> : null}
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
    </DashboardSectionActionsContext.Provider>
  );
};
