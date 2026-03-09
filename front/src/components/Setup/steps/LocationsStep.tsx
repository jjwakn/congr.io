import { FormContainer } from '@components/common/FormContainer';
import { useSetup } from '@hooks/useSetup';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Box, Button, IconButton, List, ListItem, TextField, Typography } from '@mui/material';
import { useCallback } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { SetupData } from '@/types/setup.types';

export const LocationsStep = ({
  goNext,
  goBack,
  loading,
}: {
  goNext: () => void;
  goBack: () => void;
  loading?: boolean;
}) => {
  const { t } = useTranslation();
  const { setupData, setSetupData } = useSetup();

  const form = useForm<SetupData['locations']>({
    defaultValues: {
      locations:
        setupData.locations.locations.length > 0
          ? setupData.locations.locations
          : [
              {
                order: 1,
                name: t('setup.form.locationDefault'),
                address: '',
              },
            ],
    },
  });

  const { fields, append, move } = useFieldArray({
    control: form.control,
    name: 'locations',
  });

  const handleAdd = useCallback(() => {
    const newOrder = fields.length + 1;
    append({
      order: newOrder,
      name: '',
      address: '',
    });
  }, [append, fields.length]);

  const handleRemove = useCallback(
    (index: number) => {
      if (index === 0 && fields.length === 1) return;

      // Get current locations before removal
      const currentLocations = form.getValues('locations');

      // Remove the item at the specified index
      const updatedLocations = currentLocations
        .filter((_, i) => i !== index)
        .map((location, i) => ({
          ...location,
          order: i + 1,
        }));

      // Update the form with the new locations array
      form.setValue('locations', updatedLocations);
    },
    [fields.length, form],
  );

  const moveLocation = useCallback(
    (index: number, direction: 'up' | 'down') => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;

      // Check bounds
      if (targetIndex < 0 || targetIndex >= fields.length) return;

      // Move the item
      move(index, targetIndex);

      // Update order values
      const currentLocations = form.getValues('locations');
      const updatedLocations = currentLocations.map((location, i) => ({
        ...location,
        order: i + 1,
      }));

      form.setValue('locations', updatedLocations);
    },
    [fields.length, move, form],
  );

  const handleNext = useCallback(
    ({ locations }: SetupData['locations']) => {
      if (locations.some((location) => !location.name.trim())) return;

      setSetupData((prev) => ({
        ...prev,
        locations: {
          locations: locations.map((l) => ({
            ...l,
            name: l.name.trim(),
            address: l.address.trim(),
          })),
        },
      }));
      goNext();
    },
    [goNext, setSetupData],
  );

  return (
    <FormContainer
      form={form}
      onSubmit={handleNext}
      title={t('setup.form.locations')}
      subtitle={t('setup.form.locationsText', {
        type: setupData.congregation.type,
      })}
      submitText={t('form.field.next')}
      loading={loading}
      onCancel={goBack}
      cancelText={t('form.field.back')}
    >
      <List dense>
        {fields.map((field, index) => (
          <ListItem
            key={field.id}
            divider
            secondaryAction={
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <IconButton
                  size="small"
                  aria-label={t('form.common.delete')}
                  onClick={() => handleRemove(index)}
                  disabled={index === 0 && fields.length === 1}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            }
          >
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                flexDirection: 'row',
                gap: 1,
              }}
            >
              <Box sx={{ display: 'flex' }}>
                <Typography variant="body2" sx={{ minWidth: '20px', fontWeight: 'bold', mt: 1.5 }}>
                  {field.order}.
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <IconButton
                    size="small"
                    aria-label={t('form.common.moveUp')}
                    onClick={() => moveLocation(index, 'up')}
                    disabled={index === 0}
                    sx={{ padding: 0 }}
                  >
                    <KeyboardArrowUpIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label={t('form.common.moveDown')}
                    onClick={() => moveLocation(index, 'down')}
                    disabled={index === fields.length - 1}
                    sx={{ padding: 0 }}
                  >
                    <KeyboardArrowDownIcon />
                  </IconButton>
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  flexDirection: 'column',
                  flexGrow: 1,
                }}
              >
                <TextField
                  fullWidth
                  size="small"
                  placeholder={t('form.field.name')}
                  {...form.register(`locations.${index}.name`, {
                    required: `${t('form.field.name')} ${t('form.error.isRequired')}`,
                  })}
                  variant="outlined"
                  error={!!form.formState.errors.locations?.[index]?.name}
                  helperText={form.formState.errors.locations?.[index]?.name?.message}
                />

                <TextField
                  fullWidth
                  size="small"
                  placeholder={t('form.field.address')}
                  {...form.register(`locations.${index}.address`)}
                  variant="outlined"
                  multiline
                  rows={2}
                  error={!!form.formState.errors.locations?.[index]?.address}
                  helperText={form.formState.errors.locations?.[index]?.address?.message}
                />
              </Box>
            </Box>
          </ListItem>
        ))}

        <ListItem>
          <Button fullWidth variant="outlined" startIcon={<AddIcon />} onClick={handleAdd} sx={{ mt: 1 }}>
            {t('form.field.add')}
          </Button>
        </ListItem>
      </List>
    </FormContainer>
  );
};

export default LocationsStep;
