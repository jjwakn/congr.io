import { PersonAutocomplete } from '@components/common/PersonAutocomplete';
import { DialogTitleBar } from '@components/common/forms/DialogTitleBar';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';
import { EventParticipantsService } from '@services/eventParticipants';
import { PersonFieldsService, PersonsService } from '@services/persons';
import { httpRequest } from '@utils/http';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { JsonObject, JsonValue } from '@/types/json.types';
import type { Person, PersonField } from '@/types/person.types';
import { PersonFormDialog } from '../Persons/PersonFormDialog';
import type { PersonFieldFormValues, PersonFormValues } from '../Persons/persons.types';
import { EventRegistrationFields } from '../Registration/EventRegistrationFields';
import type { EventParticipantsEditorDialogProps } from './EventParticipantsEditorDialog.types';

const getPersonMappedValue = (fieldId: string | undefined, person: Person): JsonValue | undefined => {
  if (!fieldId) return undefined;

  const standardValues: JsonObject = {
    age: person.registered_age,
    birthdate: person.birthdate,
    code: person.code,
    email: person.email,
    first_name: person.first_name,
    last_name: person.last_name,
    married_name: person.married_name,
    middle_name: person.middle_name,
    phone: person.phone,
    second_last_name: person.second_last_name,
  };

  return standardValues[fieldId] ?? person.custom_values[fieldId];
};

const getParticipantName = (participant: EventParticipantsEditorDialogProps['participants'][number]) => {
  if (participant.person) {
    return `${participant.person.code} · ${participant.person.first_name} ${participant.person.last_name}`;
  }

  return `${String(participant.submitted_person.first_name ?? '')} ${String(
    participant.submitted_person.last_name ?? '',
  )}`.trim();
};

const formatFieldValue = (value: JsonValue | undefined) => {
  if (Array.isArray(value)) return value.join(', ');
  return String(value ?? '-');
};

export const EventParticipantsEditorDialog = ({
  canAdd,
  canCreatePerson,
  canCreatePersonFields,
  canRemove,
  canUpdateAttendance = false,
  event,
  mode,
  onClose,
  onReload,
  open,
  participants,
  personFields,
}: EventParticipantsEditorDialogProps) => {
  const { t } = useTranslation();
  const [person, setPerson] = useState<Person | null>(null);
  const [fieldValues, setFieldValues] = useState<JsonObject>({});
  const [localPersonFields, setLocalPersonFields] = useState<PersonField[]>(personFields);
  const [personOpen, setPersonOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fields = useMemo(() => event?.custom_fields ?? [], [event?.custom_fields]);
  const requiredMissing = fields.some(
    (field) => field.required && (fieldValues[field.id] === undefined || fieldValues[field.id] === ''),
  );
  const title = mode === 'attendance' ? t('pages.attendance.editPeople') : t('pages.registration.editPeople');
  const emptyText = mode === 'attendance' ? t('pages.attendance.peopleEmpty') : t('pages.registration.peopleEmpty');
  const addService =
    mode === 'attendance' ? EventParticipantsService.attendanceCreate : EventParticipantsService.create;
  const removeService =
    mode === 'attendance' ? EventParticipantsService.attendanceRemove : EventParticipantsService.remove;

  useEffect(() => {
    setLocalPersonFields(personFields);
  }, [personFields]);

  const getMappedValuesForPerson = useCallback(
    (nextPerson: Person) =>
      Object.fromEntries(
        fields.flatMap((field) => {
          const mapped = getPersonMappedValue(field.person_field_id, nextPerson);
          return mapped === undefined ? [] : [[field.id, mapped]];
        }),
      ),
    [fields],
  );

  const addPerson = async (nextPerson: Person, nextValues: JsonObject) => {
    if (!event) return;
    setSubmitting(true);
    try {
      await httpRequest({
        service: addService,
        data: {
          event_id: event.id,
          person_id: nextPerson.id,
          field_values: nextValues,
        },
      });
      setPerson(null);
      setFieldValues({});
      await onReload();
    } finally {
      setSubmitting(false);
    }
  };

  const createPerson = async (values: PersonFormValues) => {
    setSubmitting(true);
    try {
      const created = await httpRequest<Person>({ service: PersonsService.create, data: values });
      const nextValues = {
        ...fieldValues,
        ...getMappedValuesForPerson(created),
      };
      setPersonOpen(false);
      await addPerson(created, nextValues);
    } finally {
      setSubmitting(false);
    }
  };

  const savePersonField = async (values: PersonFieldFormValues) => {
    const created = await httpRequest<PersonField>({ service: PersonFieldsService.create, data: values });
    setLocalPersonFields((current) =>
      [...current, created].sort((left, right) => left.label.localeCompare(right.label)),
    );
    return created;
  };

  const removeParticipant = async (participantId: string) => {
    setSubmitting(true);
    try {
      await httpRequest({ service: removeService, data: { id: participantId } });
      await onReload();
    } finally {
      setSubmitting(false);
    }
  };

  const setAttendance = async (participantId: string, attended: boolean) => {
    setSubmitting(true);
    try {
      await httpRequest({
        service: EventParticipantsService.setAttendance,
        data: { id: participantId, attended },
      });
      await onReload();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="md">
        <DialogTitleBar title={`${title}: ${event?.name ?? ''}`} closeDisabled={submitting} onClose={onClose} />
        <DialogContent dividers>
          <Stack spacing={2}>
            <Stack spacing={1}>
              {participants.map((participant) => (
                <Stack
                  key={participant.id}
                  direction={{ xs: 'column', md: 'row' }}
                  alignItems={{ xs: 'stretch', md: 'center' }}
                  justifyContent="space-between"
                  spacing={1}
                  sx={{ borderBottom: 1, borderColor: 'divider', py: 1 }}
                >
                  <Stack sx={{ minWidth: 0 }}>
                    <Typography>{getParticipantName(participant) || t('pages.attendance.publicSubmission')}</Typography>
                    {fields.length ? (
                      <Typography variant="caption" color="text.secondary">
                        {fields
                          .map((field) => `${field.label}: ${formatFieldValue(participant.field_values[field.id])}`)
                          .join(' · ')}
                      </Typography>
                    ) : null}
                  </Stack>
                  <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1}>
                    {mode === 'attendance' ? (
                      <Switch
                        checked={participant.attended}
                        disabled={!canUpdateAttendance || submitting}
                        onChange={(_event, checked) => void setAttendance(participant.id, checked)}
                      />
                    ) : null}
                    {canRemove ? (
                      <Tooltip title={t('form.common.delete')}>
                        <span>
                          <IconButton
                            color="error"
                            disabled={submitting}
                            onClick={() => void removeParticipant(participant.id)}
                          >
                            <DeleteOutlineRoundedIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    ) : null}
                  </Stack>
                </Stack>
              ))}
              {!participants.length ? (
                <Typography variant="body2" color="text.secondary">
                  {emptyText}
                </Typography>
              ) : null}
            </Stack>
            {canAdd ? (
              <Stack spacing={1.5}>
                <PersonAutocomplete
                  value={person}
                  onChange={(nextPerson) => {
                    setPerson(nextPerson);
                    setFieldValues(nextPerson ? getMappedValuesForPerson(nextPerson) : {});
                  }}
                  label={t('pages.attendance.person')}
                  createLabel={t('pages.attendance.createPerson')}
                  onCreate={canCreatePerson ? () => setPersonOpen(true) : undefined}
                />
                {fields.length ? (
                  <EventRegistrationFields fields={fields} values={fieldValues} onChange={setFieldValues} />
                ) : null}
                <Button
                  startIcon={<PersonAddAltOutlinedIcon />}
                  variant="contained"
                  disabled={!person || requiredMissing || submitting}
                  onClick={() => person && void addPerson(person, fieldValues)}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  {t('pages.attendance.add')}
                </Button>
              </Stack>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={submitting}>
            {t('form.field.close')}
          </Button>
        </DialogActions>
      </Dialog>
      <PersonFormDialog
        open={personOpen}
        person={null}
        fields={localPersonFields}
        canCreateFields={canCreatePersonFields}
        submitting={submitting}
        onClose={() => setPersonOpen(false)}
        onSubmit={(values) => void createPerson(values)}
        onCreateField={savePersonField}
      />
    </>
  );
};
