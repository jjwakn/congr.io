export interface CustomFieldsSettingsTabProps {
  canViewEventTypes: boolean;
  canViewEventFields: boolean;
  canViewPersonFields: boolean;
  initialTab?: 'eventTypes' | 'eventFields' | 'personFields';
}
