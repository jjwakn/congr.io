import { useAppContext } from '@hooks/useAppContext';
import { useAuth } from '@hooks/useAuth';
import { useSetup } from '@hooks/useSetup';
import { Box, Paper, Typography } from '@mui/material';
import { DashboardHeader } from '@pages/Dashboard/DashboardHeader';
import { DashboardNavigationDrawer } from '@pages/Dashboard/DashboardNavigationDrawer';
import { Home } from '@pages/Dashboard/Home';
import { createModuleNavigationItem, createSettingsNavigationItem } from '@utils/dashboard';
import { getHomePath, getLocalizedPathname, getModuleIdFromPath, getModulePath, isHomePath, isSettingsPath } from '@utils/routes';
import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import PWABadge from '@/PWABadge';

const ModulesRenderer = lazy(async () => {
  const module = await import('@pages/Modules');
  return { default: module.ModulesRenderer };
});
const SettingsPage = lazy(() => import('@pages/Settings'));

const Dashboard = () => {
  const { i18n, t } = useTranslation();
  const { congregation } = useAppContext();
  const { user, logout } = useAuth();
  const { features } = useSetup();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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
      const description = (feature?.description ?? '').replace('{type}', congregationType);

      return {
        id: moduleId,
        title,
        description,
        path: getModulePath(moduleId, i18n.language),
      };
    });
  }, [congregation?.features, congregationType, featureById, i18n.language]);

  const pathname = location.pathname;
  const moduleIdFromPath = getModuleIdFromPath(pathname);
  const isHomeSelected = isHomePath(pathname);
  const isSettingsSelected = isSettingsPath(pathname);
  const selectedModule = availableModules.find((module) => module.id === moduleIdFromPath) ?? null;

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

  const navigateToPath = useCallback(
    (nextPath: string) => {
      if (pathname === nextPath) return;

      navigate(nextPath);
    },
    [navigate, pathname],
  );

  const navigateHome = useCallback(() => {
    navigateToPath(getHomePath());
  }, [navigateToPath]);

  useEffect(() => {
    const localizedPath = getLocalizedPathname(pathname, i18n.language);
    if (pathname === localizedPath) return;

    navigate(`${localizedPath}${location.search}${location.hash}`, {
      replace: true,
    });
  }, [i18n.language, location.hash, location.search, navigate, pathname]);

  useEffect(() => {
    if (isHomePath(pathname)) return;
    if (isSettingsPath(pathname)) return;

    const routeModuleId = getModuleIdFromPath(pathname);
    const isValidRoute = routeModuleId ? availableModules.some((module) => module.id === routeModuleId) : false;

    if (isValidRoute && routeModuleId) {
      const localizedPath = getModulePath(routeModuleId, i18n.language);
      if (pathname === localizedPath) return;

      navigate(localizedPath, { replace: true });
      return;
    }

    const fallbackPath = getHomePath();
    if (pathname === fallbackPath) return;

    navigate(fallbackPath, { replace: true });
  }, [availableModules, i18n.language, navigate, pathname]);

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
            <Suspense fallback={<Typography variant="body1">{t('pages.dashboard.loading')}</Typography>}>
              <SettingsPage />
            </Suspense>
          ) : isHomeSelected ? (
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Home title={t('pages.dashboard.welcomeTitle')} subtitle={t('pages.dashboard.successMessage')} />
            </Paper>
          ) : (
            <Paper variant="outlined" sx={{ p: 3 }}>
              {!availableModules.length ? (
                <Typography variant="body1">{t('pages.dashboard.noModules')}</Typography>
              ) : selectedModule ? (
                <Suspense fallback={<Typography variant="body1">{t('pages.dashboard.loading')}</Typography>}>
                  <ModulesRenderer module={selectedModule} />
                </Suspense>
              ) : (
                <Typography variant="body1">{t('pages.dashboard.moduleNotFound')}</Typography>
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
