import { Box, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { NavigationItemsProps } from './DashboardNavigationDrawer.types';

export const NavigationItems = ({ items, selectedPath, onNavigate }: NavigationItemsProps) => {
  const settings = items.find(({ id }) => id === 'settings');
  const sections = items.filter(({ id }) => id !== 'settings');
  const renderItem = (item: (typeof items)[number]) => (
    <ListItemButton
      key={item.id}
      selected={selectedPath === item.path}
      onClick={() => onNavigate(item.path)}
      sx={{
        minHeight: 44,
      }}
    >
      <ListItemIcon sx={{ minWidth: 34 }}>{item.icon}</ListItemIcon>
      <ListItemText primary={item.label} />
    </ListItemButton>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
      <List disablePadding sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {sections.map(renderItem)}
      </List>
      {settings ? (
        <List disablePadding sx={{ flexShrink: 0, borderTop: 1, borderColor: 'divider' }}>
          {renderItem(settings)}
        </List>
      ) : null}
    </Box>
  );
};
