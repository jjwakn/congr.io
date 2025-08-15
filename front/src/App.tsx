import { AppBar, Toolbar, Typography } from '@mui/material';
import PWABadge from './PWABadge.tsx';
import { ThemeToggleButton } from './components/ThemeToggleButton/index.tsx';

function App() {
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            My App
          </Typography>
          <ThemeToggleButton />
        </Toolbar>
      </AppBar>

      <main style={{ padding: 16 }}>
        <p>Welcome to the MUI v7 theme switcher demo 🎨</p>
      </main>

      <PWABadge />
    </>
  );
}

export default App;
