import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import { Box, IconButton, InputAdornment, Link, Popover, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { DEFAULT_MUI_ICON, MUI_ICON_OPTIONS, MuiIcon } from '@utils/muiIcons';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { IconPickerProps } from './IconPicker.types';

const MUI_ICONS_URL = 'https://mui.com/material-ui/material-icons/';

export const IconPicker = ({ label, value, disabled = false, onChange }: IconPickerProps) => {
  const { t } = useTranslation();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [search, setSearch] = useState('');
  const selectedIcon = value || DEFAULT_MUI_ICON;
  const inputValue = anchor ? search : selectedIcon;
  const filteredIcons = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return normalizedSearch
      ? MUI_ICON_OPTIONS.filter((name) => name.toLowerCase().includes(normalizedSearch))
      : MUI_ICON_OPTIONS;
  }, [search]);
  const applyCustomIcon = () => {
    const nextIcon = search.trim();
    if (nextIcon) onChange(nextIcon);
    setAnchor(null);
    setSearch('');
  };

  return (
    <>
      <TextField
        fullWidth
        label={label}
        value={inputValue}
        disabled={disabled}
        onFocus={(event) => {
          setAnchor(event.currentTarget);
          setSearch('');
        }}
        onClick={(event) => setAnchor(event.currentTarget)}
        onChange={(event) => setSearch(event.target.value)}
        onBlur={() => {
          window.setTimeout(() => {
            if (anchor && search.trim()) applyCustomIcon();
          }, 120);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            applyCustomIcon();
          }
        }}
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
        <Stack spacing={1} sx={{ p: 1, pb: 0 }}>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Link href={MUI_ICONS_URL} target="_blank" rel="noreferrer" underline="hover">
            <Stack direction="row" component="span" alignItems="center" spacing={0.5}>
              <span>{t('form.common.muiIconsCatalog')}</span>
              <OpenInNewRoundedIcon fontSize="inherit" />
            </Stack>
          </Link>
        </Stack>
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
