import type { ModuleType } from '@utils/http';

export const EventParticipantsService: ModuleType = {
  list: { url: 'event-participant', method: 'GET' },
  attendanceList: { url: 'event-participant/attendance', method: 'GET' },
  create: { url: 'event-participant', method: 'POST' },
  attendanceCreate: { url: 'event-participant/attendance', method: 'POST' },
  setAttendance: { url: 'event-participant/{id}/attendance', method: 'PUT' },
  match: { url: 'event-participant/{id}/match', method: 'PUT' },
  remove: { url: 'event-participant/{id}', method: 'DELETE' },
  publicRegister: { url: 'public/event-registration/{id}', method: 'POST' },
};
