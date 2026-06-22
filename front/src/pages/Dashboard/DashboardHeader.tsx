import { LogoSmall } from '@components/Logos';
import ArrowDropDownRoundedIcon from '@mui/icons-material/ArrowDropDownRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import { AppBar, Box, IconButton, Menu, MenuItem, Toolbar, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import { DashboardHeaderProps } from './DashboardHeader.types';

export const DashboardHeader = ({
  congregationName,
  congregationId,
  logoSrc,
  congregations,
  username,
  homeLabel,
  logoutLabel,
  switchCongregationLabel,
  favoriteItems,
  onLogout,
  onMenuClick,
  onLogoClick,
  onCongregationChange,
  onFavoriteNavigate,
}: DashboardHeaderProps) => {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const canSwitchCongregation = congregations.length > 1;

  return (
    <AppBar position="static">
      <Toolbar
        sx={{
          minHeight: { xs: 34, sm: 38 },
          px: { xs: 1, sm: 2 },
        }}
      >
        <IconButton color="inherit" size="small" onClick={onMenuClick} sx={{ mr: 0.5, display: 'inline-flex' }}>
          <MenuRoundedIcon fontSize="small" />
        </IconButton>

        <IconButton color="inherit" size="small" onClick={onLogoClick} aria-label={homeLabel} sx={{ mr: 0.25 }}>
          <LogoSmall
            alt={congregationName || 'Congr.io'}
            src={logoSrc}
            size={22}
            containerSx={{
              mr: 0,
            }}
          />
        </IconButton>

        <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
          <Typography
            variant="h6"
            noWrap
            sx={{
              fontSize: { xs: '0.95rem', sm: '1.2rem' },
              lineHeight: 1.15,
            }}
          >
            {congregationName || 'Congr.io'}
          </Typography>

          {canSwitchCongregation ? (
            <Tooltip title={switchCongregationLabel}>
              <IconButton
                color="inherit"
                size="small"
                aria-label={switchCongregationLabel}
                onClick={(event) => setMenuAnchor(event.currentTarget)}
              >
                <ArrowDropDownRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mr: 0.5, overflowX: 'auto' }}>
          {favoriteItems.map((item) => (
            <Tooltip key={item.id} title={item.label}>
              <IconButton
                color="inherit"
                size="small"
                onClick={() => onFavoriteNavigate(item.path)}
                aria-label={item.label}
              >
                {item.icon}
              </IconButton>
            </Tooltip>
          ))}
        </Box>

        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
          {congregations.map((item) => (
            <MenuItem
              key={item.id}
              selected={item.id === congregationId}
              onClick={() => {
                setMenuAnchor(null);
                onCongregationChange(item.id);
              }}
            >
              {item.name}
            </MenuItem>
          ))}
        </Menu>

        <Typography variant="caption" sx={{ mr: 1, display: { xs: 'none', sm: 'inline' } }}>
          {username}
        </Typography>

        <Tooltip title={logoutLabel}>
          <IconButton color="inherit" size="small" onClick={onLogout} aria-label={logoutLabel} sx={{ ml: 0.25 }}>
            <LogoutRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};
