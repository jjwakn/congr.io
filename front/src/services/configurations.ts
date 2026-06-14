import { ModuleType } from '@utils/http';

export const ConfigurationsService: ModuleType = {
  getTheme: { url: 'configurations/theme', method: 'GET' },
  updateTheme: { url: 'configurations/theme', method: 'PUT' },
};
