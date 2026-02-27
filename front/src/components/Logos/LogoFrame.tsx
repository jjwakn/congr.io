import { Box } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import {
  LogoBackgroundMode,
  getLogoBackgroundMode,
} from '../../utils/brandingManifest';
import { LogoFrameProps } from './types';

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

export const LogoFrame = ({ alt, containerSx, children }: LogoFrameProps) => {
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
