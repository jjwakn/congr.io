import { useAppContext } from '@hooks/useAppContext';
import { useAuth } from '@hooks/useAuth';
import { useNotificationContext } from '@hooks/useNotifications';
import { useSetup } from '@hooks/useSetup';
import { useTheme } from '@hooks/useTheme';
import { Box } from '@mui/material';
import { DashboardContentRoutes } from '@pages/Dashboard/DashboardContentRoutes';
import { DashboardHeader } from '@pages/Dashboard/DashboardHeader';
import { DashboardNavigationDrawer } from '@pages/Dashboard/DashboardNavigationDrawer';
import type { DashboardModuleView } from '@pages/Modules/modules.types';
import { canRenderModuleRoute } from '@pages/Modules/routes';
import { ConfigurationsService } from '@services/configurations';
import { CongregationsService } from '@services/congregations';
import { createModuleNavigationItem, createSettingsNavigationItem } from '@utils/dashboard';
import { HttpRequestError, httpRequest } from '@utils/http';
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
import type { Congregation } from '@/types/congregation.types';
import type { ThemePaletteConfig } from '@/types/theme.types';

const Dashboard = () => {
  const { i18n, t } = useTranslation();
  const { congregation, selectCongregation } = useAppContext();
  const { user, logout, hasPermission } = useAuth();
  const { showNotification } = useNotificationContext();
  const { setPaletteConfig } = useTheme();
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

  const availableModules = useMemo<DashboardModuleView[]>(() => {
    const moduleIds = congregation?.features ?? [];
    const modules = moduleIds.map((moduleId) => {
      const feature = featureById.get(moduleId);

      return {
        id: moduleId,
        title: feature?.title ?? moduleId,
        path: getModulePath(moduleId, i18n.language),
      };
    });

    if (moduleIds.includes('users') && hasPermission('role', 'get')) {
      modules.push({
        id: 'roles',
        title: t('pages.modules.roles.title'),
        path: getModulePath('roles', i18n.language),
      });
    }

    return modules.sort((left, right) =>
      left.title.localeCompare(right.title, i18n.language, {
        sensitivity: 'base',
      }),
    );
  }, [congregation?.features, featureById, hasPermission, i18n.language, t]);
  const renderableModules = useMemo(
    () => availableModules.filter((module) => canRenderModuleRoute(module.id)),
    [availableModules],
  );
  const settingsPath = useMemo(() => getSettingsPath(i18n.language), [i18n.language]);

  const pathname = location.pathname;

  const navigationItems = useMemo(
    () => [
      ...renderableModules.map((module) =>
        createModuleNavigationItem({
          moduleId: module.id,
          label: module.title,
          path: module.path,
        }),
      ),
      createSettingsNavigationItem({
        label: t('pages.dashboard.settings'),
        language: i18n.language,
      }),
    ],
    [i18n.language, renderableModules, t],
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

  const userCongregations = useMemo(() => user?.congregations ?? [], [user?.congregations]);

  const handleCongregationChange = useCallback(
    async (congregationId: string) => {
      const membership = userCongregations.find(({ id }) => id === congregationId);
      if (!membership) return;

      try {
        const selected = await httpRequest<Congregation>({
          service: CongregationsService.get,
          data: { id: congregationId },
          headers: { 'X-Congregation-Id': congregationId },
        });
        selectCongregation(selected);

        const palette = await httpRequest<ThemePaletteConfig>({
          service: ConfigurationsService.getTheme,
          headers: { 'X-Congregation-Id': congregationId },
        });
        setPaletteConfig(palette);
      } catch (value) {
        const message =
          value instanceof HttpRequestError || value instanceof Error
            ? value.message
            : t('pages.dashboard.congregationSwitchFailed');
        showNotification(message, { severity: 'error' });
      }
    },
    [selectCongregation, setPaletteConfig, showNotification, t, userCongregations],
  );

  useEffect(() => {
    if (!userCongregations.length) return;

    const selectedIsAvailable = userCongregations.some(({ id }) => id === congregation?.id);
    const nextCongregationId = selectedIsAvailable ? congregation?.id : userCongregations[0].id;
    if (!nextCongregationId || (selectedIsAvailable && congregation?.locations)) return;

    void handleCongregationChange(nextCongregationId);
  }, [congregation?.id, congregation?.locations, handleCongregationChange, userCongregations]);

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
    const matchedModule = routeModuleId
      ? (renderableModules.find((module) => module.id === routeModuleId) ?? null)
      : null;

    if (matchedModule) {
      const localizedPath = matchedModule.path;
      if (pathname === localizedPath) return;

      navigate(localizedPath, { replace: true });
      return;
    }

    const fallbackPath = getHomePath();
    if (pathname === fallbackPath) return;

    navigate(fallbackPath, { replace: true });
  }, [i18n.language, navigate, pathname, renderableModules]);

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
        congregationId={congregation?.id}
        congregations={userCongregations}
        username={user?.username}
        homeLabel={t('pages.dashboard.home')}
        logoutLabel={t('pages.dashboard.logout')}
        switchCongregationLabel={t('pages.dashboard.switchCongregation')}
        onLogout={logout}
        onMenuClick={() => setIsDrawerOpen(true)}
        onLogoClick={navigateHome}
        onCongregationChange={(congregationId) => void handleCongregationChange(congregationId)}
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
          availableModules={renderableModules}
          homeTitle={t('pages.dashboard.welcomeTitle')}
          homeSubtitle={t('pages.dashboard.successMessage')}
          settingsTitle={t('pages.settings.title')}
          loadingLabel={t('pages.dashboard.loading')}
          moduleNotFoundLabel={t('pages.dashboard.moduleNotFound')}
          settingsPath={settingsPath}
        />
      </Box>

      <PWABadge />
    </Box>
  );
};

export default Dashboard;
