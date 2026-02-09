import { Box, SxProps, Theme } from '@mui/material';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  LogoBackgroundMode,
  getLogoBackgroundMode,
} from '../../utils/brandingManifest';

type LogoProps = {
  alt: string;
  size?: number;
  containerSx?: SxProps<Theme>;
  imageSx?: SxProps<Theme>;
};

const resolveBackground = (mode: LogoBackgroundMode): string => {
  if (mode === 'white') return '#ffffff';
  if (mode === 'black') return '#000000';
  return 'transparent';
};

const useManifestLogoBackground = () => {
  const [mode, setMode] = useState<LogoBackgroundMode>('transparent');

  useEffect(() => {
    let isActive = true;

    const loadBackground = async () => {
      const nextMode = await getLogoBackgroundMode();
      if (isActive) setMode(nextMode);
    };

    void loadBackground();

    return () => {
      isActive = false;
    };
  }, []);

  return mode;
};

const LogoFrame = ({
  alt,
  containerSx,
  children,
}: {
  alt: string;
  containerSx?: SxProps<Theme>;
  children: ReactNode;
}) => {
  const backgroundMode = useManifestLogoBackground();
  const backgroundColor = useMemo(
    () => resolveBackground(backgroundMode),
    [backgroundMode],
  );

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 1,
        p: backgroundColor === 'transparent' ? 0 : 0.5,
        bgcolor: backgroundColor,
        ...containerSx,
      }}
      aria-label={alt}
    >
      {children}
    </Box>
  );
};

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

export const LogoBig = ({
  alt,
  size = 160,
  containerSx,
  imageSx,
}: LogoProps) => (
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
