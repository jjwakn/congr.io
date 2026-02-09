import {
  Box,
  Button,
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFooter } from '../../hooks/useFooter';
import { smallOptionStyle } from '../../utils/theme';
import { ThemeToggleButton } from '../ThemeToggleButton';

const Footer = () => {
  const { i18n, t } = useTranslation();
  const { children } = useFooter();
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleChange = useCallback(
    (event: SelectChangeEvent<string>) => {
      const nextLang = event.target.value;
      if (nextLang && nextLang !== i18n.language) {
        i18n.changeLanguage(nextLang);
      }
    },
    [i18n],
  );

  const handleBrandingNavigation = useCallback(() => {
    const nextPath = pathname === '/branding' ? '/' : '/branding';
    if (window.location.pathname === nextPath) return;

    window.history.pushState(null, '', nextPath);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, [pathname]);

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
      {children ? children : null}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
        {pathname === '/branding' ? (
          <Button
            variant="text"
            size="small"
            onClick={handleBrandingNavigation}
          >
            {t('footer.backToApp')}
          </Button>
        ) : null}

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
