import { styled } from '@mui/material/styles';
import { darkGray } from '../../../utils/theme';

export const UploaderWrapper = styled('label', {
  shouldForwardProp: (prop) => prop !== 'overRide',
})<{ overRide: boolean }>(({ overRide, theme }) => ({
  ...(overRide
    ? {}
    : {
        display: 'flex',
        alignItems: 'center',
        minWidth: '322px',
        maxWidth: '508px',
        height: '48px',
        border: `dashed 2px ${theme.palette.primary.main}`,
        padding: '8px 16px 8px 8px',
        borderRadius: '5px',
        cursor: 'pointer',
        flexGrow: 0,
        '&.is-disabled': {
          border: `dashed 2px ${darkGray}`,
          cursor: 'no-drop',
          svg: {
            fill: darkGray,
            color: darkGray,
            path: {
              fill: darkGray,
              color: darkGray,
            },
          },
        },
      }),
  position: 'relative',
  '&:focus-within': {
    outline: '2px solid black',
  },
  '& > input': {
    display: 'block',
    opacity: 0,
    position: 'absolute',
    pointerEvents: 'none',
  },
}));
