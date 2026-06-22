import type { ModuleType } from '@utils/http';

export const FilesService: ModuleType = {
  status: { url: 'files/status', method: 'GET' },
  uploadEventImage: { url: 'files/event-image', method: 'POST' },
  uploadCongregationLogoSmall: { url: 'files/congregation-logo/small', method: 'POST' },
  uploadCongregationLogoBig: { url: 'files/congregation-logo/big', method: 'POST' },
};
