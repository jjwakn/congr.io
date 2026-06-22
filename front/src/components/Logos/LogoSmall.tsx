import { Box } from '@mui/material';
import { LogoFrame } from './LogoFrame';
import { LogoProps } from './types';

export const LogoSmall = ({ alt, size = 34, containerSx, imageSx, src = '/branding/logo-small.png' }: LogoProps) => (
  <LogoFrame alt={alt} containerSx={containerSx}>
    <Box
      component="img"
      src={src}
      alt={alt}
      sx={{
        width: size,
        height: size,
        objectFit: 'contain',
        display: 'block',
        ...imageSx,
      }}
    />
  </LogoFrame>
);
