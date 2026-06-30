import type { CommonEntity } from './common.types';
import type { Location } from './congregation.types';
import type { Person } from './person.types';

export interface ServiceAttendanceGroup {
  id: string;
  label: string;
  color: string;
}

export interface Service extends CommonEntity {
  id: string;
  congregation_id: string;
  location_id: string;
  location?: Location;
  name: string;
  description: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  attendance_groups: ServiceAttendanceGroup[];
}

export interface ServiceListResponse {
  result: Service[];
  total: number;
}

export interface ServiceNewPerson extends CommonEntity {
  id: string;
  group_id: string;
  person_id: string;
  person: Person;
}

export interface ServiceNewPeople extends CommonEntity {
  id: string;
  congregation_id: string;
  service_id: string;
  service?: Service;
  date: string;
  notes: string;
  people?: ServiceNewPerson[];
}

export interface ServiceNewPeopleListResponse {
  result: ServiceNewPeople[];
  total: number;
}

export interface ServiceAttendanceCount {
  group_id: string;
  label: string;
  color: string;
  count: number;
}

export interface ServiceAttendance extends CommonEntity {
  id: string;
  congregation_id: string;
  service_id: string;
  service?: Service;
  date: string;
  counts: ServiceAttendanceCount[];
  notes: string;
}

export interface ServiceAttendanceListResponse {
  result: ServiceAttendance[];
  total: number;
}
