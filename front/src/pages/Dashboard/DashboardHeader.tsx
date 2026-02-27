import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import {
  AppBar,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { LogoSmall } from '../../components/Logos';
import { DashboardHeaderProps } from './DashboardHeader.types';

export const DashboardHeader = ({
  congregationName,
  username,
  homeLabel,
  logoutLabel,
  onLogout,
  onMenuClick,
  onLogoClick,
}: DashboardHeaderProps) => (
  <AppBar position="static">
    <Toolbar
      sx={{
        minHeight: { xs: 34, sm: 38 },
        px: { xs: 1, sm: 2 },
      }}
    >
      <IconButton
        color="inherit"
        size="small"
        onClick={onMenuClick}
        sx={{ mr: 0.5, display: 'inline-flex' }}
      >
        <MenuRoundedIcon fontSize="small" />
      </IconButton>

      <IconButton
        color="inherit"
        size="small"
        onClick={onLogoClick}
        aria-label={homeLabel}
        sx={{ mr: 0.25 }}
      >
        <LogoSmall
          alt={congregationName || 'Congr.io'}
          size={22}
          containerSx={{
            mr: 0,
          }}
        />
      </IconButton>

      <Typography
        variant="h6"
        sx={{
          flexGrow: 1,
          fontSize: { xs: '0.95rem', sm: '1.2rem' },
          lineHeight: 1.15,
        }}
      >
        {congregationName || 'Congr.io'}
      </Typography>

      <Typography
        variant="caption"
        sx={{ mr: 0.75, display: { xs: 'none', sm: 'inline' } }}
      >
        {username}
      </Typography>

      <Tooltip title={logoutLabel}>
        <IconButton
          color="inherit"
          size="small"
          onClick={onLogout}
          aria-label={logoutLabel}
          sx={{ ml: 0.25 }}
        >
          <LogoutRoundedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Toolbar>
  </AppBar>
);
