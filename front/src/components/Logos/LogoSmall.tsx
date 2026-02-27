import { Box } from '@mui/material';
import { LogoFrame } from './LogoFrame';
import { LogoProps } from './types';

export const LogoSmall = ({
  alt,
  size = 34,
  containerSx,
  imageSx,
}: LogoProps) => (
  <LogoFrame alt={alt} containerSx={containerSx}>
    <Box
      component="img"
      src="/branding/logo-small.png"
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
