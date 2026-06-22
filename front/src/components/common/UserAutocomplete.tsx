import { useAuth } from '@hooks/useAuth';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { UsersService } from '@services/users';
import { httpRequest } from '@utils/http';
import { useCallback, useEffect, useState } from 'react';
import type { User } from '@/types/user.types';
import type { UserAutocompleteProps } from './UserAutocomplete.types';

export const UserAutocomplete = ({ value, disabled, label, onChange }: UserAutocompleteProps) => {
  const { user } = useAuth();
  const pageSize = user?.preferences?.page_sizes?.['users-list'] ?? user?.preferences?.page_sizes?.default ?? 50;
  const [options, setOptions] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (nextPage: number, replace: boolean) => {
      setLoading(true);
      try {
        const response = await httpRequest<{ result: User[]; total: number }>({
          service: UsersService.list,
          data: {
            page: nextPage,
            size: pageSize,
            order: 'name',
            direction: 'ASC',
            ...(search.trim() ? { search: search.trim() } : {}),
          },
        });
        setOptions((current) =>
          replace
            ? response.result
            : Array.from(new Map([...current, ...response.result].map((item) => [item.username, item])).values()),
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
      getOptionLabel={(option) => `${option.name} · ${option.username}`}
      isOptionEqualToValue={(left, right) => left.username === right.username}
      onChange={(_event, nextUser) => onChange(nextUser)}
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
