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
import { UsersService } from '@services/users';
import { API_URL } from '@utils/constants';
import {
  createDashboardNavigationCategories,
  createModuleNavigationItem,
  createSettingsNavigationItem,
} from '@utils/dashboard';
import { HttpRequestError, httpRequest } from '@utils/http';
import { getPreloadedResource, preloadDashboardResources } from '@utils/preload';
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
import type { CalendarEvent, EventsListResponse } from '@/types/event.types';
import type { ThemePaletteConfig } from '@/types/theme.types';

const Dashboard = () => {
  const { i18n, t } = useTranslation();
  const { congregation, selectCongregation } = useAppContext();
  const { user, logout, hasPermission, refreshSession } = useAuth();
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
        title: moduleId === 'events_calendar' ? t('pages.events.calendar') : (feature?.title ?? moduleId),
        path: moduleId === 'events_calendar' ? getHomePath() : getModulePath(moduleId, i18n.language),
      };
    });

    if (moduleIds.includes('users') && hasPermission('role', 'get')) {
      modules.push({
        id: 'roles',
        title: t('pages.modules.roles.title'),
        path: getModulePath('roles', i18n.language),
      });
    }

    if (moduleIds.includes('events_calendar') && hasPermission('event', 'get')) {
      modules.push({
        id: 'events',
        title: t('pages.events.title'),
        path: getModulePath('events', i18n.language),
      });
    }

    if (
      moduleIds.includes('events_attendance') &&
      hasPermission('event_registration', 'get') &&
      hasPermission('event', 'get') &&
      hasPermission('person', 'get')
    ) {
      modules.push({
        id: 'event_registration',
        title: t('pages.registration.title'),
        path: getModulePath('event_registration', i18n.language),
      });
    }

    return modules
      .filter(
        (module) =>
          (module.id !== 'events_attendance' ||
            (hasPermission('event_attendance', 'get') &&
              hasPermission('event', 'get') &&
              hasPermission('person', 'get'))) &&
          (module.id !== 'services' || hasPermission('service', 'get')) &&
          (module.id !== 'services_new_people' ||
            (hasPermission('service_new_people', 'get') &&
              hasPermission('service', 'get') &&
              hasPermission('person', 'get'))) &&
          (module.id !== 'services_follow_up' ||
            (hasPermission('service_follow_up', 'get') &&
              hasPermission('service_new_people', 'get') &&
              hasPermission('person', 'get'))) &&
          (module.id !== 'services_attendance' ||
            (hasPermission('service_attendance', 'get') && hasPermission('service', 'get'))),
      )
      .sort((left, right) =>
        left.title.localeCompare(right.title, i18n.language, {
          sensitivity: 'base',
        }),
      );
  }, [congregation?.features, featureById, hasPermission, i18n.language, t]);
  const renderableModules = useMemo(
    () => availableModules.filter((module) => canRenderModuleRoute(module.id)),
    [availableModules],
  );
  const sidebarOrder = useMemo(() => user?.preferences?.sidebar_order ?? [], [user?.preferences?.sidebar_order]);
  const favorites = useMemo(() => user?.preferences?.favorites ?? [], [user?.preferences?.favorites]);
  const [favoriteRegistrationEvents, setFavoriteRegistrationEvents] = useState<CalendarEvent[]>([]);
  const settingsPath = useMemo(() => getSettingsPath(i18n.language), [i18n.language]);

  const pathname = location.pathname;
  const congregationLogoSrc = congregation?.logo_small_file_id
    ? `${API_URL.replace(/\/$/, '')}/files/public/${congregation.logo_small_file_id}`
    : undefined;

  const navigationCategories = useMemo(
    () =>
      createDashboardNavigationCategories({
        modules: renderableModules,
        sidebarOrder,
        language: i18n.language,
        t,
      }),
    [i18n.language, renderableModules, sidebarOrder, t],
  );
  const orderedModules = useMemo(() => {
    const moduleById = new Map(renderableModules.map((module) => [module.id, module]));

    return navigationCategories
      .flatMap((category) => category.items)
      .map((item) => moduleById.get(item.id))
      .filter((module): module is DashboardModuleView => Boolean(module));
  }, [navigationCategories, renderableModules]);
  const navigationItems = useMemo(
    () => navigationCategories.flatMap((category) => category.items),
    [navigationCategories],
  );
  const settingsItem = useMemo(
    () =>
      createSettingsNavigationItem({
        label: t('pages.dashboard.settings'),
        language: i18n.language,
      }),
    [i18n.language, t],
  );
  useEffect(() => {
    const typeIds = favorites.filter((id) => id.startsWith('registration-type:')).map((id) => id.split(':')[1]);
    const timer = window.setTimeout(() => {
      void preloadDashboardResources({
        favorites,
        pageSize: user?.preferences?.page_sizes?.default ?? 50,
      }).then(() => {
        const result = getPreloadedResource<EventsListResponse>('events')?.result ?? [];
        const latest = typeIds.flatMap((typeId) => {
          const event = result.find((candidate) => candidate.event_type_id === typeId && candidate.attendance_enabled);
          return event ? [event] : [];
        });
        setFavoriteRegistrationEvents(latest);
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [favorites, user?.preferences?.page_sizes?.default]);

  const favoriteItems = useMemo(
    () =>
      favorites
        .map((id) => {
          if (!id.startsWith('registration-type:')) return navigationItems.find((item) => item.id === id);
          const event = favoriteRegistrationEvents.find((candidate) => candidate.event_type_id === id.split(':')[1]);
          return event
            ? {
                ...createModuleNavigationItem({
                  moduleId: 'event_registration',
                  label: t('pages.registration.favoriteTypeLabel', { type: event.type?.name ?? event.name }),
                  path: `${getModulePath('event_registration', i18n.language)}/${event.id}`,
                }),
                id,
              }
            : {
                ...createModuleNavigationItem({
                  moduleId: 'event_registration',
                  label: t('pages.registration.noUpcoming'),
                  path: `${getModulePath('event_registration', i18n.language)}?type=${id.split(':')[1]}`,
                }),
                id,
              };
        })
        .filter(Boolean)
        .slice(0, congregation?.max_favorites ?? 10) as typeof navigationItems,
    [congregation?.max_favorites, favoriteRegistrationEvents, favorites, i18n.language, navigationItems, t],
  );

  const toggleFavorite = useCallback(
    async (moduleId: string) => {
      const limit = congregation?.max_favorites ?? 10;
      const next = favorites.includes(moduleId)
        ? favorites.filter((id) => id !== moduleId)
        : [...favorites, moduleId].slice(0, limit);
      try {
        await httpRequest({ service: UsersService.updatePreferences, data: { favorites: next } });
        await refreshSession();
      } catch (value) {
        showNotification(value instanceof Error ? value.message : t('pages.settings.error.saveFailed'), {
          severity: 'error',
        });
      }
    },
    [congregation?.max_favorites, favorites, refreshSession, showNotification, t],
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
      if (pathname === localizedPath || pathname.startsWith(`${localizedPath}/`)) return;

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
        logoSrc={congregationLogoSrc}
        congregations={userCongregations}
        username={user?.username}
        homeLabel={t('pages.dashboard.home')}
        logoutLabel={t('pages.dashboard.logout')}
        switchCongregationLabel={t('pages.dashboard.switchCongregation')}
        favoriteItems={favoriteItems}
        onLogout={logout}
        onMenuClick={() => setIsDrawerOpen(true)}
        onLogoClick={navigateHome}
        onCongregationChange={(congregationId) => void handleCongregationChange(congregationId)}
        onFavoriteNavigate={navigateToPath}
      />

      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <DashboardNavigationDrawer
          categories={navigationCategories}
          settingsItem={settingsItem}
          selectedPath={selectedPath}
          congregationName={congregation?.name || 'Congr.io'}
          logoSrc={congregationLogoSrc}
          homeLabel={t('pages.dashboard.home')}
          open={isDrawerOpen}
          onNavigate={navigateToPath}
          onLogoClick={navigateHome}
          onClose={() => setIsDrawerOpen(false)}
        />

        <DashboardContentRoutes
          availableModules={orderedModules}
          homeTitle={t('pages.dashboard.welcomeTitle')}
          homeSubtitle={t('pages.dashboard.successMessage')}
          settingsTitle={t('pages.settings.title')}
          loadingLabel={t('pages.dashboard.loading')}
          moduleNotFoundLabel={t('pages.dashboard.moduleNotFound')}
          settingsPath={settingsPath}
          favorites={favorites}
          favoriteLabel={t('pages.dashboard.toggleFavorite')}
          onToggleFavorite={(moduleId) => void toggleFavorite(moduleId)}
        />
      </Box>

      <PWABadge />
    </Box>
  );
};

export default Dashboard;
