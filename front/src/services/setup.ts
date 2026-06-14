import { ModuleType } from '@utils/http';

export const SetupService: ModuleType = {
  isSetup: { url: 'setup', method: 'GET' },
  setup: { url: 'setup', method: 'POST' },
};
