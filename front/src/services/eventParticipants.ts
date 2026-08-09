import type { ModuleType } from '@utils/http';

export const EventParticipantsService: ModuleType = {
  list: { url: 'event-participant', method: 'GET' },
  attendanceList: { url: 'event-participant/attendance', method: 'GET' },
  create: { url: 'event-participant', method: 'POST' },
  attendanceCreate: { url: 'event-participant/attendance', method: 'POST' },
  setAttendance: { url: 'event-participant/{id}/attendance', method: 'PUT' },
  clearAttendanceEvent: { url: 'event-participant/attendance/event/{id}', method: 'DELETE' },
  attendanceRemove: { url: 'event-participant/attendance/{id}', method: 'DELETE' },
  match: { url: 'event-participant/{id}/match', method: 'PUT' },
  clearRegistrationEvent: { url: 'event-participant/event/{id}', method: 'DELETE' },
  remove: { url: 'event-participant/{id}', method: 'DELETE' },
  publicRegister: { url: 'public/event-registration/{id}', method: 'POST' },
};
