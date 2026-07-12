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
            px: { xs: 1.5, sm: 2, md: 3 },
            pt: { xs: 1.5, sm: 2, md: 3 },
            pb: { xs: 1.5, md: 2 },
            borderBottom: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            position: 'sticky',
            top: 0,
            zIndex: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 0.75 }, minWidth: 0 }}>
            {onToggleFavorite ? (
              <Tooltip title={favoriteLabel}>
                <IconButton
                  size="small"
                  onClick={onToggleFavorite}
                  aria-label={favoriteLabel}
                  color={favorite ? 'warning' : 'default'}
                  sx={{ flexShrink: 0 }}
                >
                  {favorite ? <StarRoundedIcon /> : <StarBorderRoundedIcon />}
                </IconButton>
              </Tooltip>
            ) : null}
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <SectionTitle title={title} />
            </Box>
            {actions ? <Box sx={{ display: 'flex', flexShrink: 0, ml: { xs: 0.25, sm: 0.5 } }}>{actions}</Box> : null}
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
