import Footer from '@components/Footer';
import { Box } from '@mui/material';
import type { ReactNode } from 'react';

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
      <Box
        sx={{
          width: '100%',
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {children}
      </Box>

      {showFooter ? <Footer /> : null}
    </Box>
  );
};

export default Layout;
