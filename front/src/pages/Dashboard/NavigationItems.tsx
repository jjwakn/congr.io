import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { Box, Collapse, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import type { DashboardNavigationItem } from '@utils/dashboard';
import { useMemo, useState } from 'react';
import { NavigationItemsProps } from './DashboardNavigationDrawer.types';

const isSelectedPath = (selectedPath: string, itemPath: string) =>
  itemPath === '/' ? selectedPath === itemPath : selectedPath === itemPath || selectedPath.startsWith(`${itemPath}/`);

const itemButtonSx = (selected: boolean, nested = false) => ({
  minHeight: 44,
  px: 2,
  bgcolor: nested ? 'action.hover' : undefined,
  '&.Mui-selected': {
    bgcolor: 'action.selected',
  },
  '&.Mui-selected .MuiListItemIcon-root': {
    color: 'primary.main',
  },
  ...(selected
    ? {
        '& .MuiListItemIcon-root': {
          color: 'primary.main',
        },
      }
    : {}),
});

export const NavigationItems = ({ categories, settingsItem, selectedPath, onNavigate }: NavigationItemsProps) => {
  const activeCategoryId = useMemo(
    () => categories.find((category) => category.items.some((item) => isSelectedPath(selectedPath, item.path)))?.id,
    [categories, selectedPath],
  );
  const [categoryExpansionOverrides, setCategoryExpansionOverrides] = useState<Record<string, boolean>>({});

  const renderItem = (item: DashboardNavigationItem, nested = false, icon = item.icon) => {
    const selected = isSelectedPath(selectedPath, item.path);

    return (
      <ListItemButton
        key={item.id}
        selected={selected}
        onClick={() => onNavigate(item.path)}
        sx={itemButtonSx(selected, nested)}
      >
        <ListItemIcon sx={{ minWidth: 34 }}>{icon}</ListItemIcon>
        <ListItemText primary={item.label} />
      </ListItemButton>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
      <List disablePadding sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {categories.map((category) => {
          const active = category.id === activeCategoryId;
          const expanded = categoryExpansionOverrides[category.id] ?? active;

          if (category.items.length === 1) return renderItem(category.items[0], false, category.icon);

          return (
            <Box key={category.id}>
              <ListItemButton
                selected={active}
                onClick={() =>
                  setCategoryExpansionOverrides((current) => ({
                    ...current,
                    [category.id]: !expanded,
                  }))
                }
                sx={itemButtonSx(active)}
              >
                <ListItemIcon sx={{ minWidth: 34 }}>{category.icon}</ListItemIcon>
                <ListItemText primary={category.label} />
                <ExpandMoreRoundedIcon
                  fontSize="small"
                  sx={{
                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: (theme) => theme.transitions.create('transform'),
                  }}
                />
              </ListItemButton>
              <Collapse in={expanded} timeout="auto" unmountOnExit>
                <List disablePadding component="div">
                  {category.items.map((item) => renderItem(item, true))}
                </List>
              </Collapse>
            </Box>
          );
        })}
      </List>
      <List disablePadding sx={{ flexShrink: 0, borderTop: 1, borderColor: 'divider' }}>
        {renderItem(settingsItem)}
      </List>
    </Box>
  );
};
