import { DarkMode, LightMode } from '@mui/icons-material'
import { IconButton } from '@mui/material'
import React from 'react'
import { useTheme } from '../../hooks/useTheme'

export const ThemeToggleButton: React.FC = () => {
  const { mode, toggleMode } = useTheme()

  return (
    <IconButton onClick={toggleMode} color="inherit">
      {mode === 'dark' ? <LightMode /> : <DarkMode />}
    </IconButton>
  )
}
