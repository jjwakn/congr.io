import { PaletteMode } from '@mui/material'
import { createContext } from 'react'

type ThemeContextType = {
  mode: PaletteMode
  toggleMode: () => void
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
)
