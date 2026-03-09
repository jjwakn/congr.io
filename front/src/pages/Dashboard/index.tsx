import { useAppContext } from '@hooks/useAppContext';
import { useAuth } from '@hooks/useAuth';
import { useSetup } from '@hooks/useSetup';
import { Box } from '@mui/material';
import { DashboardContentRoutes } from '@pages/Dashboard/DashboardContentRoutes';
import { DashboardHeader } from '@pages/Dashboard/DashboardHeader';
import { DashboardNavigationDrawer } from '@pages/Dashboard/DashboardNavigationDrawer';
import type { DashboardModuleView } from '@pages/Modules';
import { createModuleNavigationItem, createSettingsNavigationItem } from '@utils/dashboard';
import {
  getHomePath,
  getLocalizedPathname,
  getModuleIdFromPath,
  getModulePath,
  getSettingsPath,
  isHomePath,
  isSettingsPath,
} from '@utils/routes';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import PWABadge from '@/PWABadge';

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
  const availableModules = useMemo<DashboardModuleView[]>(() => {
    const moduleIds = congregation?.features ?? [];

    return moduleIds.map((moduleId) => {
      const feature = featureById.get(moduleId);
      const title = feature?.title ?? moduleId;
      const description = (feature?.description ?? '').replace('{type}', congregationType);

      return {
        id: moduleId,
        title,
        description,
      };
    });
  }, [congregation?.features, congregationType, featureById]);
  const settingsPath = useMemo(() => getSettingsPath(i18n.language), [i18n.language]);

  const pathname = location.pathname;

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
    <Box
      sx={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
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

        <DashboardContentRoutes
          availableModules={availableModules}
          homeTitle={t('pages.dashboard.welcomeTitle')}
          homeSubtitle={t('pages.dashboard.successMessage')}
          settingsTitle={t('pages.settings.title')}
          settingsSubtitle={t('pages.settings.subtitle')}
          loadingLabel={t('pages.dashboard.loading')}
          noModulesLabel={t('pages.dashboard.noModules')}
          moduleNotFoundLabel={t('pages.dashboard.moduleNotFound')}
          settingsPath={settingsPath}
        />
      </Box>

      <PWABadge />
    </Box>
  );
};

export default Dashboard;
