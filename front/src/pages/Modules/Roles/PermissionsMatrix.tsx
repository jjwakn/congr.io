import {
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { PermissionsMatrixProps } from './roles.types';

export const PermissionsMatrix = ({ actions, disabled, value, sections, onToggle }: PermissionsMatrixProps) => {
  const { t } = useTranslation();

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t('pages.modules.roles.permissions.columns.section')}</TableCell>
            {actions.map((action) => (
              <TableCell key={action} align="center">
                {t(`pages.modules.roles.columns.${action}`, { defaultValue: action })}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {sections.map((section) => (
            <TableRow key={section.id}>
              <TableCell component="th" scope="row">
                {t(`pages.modules.roles.permissions.sections.${section.id}`, {
                  defaultValue: section.id,
                })}
              </TableCell>

              {actions.map((action) => {
                const isSupported = section.permissions.includes(action);
                const isChecked = value[section.id]?.includes(action) ?? false;

                return (
                  <TableCell key={`${section.id}-${action}`} align="center">
                    {isSupported ? (
                      <Switch
                        size="small"
                        checked={isChecked}
                        disabled={disabled}
                        onChange={() => onToggle(section.id, action)}
                      />
                    ) : (
                      <Typography variant="body2" color="text.disabled">
                        -
                      </Typography>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
