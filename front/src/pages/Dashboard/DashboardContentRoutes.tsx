import { Box, Typography } from '@mui/material';
import { DashboardSectionFrame } from '@pages/Dashboard/DashboardSectionFrame';
import type { DashboardModuleView } from '@pages/Modules/modules.types';
import { getModuleRoute } from '@pages/Modules/routes';
import { getHomePath } from '@utils/routes';
import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { DashboardContentRoutesProps } from './DashboardContentRoutes.types';

const SettingsPage = lazy(() => import('@pages/Settings'));

export const DashboardContentRoutes = ({
  availableModules,
  homeTitle,
  homeSubtitle,
  settingsTitle,
  loadingLabel,
  moduleNotFoundLabel,
  settingsPath,
}: DashboardContentRoutesProps) => {
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
            element={
              <DashboardSectionFrame title={homeTitle}>
                <Typography variant="body1" color="text.secondary">
                  {homeSubtitle}
                </Typography>
              </DashboardSectionFrame>
            }
          />

          <Route
            path={settingsPath}
            element={
              <DashboardSectionFrame title={settingsTitle}>
                <Suspense fallback={fallback}>
                  <SettingsPage showHeader={false} />
                </Suspense>
              </DashboardSectionFrame>
            }
          />

          {availableModules.map((module: DashboardModuleView) => {
            const route = getModuleRoute(module.id);
            if (!route) return null;

            const ModuleComponent = route.Component;

            return (
              <Route
                key={module.id}
                path={module.path}
                element={
                  <DashboardSectionFrame title={module.title}>
                    <ModuleComponent />
                  </DashboardSectionFrame>
                }
              />
            );
          })}

          <Route
            path="*"
            element={
              <DashboardSectionFrame title={moduleNotFoundLabel}>
                <Typography variant="body1" color="text.secondary">
                  {moduleNotFoundLabel}
                </Typography>
              </DashboardSectionFrame>
            }
          />
        </Routes>
      </Box>
    </Box>
  );
};
