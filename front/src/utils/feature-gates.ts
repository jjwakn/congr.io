import type { PermissionSection } from '@/types/permission.types';

export const EVENTS_FEATURE_ID = 'events_calendar';
export const PUBLIC_EVENTS_FEATURE_ID = 'public_events';
export const PERSONS_FEATURE_ID = 'members';
export const FLOWS_FEATURE_ID = 'processes';
export const ATTENDANCE_FEATURE_ID = 'events_attendance';

const SECTION_FEATURES: Record<string, string> = {
  event: EVENTS_FEATURE_ID,
  event_type: EVENTS_FEATURE_ID,
  person: PERSONS_FEATURE_ID,
  person_field: PERSONS_FEATURE_ID,
  process: FLOWS_FEATURE_ID,
  event_attendance: ATTENDANCE_FEATURE_ID,
  event_registration: ATTENDANCE_FEATURE_ID,
};

export const hasCongregationFeature = (features: string[] | undefined, featureId: string) =>
  Boolean(features?.includes(featureId));

export const isSectionFeatureEnabled = (sectionId: string, features: string[] | undefined) => {
  const requiredFeature = SECTION_FEATURES[sectionId];
  return !requiredFeature || hasCongregationFeature(features, requiredFeature);
};

export const filterFeaturePermissionSections = (sections: PermissionSection[], features: string[] | undefined) =>
  sections.filter(({ id }) => isSectionFeatureEnabled(id, features));
