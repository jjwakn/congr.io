import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { ThemeContext } from '../contexts/ThemeContext'

export const useTheme = () => {
  const context = useContext(ThemeContext)

  const { t } = useTranslation()

  if (!context) throw new Error(t('theme.error.useTheme'))
  return context
}
