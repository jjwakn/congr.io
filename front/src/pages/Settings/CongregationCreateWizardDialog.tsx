import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Tooltip,
  Typography,
  createFilterOptions,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { CongregationModulesSelector } from '@pages/Settings/CongregationModulesSelector';
import { CongregationsService } from '@services/congregations';
import { getBrowserTimeZone, getSupportedTimeZones } from '@utils/datetime';
import { HttpRequestError, httpRequest } from '@utils/http';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { User } from '@/types/user.types';
import type {
  CongregationCreateValues,
  CongregationCreateWizardDialogProps,
  CongregationCreationLocation,
  CongregationCreationUsersResponse,
} from './settings.types';

const sortRoles = (user: User) =>
  [...(user.roles ?? [])].sort(
    (left, right) => Number(right.full_access) - Number(left.full_access) || left.name.localeCompare(right.name),
  );

export const CongregationCreateWizardDialog = ({
  open,
  submitting,
  currentUserId,
  features,
  onClose,
  onSubmit,
}: CongregationCreateWizardDialogProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const supportedTimeZones = useMemo(() => getSupportedTimeZones(), []);
  const filterOptions = useMemo(() => createFilterOptions<string>(), []);
  const requiredFeatures = useMemo(() => features.filter(({ required }) => required).map(({ id }) => id), [features]);
  const [activeStep, setActiveStep] = useState(0);
  const [name, setName] = useState('');
  const [type, setType] = useState(() => t('setup.form.defaultType'));
  const [timezone, setTimezone] = useState(getBrowserTimeZone());
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(requiredFeatures);
  const [locations, setLocations] = useState<CongregationCreationLocation[]>([
    { order: 1, name: t('setup.form.locationDefault'), address: '' },
  ]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([currentUserId]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState('');

  const steps = [
    t('pages.settings.congregation.createWizard.steps.congregation'),
    t('pages.settings.congregation.createWizard.steps.modules'),
    t('pages.settings.congregation.createWizard.steps.locations'),
    t('pages.settings.congregation.createWizard.steps.timezone'),
    t('pages.settings.congregation.createWizard.steps.users'),
    t('pages.settings.congregation.createWizard.steps.review'),
  ];

  useEffect(() => {
    if (!open) return;
    let active = true;

    void httpRequest<CongregationCreationUsersResponse>({ service: CongregationsService.creationUsers })
      .then((response) => {
        if (!active) return;
        setUsers(response.result ?? []);
      })
      .catch((value) => {
        if (!active) return;
        setError(
          value instanceof HttpRequestError || value instanceof Error
            ? value.message
            : t('pages.settings.congregation.createWizard.usersLoadFailed'),
        );
      })
      .finally(() => {
        if (active) setLoadingUsers(false);
      });

    return () => {
      active = false;
    };
  }, [open, t]);

  const visibleUsers = useMemo(() => {
    const search = userSearch.trim().toLowerCase();
    if (!search) return users;
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(search) ||
        user.username.toLowerCase().includes(search) ||
        user.roles.some(({ name: roleName }) => roleName.toLowerCase().includes(search)),
    );
  }, [userSearch, users]);

  const selectedUsers = useMemo(() => users.filter(({ id }) => selectedUserIds.includes(id)), [selectedUserIds, users]);

  const close = () => {
    if (!submitting) onClose();
  };

  const moveLocation = (index: number, offset: number) => {
    const target = index + offset;
    if (target < 0 || target >= locations.length) return;
    setLocations((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((location, locationIndex) => ({ ...location, order: locationIndex + 1 }));
    });
  };

  const validateStep = () => {
    if (activeStep === 0 && (!name.trim() || !type.trim())) {
      setError(t('pages.settings.congregation.createWizard.errors.congregation'));
      return false;
    }
    if (activeStep === 1 && selectedFeatures.length === 0) {
      setError(t('pages.settings.congregation.createWizard.errors.modules'));
      return false;
    }
    if (activeStep === 2 && (!locations.length || locations.some((location) => !location.name.trim()))) {
      setError(t('pages.settings.congregation.createWizard.errors.locations'));
      return false;
    }
    if (activeStep === 3 && !timezone.trim()) {
      setError(t('pages.settings.congregation.createWizard.errors.timezone'));
      return false;
    }
    if (activeStep === 4 && !selectedUserIds.length) {
      setError(t('pages.settings.congregation.createWizard.errors.users'));
      return false;
    }
    setError('');
    return true;
  };

  const next = () => {
    if (validateStep()) setActiveStep((step) => Math.min(step + 1, steps.length - 1));
  };

  const submit = () => {
    const values: CongregationCreateValues = {
      name: name.trim(),
      type: type.trim(),
      timezone: timezone.trim(),
      features: selectedFeatures,
      locations: locations.map((location, index) => ({
        order: index + 1,
        name: location.name.trim(),
        address: location.address.trim(),
      })),
      user_ids: selectedUserIds,
    };
    onSubmit(values);
  };

  return (
    <Dialog open={open} fullWidth maxWidth="md" fullScreen={fullScreen} onClose={submitting ? undefined : close}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        {t('pages.settings.congregation.createTitle')}
        <Tooltip title={t('form.field.close')}>
          <IconButton onClick={close} disabled={submitting} aria-label={t('form.field.close')}>
            <CloseRoundedIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <Box sx={{ px: { xs: 2, sm: 3 }, pb: 2 }}>
        <Typography variant="subtitle2" sx={{ display: { xs: 'block', sm: 'none' }, mb: 1 }}>
          {steps[activeStep]}
        </Typography>
        <Stepper
          activeStep={activeStep}
          alternativeLabel
          sx={{
            '& .MuiStepLabel-label': { display: { xs: 'none', sm: 'block' } },
            '& .MuiStep-root': { px: { xs: 0.5, sm: 1 } },
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <LinearProgress variant="determinate" value={((activeStep + 1) / steps.length) * 100} sx={{ mt: 2 }} />
      </Box>

      <DialogContent dividers sx={{ minHeight: { xs: 320, sm: 430 } }}>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        {activeStep === 0 ? (
          <Stack spacing={2}>
            <Typography variant="h6">{t('pages.settings.congregation.createWizard.headings.congregation')}</Typography>
            <TextField
              autoFocus
              required
              fullWidth
              label={t('form.field.name')}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Autocomplete
              disableClearable
              freeSolo
              options={t('setup.form.types').split(',')}
              inputValue={type}
              onInputChange={(_event, value) => setType(value)}
              onChange={(_event, value) => setType(value)}
              renderInput={(params) => <TextField {...params} required label={t('form.field.type')} />}
            />
          </Stack>
        ) : activeStep === 1 ? (
          <CongregationModulesSelector
            features={features}
            selected={selectedFeatures}
            congregationType={type}
            onChange={setSelectedFeatures}
          />
        ) : activeStep === 2 ? (
          <Stack spacing={2}>
            <Typography variant="h6">{t('setup.form.locations')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('setup.form.locationsText', { type })}
            </Typography>
            <List disablePadding>
              {locations.map((location, index) => (
                <ListItem
                  key={`${index}-${location.order}`}
                  divider
                  disableGutters
                  sx={{ alignItems: 'flex-start', gap: 1, py: 1.5 }}
                >
                  <Stack>
                    <IconButton
                      size="small"
                      disabled={index === 0}
                      aria-label={t('form.common.moveUp')}
                      onClick={() => moveLocation(index, -1)}
                    >
                      <ArrowUpwardRoundedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      disabled={index === locations.length - 1}
                      aria-label={t('form.common.moveDown')}
                      onClick={() => moveLocation(index, 1)}
                    >
                      <ArrowDownwardRoundedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  <Stack spacing={1} sx={{ flex: 1 }}>
                    <TextField
                      required
                      fullWidth
                      size="small"
                      label={t('form.field.name')}
                      value={location.name}
                      onChange={(event) =>
                        setLocations((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, name: event.target.value } : item,
                          ),
                        )
                      }
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label={t('form.field.address')}
                      value={location.address}
                      onChange={(event) =>
                        setLocations((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, address: event.target.value } : item,
                          ),
                        )
                      }
                    />
                  </Stack>
                  <IconButton
                    color="error"
                    disabled={locations.length === 1}
                    aria-label={t('form.common.delete')}
                    onClick={() =>
                      setLocations((current) =>
                        current
                          .filter((_item, itemIndex) => itemIndex !== index)
                          .map((item, itemIndex) => ({ ...item, order: itemIndex + 1 })),
                      )
                    }
                  >
                    <DeleteOutlineRoundedIcon />
                  </IconButton>
                </ListItem>
              ))}
            </List>
            <Button
              variant="outlined"
              startIcon={<AddRoundedIcon />}
              onClick={() =>
                setLocations((current) => [...current, { order: current.length + 1, name: '', address: '' }])
              }
            >
              {t('form.field.add')}
            </Button>
          </Stack>
        ) : activeStep === 3 ? (
          <Stack spacing={2}>
            <Typography variant="h6">{t('setup.form.timezoneStep')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('setup.form.timezoneSubtitle')}
            </Typography>
            <Autocomplete
              disableClearable
              freeSolo
              options={supportedTimeZones}
              inputValue={timezone}
              onInputChange={(_event, value) => setTimezone(value)}
              onChange={(_event, value) => setTimezone(value)}
              filterOptions={(options, params) => {
                const filtered = filterOptions(options, params);
                if (
                  params.inputValue &&
                  !options.some((option) => option.toLowerCase() === params.inputValue.toLowerCase())
                )
                  filtered.push(params.inputValue);
                return filtered;
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  label={t('form.field.timezone')}
                  helperText={t('setup.form.timezoneText')}
                />
              )}
            />
          </Stack>
        ) : activeStep === 4 ? (
          <Stack spacing={2}>
            <Box>
              <Typography variant="h6">{t('pages.settings.congregation.createWizard.headings.users')}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t('pages.settings.congregation.createWizard.usersDescription')}
              </Typography>
            </Box>
            <TextField
              fullWidth
              label={t('pages.settings.congregation.createWizard.searchUsers')}
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
            />
            <List disablePadding sx={{ maxHeight: 340, overflow: 'auto', border: 1, borderColor: 'divider' }}>
              <ListItem disablePadding divider>
                <ListItemButton
                  disabled={loadingUsers}
                  onClick={() => {
                    const selectableIds = users.map(({ id }) => id);
                    const allSelected = selectableIds.every((id) => selectedUserIds.includes(id));
                    setSelectedUserIds(allSelected ? [currentUserId] : selectableIds);
                  }}
                >
                  <Checkbox
                    edge="start"
                    checked={users.length > 0 && users.every(({ id }) => selectedUserIds.includes(id))}
                    tabIndex={-1}
                    disableRipple
                  />
                  <ListItemText primary={t('form.field.selectAll')} />
                </ListItemButton>
              </ListItem>
              {visibleUsers.map((user) => {
                const roles = sortRoles(user);
                const selected = selectedUserIds.includes(user.id);
                const isCurrent = user.id === currentUserId;
                return (
                  <ListItem key={user.id} disablePadding divider>
                    <ListItemButton
                      selected={selected}
                      onClick={() => {
                        if (isCurrent) return;
                        setSelectedUserIds((current) =>
                          current.includes(user.id) ? current.filter((id) => id !== user.id) : [...current, user.id],
                        );
                      }}
                    >
                      <Checkbox edge="start" checked={selected} disabled={isCurrent} tabIndex={-1} disableRipple />
                      <ListItemText primary={user.name} secondary={user.username} sx={{ minWidth: 140 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, flexWrap: 'wrap' }}>
                        {roles.length ? (
                          roles.map((role) => (
                            <Chip
                              key={role.id}
                              size="small"
                              color={role.full_access ? 'success' : 'default'}
                              label={
                                role.full_access
                                  ? t('pages.settings.congregation.createWizard.fullAccessRole', { role: role.name })
                                  : role.name
                              }
                            />
                          ))
                        ) : (
                          <Chip size="small" label={t('pages.settings.congregation.createWizard.noRoles')} />
                        )}
                      </Box>
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
            {loadingUsers ? <LinearProgress /> : null}
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Typography variant="h6">{t('setup.confirm.review')}</Typography>
            <Divider />
            <Box>
              <Typography fontWeight={600}>
                {t('pages.settings.congregation.createWizard.steps.congregation')}
              </Typography>
              <Typography variant="body2">
                {name} · {type} · {timezone}
              </Typography>
            </Box>
            <Box>
              <Typography fontWeight={600}>{t('pages.settings.congregation.createWizard.steps.modules')}</Typography>
              <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                {selectedFeatures.map((featureId) => (
                  <Chip
                    key={featureId}
                    size="small"
                    label={features.find(({ id }) => id === featureId)?.title ?? featureId}
                  />
                ))}
              </Stack>
            </Box>
            <Box>
              <Typography fontWeight={600}>{t('pages.settings.congregation.createWizard.steps.locations')}</Typography>
              {locations.map((location) => (
                <Typography key={location.order} variant="body2">
                  {location.order}. {location.name}
                  {location.address ? ` · ${location.address}` : ''}
                </Typography>
              ))}
            </Box>
            <Box>
              <Typography fontWeight={600}>{t('pages.settings.congregation.createWizard.steps.users')}</Typography>
              {selectedUsers.map((user) => (
                <Typography key={user.id} variant="body2">
                  {user.name} ·{' '}
                  {sortRoles(user)
                    .map(({ name: roleName }) => roleName)
                    .join(', ') || t('pages.settings.congregation.createWizard.noRoles')}
                </Typography>
              ))}
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={close} disabled={submitting}>
          {t('form.field.cancel')}
        </Button>
        {activeStep > 0 ? (
          <Button
            onClick={() => {
              setError('');
              setActiveStep((step) => step - 1);
            }}
            disabled={submitting}
          >
            {t('form.field.back')}
          </Button>
        ) : null}
        <Button
          variant="contained"
          onClick={activeStep === steps.length - 1 ? submit : next}
          disabled={submitting || loadingUsers}
        >
          {activeStep === steps.length - 1 ? t('pages.settings.congregation.createAction') : t('form.field.next')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
