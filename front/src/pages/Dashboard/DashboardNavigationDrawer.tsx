import { Box, Divider, Drawer, IconButton, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { LogoSmall } from '../../components/Logos';
import { DashboardNavigationDrawerProps } from './DashboardNavigationDrawer.types';
import { NavigationItems } from './NavigationItems';

const DRAWER_WIDTH = 260;

export const DashboardNavigationDrawer = ({
  items,
  selectedPath,
  congregationName,
  homeLabel,
  open,
  onNavigate,
  onLogoClick,
  onClose,
}: DashboardNavigationDrawerProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      anchor={isMobile ? 'bottom' : 'left'}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': isMobile
          ? {
              width: '100%',
              maxHeight: '72vh',
              boxSizing: 'border-box',
              borderTopLeftRadius: 14,
              borderTopRightRadius: 14,
              borderTop: '1px solid',
              borderColor: 'divider',
            }
          : {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            },
      }}
    >
      {!isMobile ? (
        <>
          <Box
            sx={{
              px: 1.5,
              py: 1.25,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <IconButton
              size="small"
              onClick={() => {
                onLogoClick();
                onClose();
              }}
              aria-label={homeLabel}
              sx={{ p: 0 }}
            >
              <LogoSmall alt={congregationName} size={28} />
            </IconButton>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {congregationName}
            </Typography>
          </Box>
          <Divider />
        </>
      ) : null}

      <NavigationItems
        items={items}
        selectedPath={selectedPath}
        onNavigate={(path) => {
          onNavigate(path);
          onClose();
        }}
      />
    </Drawer>
  );
};
