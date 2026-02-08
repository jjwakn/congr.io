import styled from '@emotion/styled';
import { commonPalette, darkGray } from '../../../utils/theme';

export const UploaderWrapper = styled.label<{ overRide: boolean }>`
  ${(props) =>
    props.overRide
      ? ''
      : `
        display: flex;
        align-items: center;
        min-width: 322px;
        max-width: 508px;
        height: 48px;
        border: dashed 2px ${commonPalette.primary.main};
        padding: 8px 16px 8px 8px;
        border-radius: 5px;
        cursor: pointer;
        flex-grow: 0;
      
        &.is-disabled {
          border: dashed 2px ${darkGray};
          cursor: no-drop;
          svg {
            fill: ${darkGray};
            color: ${darkGray};
            path {
              fill: ${darkGray};
              color: ${darkGray};
            }
          }
        }
  `};

  position: relative;

  &:focus-within {
    outline: 2px solid black;
  }
  & > input {
    display: block;
    opacity: 0;
    position: absolute;
    pointer-events: none;
  }
`;
