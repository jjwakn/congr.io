import { Box } from '@mui/material';
import { ReactNode } from 'react';
import Footer from '../Footer';

const Layout = ({ children, showFooter = false }: { children: ReactNode; showFooter?: boolean }) => {
  return (
    <Box
      sx={{
        position: 'relative',
        height: '100svh',
        width: '100svw',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ width: '100%', height: '100%', overflowY: 'auto' }}>{children}</Box>

      {showFooter ? <Footer /> : null}
    </Box>
  );
};

export default Layout;
