import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { NavigationItemsProps } from './DashboardNavigationDrawer.types';

export const NavigationItems = ({
  items,
  selectedPath,
  onNavigate,
}: NavigationItemsProps) => (
  <List disablePadding>
    {items.map((item) => (
      <ListItemButton
        key={item.id}
        selected={selectedPath === item.path}
        onClick={() => onNavigate(item.path)}
        sx={{
          minHeight: 44,
          ...(item.id === 'settings'
            ? {
                mt: 1,
                borderTop: '1px solid',
                borderColor: 'divider',
              }
            : {}),
        }}
      >
        <ListItemIcon sx={{ minWidth: 34 }}>{item.icon}</ListItemIcon>
        <ListItemText primary={item.label} />
      </ListItemButton>
    ))}
  </List>
);
