import { Box, Paper, Typography } from '@mui/material';
import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import PWABadge from '../../PWABadge';
import { useAppContext } from '../../hooks/useAppContext';
import { useAuth } from '../../hooks/useAuth';
import { useSetup } from '../../hooks/useSetup';
import {
  createModuleNavigationItem,
  createSettingsNavigationItem,
} from '../../utils/dashboard';
import {
  getHomePath,
  getLocalizedPathname,
  getModuleIdFromPath,
  getModulePath,
  isHomePath,
  isSettingsPath,
} from '../../utils/routes';
import { DashboardHeader } from './DashboardHeader';
import { DashboardNavigationDrawer } from './DashboardNavigationDrawer';
import { Home } from './Home';

const ModulesRenderer = lazy(async () => {
  const module = await import('../Modules');
  return { default: module.ModulesRenderer };
});
const SettingsPage = lazy(() => import('../Settings'));

const Dashboard = () => {
  const { i18n, t } = useTranslation();
  const { congregation } = useAppContext();
  const { user, logout } = useAuth();
  const { features } = useSetup();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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
      const title = feature?.title ?? moduleId;
      const description = (feature?.description ?? '').replace(
        '{type}',
        congregationType,
      );

      return {
        id: moduleId,
        title,
        description,
        path: getModulePath(moduleId, i18n.language),
      };
    });
  }, [congregation?.features, congregationType, featureById, i18n.language]);

  const pathname = window.location.pathname;
  const moduleIdFromPath = getModuleIdFromPath(pathname);
  const isHomeSelected = isHomePath(pathname);
  const isSettingsSelected = isSettingsPath(pathname);
  const selectedModule =
    availableModules.find((module) => module.id === moduleIdFromPath) ?? null;

  const navigationItems = useMemo(
    () => [
      ...availableModules.map((module) =>
        createModuleNavigationItem({
          moduleId: module.id,
          label: module.title,
          language: i18n.language,
        }),
      ),
      createSettingsNavigationItem({
        label: t('pages.dashboard.settings'),
        language: i18n.language,
      }),
    ],
    [availableModules, i18n.language, t],
  );

  const selectedPath = getLocalizedPathname(pathname, i18n.language);

  const navigateToPath = useCallback((nextPath: string) => {
    if (window.location.pathname === nextPath) return;

    window.history.pushState(null, '', nextPath);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);

  const navigateHome = useCallback(() => {
    navigateToPath(getHomePath());
  }, [navigateToPath]);

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
    const localizedPath = getLocalizedPathname(
      window.location.pathname,
      i18n.language,
    );
    if (window.location.pathname === localizedPath) return;

    window.history.replaceState(null, '', localizedPath);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, [i18n.language]);

  useEffect(() => {
    if (isHomePath(window.location.pathname)) return;
    if (isSettingsPath(window.location.pathname)) return;

    const routeModuleId = getModuleIdFromPath(window.location.pathname);
    const isValidRoute = routeModuleId
      ? availableModules.some((module) => module.id === routeModuleId)
      : false;

    if (isValidRoute && routeModuleId) {
      const localizedPath = getModulePath(routeModuleId, i18n.language);
      if (window.location.pathname === localizedPath) return;

      window.history.replaceState(null, '', localizedPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }

    const fallbackPath = getHomePath();
    if (window.location.pathname === fallbackPath) return;

    window.history.replaceState(null, '', fallbackPath);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, [availableModules, i18n.language]);

  return (
    <Box sx={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <DashboardHeader
        congregationName={congregation?.name || 'Congr.io'}
        username={user?.username}
        homeLabel={t('pages.dashboard.home')}
        logoutLabel={t('pages.dashboard.logout')}
        onLogout={logout}
        onMenuClick={() => setIsDrawerOpen(true)}
        onLogoClick={navigateHome}
      />

      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <DashboardNavigationDrawer
          items={navigationItems}
          selectedPath={selectedPath}
          congregationName={congregation?.name || 'Congr.io'}
          homeLabel={t('pages.dashboard.home')}
          open={isDrawerOpen}
          onNavigate={navigateToPath}
          onLogoClick={navigateHome}
          onClose={() => setIsDrawerOpen(false)}
        />

        <Box sx={{ flex: 1, p: { xs: 1.5, md: 2 }, overflowY: 'auto' }}>
          {isSettingsSelected ? (
            <Suspense
              fallback={
                <Typography variant="body1">
                  {t('pages.dashboard.loading')}
                </Typography>
              }
            >
              <SettingsPage />
            </Suspense>
          ) : isHomeSelected ? (
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Home
                title={t('pages.dashboard.welcomeTitle')}
                subtitle={t('pages.dashboard.successMessage')}
              />
            </Paper>
          ) : (
            <Paper variant="outlined" sx={{ p: 3 }}>
              {!availableModules.length ? (
                <Typography variant="body1">
                  {t('pages.dashboard.noModules')}
                </Typography>
              ) : selectedModule ? (
                <Suspense
                  fallback={
                    <Typography variant="body1">
                      {t('pages.dashboard.loading')}
                    </Typography>
                  }
                >
                  <ModulesRenderer module={selectedModule} />
                </Suspense>
              ) : (
                <Typography variant="body1">
                  {t('pages.dashboard.moduleNotFound')}
                </Typography>
              )}
            </Paper>
          )}
        </Box>
      </Box>

      <PWABadge />
    </Box>
  );
};

export default Dashboard;
