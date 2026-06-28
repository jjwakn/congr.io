import { Box, IconButton, InputAdornment, Popover, TextField, Tooltip } from '@mui/material';
import { DEFAULT_MUI_ICON, MUI_ICON_OPTIONS, MuiIcon } from '@utils/muiIcons';
import { useMemo, useState } from 'react';
import type { IconPickerProps } from './IconPicker.types';

export const IconPicker = ({ label, value, disabled = false, onChange }: IconPickerProps) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [search, setSearch] = useState('');
  const selectedIcon = value || DEFAULT_MUI_ICON;
  const filteredIcons = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return normalizedSearch
      ? MUI_ICON_OPTIONS.filter((name) => name.toLowerCase().includes(normalizedSearch))
      : MUI_ICON_OPTIONS;
  }, [search]);

  return (
    <>
      <TextField
        fullWidth
        label={label}
        value={search}
        disabled={disabled}
        placeholder={selectedIcon}
        onFocus={(event) => setAnchor(event.currentTarget)}
        onClick={(event) => setAnchor(event.currentTarget)}
        onChange={(event) => setSearch(event.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <MuiIcon name={selectedIcon} fontSize="small" />
            </InputAdornment>
          ),
        }}
      />
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => {
          setAnchor(null);
          setSearch('');
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { width: 360, maxWidth: 'calc(100vw - 32px)', maxHeight: 360, overflow: 'auto' } } }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))',
            gap: 0.5,
            p: 1,
          }}
        >
          {filteredIcons.map((iconName) => (
            <Tooltip key={iconName} title={iconName}>
              <IconButton
                color={iconName === selectedIcon ? 'primary' : 'default'}
                onClick={() => {
                  onChange(iconName);
                  setAnchor(null);
                  setSearch('');
                }}
                aria-label={iconName}
              >
                <MuiIcon name={iconName} fontSize="small" />
              </IconButton>
            </Tooltip>
          ))}
        </Box>
      </Popover>
    </>
  );
};
