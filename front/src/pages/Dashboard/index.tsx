import {
  AppBar,
  Box,
  Button,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Toolbar,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { useTranslation } from 'react-i18next';
import PWABadge from '../../PWABadge';
import { LogoSmall } from '../../components/Logos';
import { useAppContext } from '../../hooks/useAppContext';
import { useAuth } from '../../hooks/useAuth';
import { useSetup } from '../../hooks/useSetup';

const MODULE_ROUTE_PREFIX = '/modules/';

const getModuleFromPath = (pathname: string): string | null => {
  if (!pathname.startsWith(MODULE_ROUTE_PREFIX)) return null;
  const moduleId = pathname.slice(MODULE_ROUTE_PREFIX.length).trim();
  return moduleId || null;
};

const Dashboard = () => {
  const { t } = useTranslation();
  const { congregation } = useAppContext();
  const { user, logout } = useAuth();
  const { features } = useSetup();
  const [, rerenderRoute] = useReducer((value: number) => value + 1, 0);

  const refreshRoute = useCallback(() => {
    rerenderRoute();
  }, []);

  const featureById = useMemo(() => {
    const byId = new Map<string, (typeof features)[number]>();
    features.forEach((feature) => {
      byId.set(feature.id, feature);
    });
    return byId;
  }, [features]);

  const congregationType = congregation?.type ?? '';
  const availableModules = useMemo(() => {
    const moduleIds = congregation?.features ?? [];

    return moduleIds.map((moduleId) => {
      const feature = featureById.get(moduleId);

      return {
        id: moduleId,
        title: feature?.title ?? moduleId,
        description: (feature?.description ?? '').replace(
          '{type}',
          congregationType,
        ),
      };
    });
  }, [congregation?.features, congregationType, featureById]);

  const currentModuleId = getModuleFromPath(window.location.pathname);
  const selectedModule =
    availableModules.find((module) => module.id === currentModuleId) ?? null;

  const navigateToModule = useCallback((moduleId: string) => {
    const nextPath = `${MODULE_ROUTE_PREFIX}${moduleId}`;
    if (window.location.pathname === nextPath) return;

    window.history.pushState(null, '', nextPath);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      refreshRoute();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [refreshRoute]);

  useEffect(() => {
    if (!availableModules.length) return;

    const routeModuleId = getModuleFromPath(window.location.pathname);
    const isValidRoute = routeModuleId
      ? availableModules.some((module) => module.id === routeModuleId)
      : false;

    if (isValidRoute) return;

    window.history.replaceState(
      null,
      '',
      `${MODULE_ROUTE_PREFIX}${availableModules[0].id}`,
    );
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, [availableModules]);

  return (
    <Box sx={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static">
        <Toolbar>
          <LogoSmall
            alt={congregation?.name || 'Congr.io'}
            size={34}
            containerSx={{
              mr: 1.25,
            }}
          />

          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {congregation?.name || 'Congr.io'}
          </Typography>

          <Typography
            variant="body2"
            sx={{ mr: 1, display: { xs: 'none', sm: 'inline' } }}
          >
            {user?.name || user?.username}
          </Typography>

          <Button color="inherit" onClick={logout} sx={{ ml: 1 }}>
            {t('pages.dashboard.logout')}
          </Button>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '280px 1fr' },
          gap: 2,
          p: 2,
          flex: 1,
        }}
      >
        <Paper variant="outlined" sx={{ alignSelf: 'start' }}>
          <Typography variant="subtitle1" sx={{ px: 2, py: 1.5 }}>
            {t('pages.dashboard.modules')}
          </Typography>
          <Divider />
          <List disablePadding>
            {availableModules.map((module) => (
              <ListItemButton
                key={module.id}
                selected={selectedModule?.id === module.id}
                onClick={() => navigateToModule(module.id)}
              >
                <ListItemText primary={module.title} />
              </ListItemButton>
            ))}
          </List>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          {!availableModules.length ? (
            <Typography variant="body1">
              {t('pages.dashboard.noModules')}
            </Typography>
          ) : selectedModule ? (
            <>
              <Typography variant="h4" gutterBottom>
                {selectedModule.title}
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ whiteSpace: 'pre-line' }}
              >
                {selectedModule.description}
              </Typography>
            </>
          ) : (
            <Typography variant="body1">
              {t('pages.dashboard.moduleNotFound')}
            </Typography>
          )}
        </Paper>
      </Box>

      <PWABadge />
    </Box>
  );
};

export default Dashboard;
