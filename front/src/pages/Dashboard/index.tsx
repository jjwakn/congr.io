import { AppBar, Container } from '@mui/material';
import PWABadge from '../../PWABadge';

const Dashboard = () => {
  // const {
  //   congregations,
  //   refreshCongregationData,
  //   lastSyncTime,
  //   isBackgroundSyncEnabled,
  // } = useAppContext();
  // const { user, logout } = useAuth();

  return (
    <>
      <AppBar position="static">
        {/* <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {congregationData?.name || 'Congr.io'}
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Welcome, {user?.name}
          </Typography>
          <ThemeToggleButton />
          <Button color="inherit" onClick={logout} sx={{ ml: 1 }}>
            Logout
          </Button>
        </Toolbar> */}
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  Welcome to your Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Your congregation is successfully configured and ready to use.
                </Typography>

                <Box sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Background Sync:{' '}
                    {isBackgroundSyncEnabled ? '✅ Enabled' : '❌ Disabled'}
                  </Typography>
                  {lastSyncTime && (
                    <Typography variant="body2" color="text.secondary">
                      Last Sync: {lastSyncTime.toLocaleString()}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={refreshCongregationData}
                    sx={{ mr: 1 }}
                  >
                    Refresh Data
                  </Button>
                  <Button variant="outlined" color="secondary">
                    Settings
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button variant="contained" fullWidth>
                    Manage Members
                  </Button>
                  <Button variant="contained" fullWidth>
                    Schedule Events
                  </Button>
                  <Button variant="contained" fullWidth>
                    View Reports
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Activity
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No recent activity to display.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid> */}
        <p>hello</p>
      </Container>

      <PWABadge />
    </>
  );
};

export default Dashboard;
