import { Box } from '@mui/material';
import { LogoFrame } from './LogoFrame';
import { LogoProps } from './types';

export const LogoBig = ({ alt, size = 160, containerSx, imageSx }: LogoProps) => (
  <LogoFrame alt={alt} containerSx={containerSx}>
    <Box
      component="img"
      src="/branding/logo-big.png"
      alt={alt}
      sx={{
        display: 'block',
        maxWidth: '100%',
        width: 'auto',
        maxHeight: size,
        objectFit: 'contain',
        ...imageSx,
      }}
    />
  </LogoFrame>
);
