import { ThemeToggleButton } from '@components/ThemeToggleButton';
import { Box, FormControl, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { smallOptionStyle } from '@utils/theme';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguageWithResources } from '../../../i18n';

const Footer = () => {
  const { i18n, t } = useTranslation();

  const handleChange = useCallback(
    (event: SelectChangeEvent<string>) => {
      const nextLang = event.target.value;
      if (nextLang && !i18n.language?.startsWith(nextLang)) {
        void changeLanguageWithResources(nextLang);
      }
    },
    [i18n],
  );

  return (
    <Box
      component="footer"
      sx={{
        position: 'absolute',
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ThemeToggleButton />

        <FormControl size="small" variant="outlined" sx={{ minWidth: 50 }}>
          <Select
            value={i18n.language?.startsWith('es') ? 'es' : 'en'}
            onChange={handleChange}
            displayEmpty
            inputProps={{ 'aria-label': t('footer.languageAriaLabel') }}
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
    </Box>
  );
};

export default Footer;
