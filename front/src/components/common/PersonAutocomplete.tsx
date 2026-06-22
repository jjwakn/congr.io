import { useAuth } from '@hooks/useAuth';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { PersonsService } from '@services/persons';
import { httpRequest } from '@utils/http';
import { useCallback, useEffect, useState } from 'react';
import type { Person } from '@/types/person.types';
import type { PersonAutocompleteProps } from './PersonAutocomplete.types';

export const PersonAutocomplete = ({ value, disabled, label, onChange }: PersonAutocompleteProps) => {
  const { user } = useAuth();
  const pageSize = user?.preferences?.page_sizes?.['members-list'] ?? user?.preferences?.page_sizes?.default ?? 50;
  const [options, setOptions] = useState<Person[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const load = useCallback(
    async (nextPage: number, replace: boolean) => {
      setLoading(true);
      try {
        const response = await httpRequest<{ result: Person[]; total: number }>({
          service: PersonsService.list,
          data: {
            page: nextPage,
            size: pageSize,
            order: 'last_name',
            direction: 'ASC',
            ...(search.trim() ? { search: search.trim() } : {}),
          },
        });
        setOptions((current) =>
          replace
            ? response.result
            : Array.from(new Map([...current, ...response.result].map((person) => [person.id, person])).values()),
        );
        setTotal(response.total);
        setPage(nextPage);
      } finally {
        setLoading(false);
      }
    },
    [pageSize, search],
  );
  useEffect(() => {
    const timer = window.setTimeout(() => void load(0, true), 250);
    return () => window.clearTimeout(timer);
  }, [load]);
  return (
    <Autocomplete
      fullWidth
      disabled={disabled}
      options={options}
      value={value}
      loading={loading}
      filterOptions={(items) => items}
      getOptionLabel={(person) => `${person.code} · ${person.first_name} ${person.last_name}`}
      isOptionEqualToValue={(left, right) => left.id === right.id}
      onChange={(_event, person) => onChange(person)}
      onInputChange={(_event, input, reason) => {
        if (reason === 'input') setSearch(input);
      }}
      ListboxProps={{
        onScroll: (event) => {
          const element = event.currentTarget;
          if (
            !loading &&
            options.length < total &&
            element.scrollTop + element.clientHeight >= element.scrollHeight - 24
          )
            void load(page + 1, false);
        },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress size={18} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};
