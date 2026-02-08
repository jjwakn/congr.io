import {
  Box,
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useFooter } from '../../hooks/useFooter';
import { smallOptionStyle } from '../../utils/theme';

const Footer = () => {
  const { i18n } = useTranslation();
  const { children } = useFooter();

  const handleChange = useCallback(
    (event: SelectChangeEvent<string>) => {
      const nextLang = event.target.value;
      if (nextLang && nextLang !== i18n.language) {
        i18n.changeLanguage(nextLang);
      }
    },
    [i18n],
  );

  return (
    <Box
      component="footer"
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        bgcolor: 'background.paper',
        px: 1.5,
        zIndex: (theme) => theme.zIndex.appBar - 1,
      }}
    >
      {children ? children : null}

      <FormControl size="small" variant="outlined" sx={{ minWidth: 50 }}>
        <Select
          value={i18n.language?.startsWith('es') ? 'es' : 'en'}
          onChange={handleChange}
          displayEmpty
          inputProps={{ 'aria-label': 'Language selector' }}
          size="small"
          variant="outlined"
        >
          <MenuItem value="en" sx={{ ...smallOptionStyle }}>
            EN
          </MenuItem>
          <MenuItem value="es" sx={{ ...smallOptionStyle }}>
            ES
          </MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default Footer;
