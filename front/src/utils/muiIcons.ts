import * as MuiIcons from '@mui/icons-material';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import { type ComponentType, createElement } from 'react';

export const DEFAULT_MUI_ICON = 'CalendarMonth';

const MUI_ICONS = MuiIcons as Record<string, ComponentType<SvgIconProps>>;

export const MUI_ICON_OPTIONS = Object.keys(MUI_ICONS)
  .filter((name) => /^[A-Z]/.test(name))
  .sort((left, right) => left.localeCompare(right));

export const getMuiIcon = (name?: string | null): ComponentType<SvgIconProps> =>
  MUI_ICONS[name || DEFAULT_MUI_ICON] ?? MUI_ICONS[DEFAULT_MUI_ICON];

export interface MuiIconProps extends Omit<SvgIconProps, 'name'> {
  name?: string | null;
}

export const MuiIcon = ({ name, ...props }: MuiIconProps) => createElement(getMuiIcon(name), props);
