import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import {
  Box,
  ClickAwayListener,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Popper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DEFAULT_MUI_ICON, MUI_ICON_OPTIONS, MuiIcon } from '@utils/muiIcons';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { IconPickerProps } from './IconPicker.types';

const MUI_ICONS_URL = 'https://mui.com/material-ui/material-icons/';

export const IconPicker = ({ label, value, disabled = false, onChange }: IconPickerProps) => {
  const { t } = useTranslation();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [search, setSearch] = useState(value || DEFAULT_MUI_ICON);
  const selectedIcon = value || DEFAULT_MUI_ICON;
  useEffect(() => {
    setSearch(selectedIcon);
  }, [selectedIcon]);
  const filteredIcons = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return normalizedSearch
      ? MUI_ICON_OPTIONS.filter((name) => name.toLowerCase().includes(normalizedSearch))
      : MUI_ICON_OPTIONS;
  }, [search]);
  const close = () => setAnchor(null);

  return (
    <>
      <TextField
        fullWidth
        label={label}
        value={search}
        disabled={disabled}
        onFocus={(event) => {
          setAnchor(event.currentTarget);
          setSearch(selectedIcon);
        }}
        onClick={(event) => setAnchor(event.currentTarget)}
        onChange={(event) => {
          const nextValue = event.target.value;
          setSearch(nextValue);
          if (nextValue.trim()) onChange(nextValue.trim());
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            close();
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
      <Popper
        open={Boolean(anchor)}
        anchorEl={anchor}
        placement="bottom-start"
        sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
      >
        <ClickAwayListener onClickAway={close}>
          <Paper
            variant="outlined"
            sx={{ width: 360, maxWidth: 'calc(100vw - 32px)', maxHeight: 360, overflow: 'auto' }}
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
                      setSearch(iconName);
                      close();
                    }}
                    aria-label={iconName}
                  >
                    <MuiIcon name={iconName} fontSize="small" />
                  </IconButton>
                </Tooltip>
              ))}
            </Box>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  );
};
