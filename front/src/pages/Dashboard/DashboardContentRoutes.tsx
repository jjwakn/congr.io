import { Box, Typography } from '@mui/material';
import { DashboardSectionFrame } from '@pages/Dashboard/DashboardSectionFrame';
import type { DashboardModuleView } from '@pages/Modules';
import { getHomePath, getModuleIdFromPath } from '@utils/routes';
import { Suspense, lazy, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { DashboardContentRoutesProps } from './DashboardContentRoutes.types';

const ModulesRenderer = lazy(async () => {
  const module = await import('@pages/Modules');
  return { default: module.ModulesRenderer };
});
const SettingsPage = lazy(() => import('@pages/Settings'));

const withFullHeight = (content: ReactNode) => <Box sx={{ height: '100%', minHeight: 0 }}>{content}</Box>;

export const DashboardContentRoutes = ({
  availableModules,
  homeTitle,
  homeSubtitle,
  settingsTitle,
  settingsSubtitle,
  loadingLabel,
  noModulesLabel,
  moduleNotFoundLabel,
  settingsPath,
}: DashboardContentRoutesProps) => {
  const location = useLocation();

  const selectedModule = useMemo<DashboardModuleView | null>(() => {
    const moduleIdFromPath = getModuleIdFromPath(location.pathname);
    if (!moduleIdFromPath) return null;
    return availableModules.find((module) => module.id === moduleIdFromPath) ?? null;
  }, [availableModules, location.pathname]);

  const fallback = <Typography variant="body1">{loadingLabel}</Typography>;

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        p: { xs: 1.5, md: 2 },
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <Routes>
          <Route
            path={getHomePath()}
            element={withFullHeight(
              <DashboardSectionFrame title={homeTitle}>
                <Typography variant="body1" color="text.secondary">
                  {homeSubtitle}
                </Typography>
              </DashboardSectionFrame>,
            )}
          />

          <Route
            path={settingsPath}
            element={withFullHeight(
              <DashboardSectionFrame title={settingsTitle} subtitle={settingsSubtitle}>
                <Suspense fallback={fallback}>
                  <SettingsPage showHeader={false} />
                </Suspense>
              </DashboardSectionFrame>,
            )}
          />

          <Route
            path="*"
            element={
              !availableModules.length
                ? withFullHeight(
                    <DashboardSectionFrame title={noModulesLabel}>
                      <Typography variant="body1" color="text.secondary">
                        {noModulesLabel}
                      </Typography>
                    </DashboardSectionFrame>,
                  )
                : selectedModule
                  ? withFullHeight(
                      <DashboardSectionFrame title={selectedModule.title} subtitle={selectedModule.description}>
                        <Suspense fallback={fallback}>
                          <ModulesRenderer module={selectedModule} showSummary={false} />
                        </Suspense>
                      </DashboardSectionFrame>,
                    )
                  : withFullHeight(
                      <DashboardSectionFrame title={moduleNotFoundLabel}>
                        <Typography variant="body1" color="text.secondary">
                          {moduleNotFoundLabel}
                        </Typography>
                      </DashboardSectionFrame>,
                    )
            }
          />
        </Routes>
      </Box>
    </Box>
  );
};
