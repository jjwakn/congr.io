import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import {
  Box,
  CircularProgress,
  IconButton,
  Paper,
  type SxProps,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  type Theme,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ModuleColumnVisibilityDialog } from './ModuleColumnVisibilityDialog';
import type { ModuleListHeaderCell, ModuleListTableProps } from './ModuleListTable.types';

const DEFAULT_FIXED_END_COLUMN_IDS = ['actions'];

const areWidthMapsEqual = (left: Record<string, number>, right: Record<string, number>) => {
  const leftEntries = Object.entries(left);
  const rightEntries = Object.entries(right);

  if (leftEntries.length !== rightEntries.length) return false;

  return leftEntries.every(([key, value]) => right[key] === value);
};

const buildFixedOffsets = ({
  columnIds,
  fixedIds,
  columnWidths,
}: {
  columnIds: string[];
  fixedIds: string[];
  columnWidths: Record<string, number>;
}) =>
  columnIds.reduce<{ nextOffset: number; offsets: Record<string, number> }>(
    (state, columnId) =>
      fixedIds.includes(columnId)
        ? {
            nextOffset: state.nextOffset + (columnWidths[columnId] ?? 0),
            offsets: {
              ...state.offsets,
              [columnId]: state.nextOffset,
            },
          }
        : state,
    {
      nextOffset: 0,
      offsets: {},
    },
  ).offsets;

const toSxArray = (...values: Array<SxProps<Theme> | undefined>): SxProps<Theme> =>
  values.reduce<Array<Exclude<SxProps<Theme>, null | undefined | false>>>((accumulator, value) => {
    if (!value) return accumulator;

    if (Array.isArray(value)) {
      value.forEach((nestedValue) => {
        if (nestedValue) {
          accumulator.push(nestedValue);
        }
      });

      return accumulator;
    }

    accumulator.push(value);
    return accumulator;
  }, []) as SxProps<Theme>;

const getSortLabelSx = (align?: ModuleListHeaderCell['align']): SxProps<Theme> =>
  align === 'center'
    ? {
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        position: 'relative',
        pl: 2.5,
        pr: 2.5,
        '& .MuiTableSortLabel-icon': {
          position: 'absolute',
          right: 6,
          margin: 0,
        },
      }
    : {
        '& .MuiTableSortLabel-icon': {
          marginLeft: 0.75,
        },
      };

export const ModuleListTable = <RowType,>({
  headerRows,
  columns,
  rows,
  getRowId,
  loading,
  loadingLabel,
  emptyLabel,
  sort,
  direction,
  onSort,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  rowsPerPageLabel,
  columnVisibility,
  fixedStartColumnIds = [],
  fixedEndColumnIds = DEFAULT_FIXED_END_COLUMN_IDS,
}: ModuleListTableProps<RowType>) => {
  const theme = useTheme();
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [columnVisibilityOpen, setColumnVisibilityOpen] = useState(false);

  const columnMap = useMemo(() => new Map(columns.map((column) => [column.id, column])), [columns]);
  const rowsPerPageOptions = useMemo(
    () => Array.from(new Set([10, 25, 50, 100, pageSize])).sort((left, right) => left - right),
    [pageSize],
  );

  const fixedStartIds = useMemo(() => {
    const fixedIds = new Set(fixedStartColumnIds);
    return columns.map((column) => column.id).filter((columnId) => fixedIds.has(columnId));
  }, [columns, fixedStartColumnIds]);

  const fixedEndIds = useMemo(() => {
    const fixedIds = new Set(fixedEndColumnIds);
    return columns
      .map((column) => column.id)
      .filter((columnId) => fixedIds.has(columnId) && !fixedStartIds.includes(columnId));
  }, [columns, fixedEndColumnIds, fixedStartIds]);

  const lastFixedStartId = fixedStartIds[fixedStartIds.length - 1];
  const firstFixedEndId = fixedEndIds[0];

  const measureWidths = useCallback(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const nextWidths = columns.reduce<Record<string, number>>((accumulator, column) => {
      const cell = container.querySelector<HTMLElement>(`[data-column-id="${column.id}"]`);
      if (cell) {
        accumulator[column.id] = cell.getBoundingClientRect().width;
      }

      return accumulator;
    }, {});

    setColumnWidths((currentWidths) => (areWidthMapsEqual(currentWidths, nextWidths) ? currentWidths : nextWidths));
  }, [columns]);

  useEffect(() => {
    measureWidths();
  }, [headerRows, loading, measureWidths, rows]);

  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      measureWidths();
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [measureWidths]);

  const fixedStartOffsets = useMemo(
    () =>
      buildFixedOffsets({
        columnIds: columns.map((column) => column.id),
        fixedIds: fixedStartIds,
        columnWidths,
      }),
    [columnWidths, columns, fixedStartIds],
  );

  const fixedEndOffsets = useMemo(
    () =>
      buildFixedOffsets({
        columnIds: [...columns].reverse().map((column) => column.id),
        fixedIds: fixedEndIds,
        columnWidths,
      }),
    [columnWidths, columns, fixedEndIds],
  );

  const getStickyCellSx = useCallback(
    (columnId: string, variant: 'body' | 'header') => {
      if (columnId in fixedStartOffsets) {
        return {
          position: 'sticky' as const,
          left: fixedStartOffsets[columnId],
          zIndex: variant === 'header' ? 4 : 2,
          backgroundColor: theme.palette.background.paper,
          boxShadow: columnId === lastFixedStartId ? `inset -1px 0 0 ${theme.palette.divider}` : undefined,
        };
      }

      if (columnId in fixedEndOffsets) {
        return {
          position: 'sticky' as const,
          right: fixedEndOffsets[columnId],
          zIndex: variant === 'header' ? 4 : 2,
          backgroundColor: theme.palette.background.paper,
          boxShadow: columnId === firstFixedEndId ? `inset 1px 0 0 ${theme.palette.divider}` : undefined,
        };
      }

      return {};
    },
    [
      firstFixedEndId,
      fixedEndOffsets,
      fixedStartOffsets,
      lastFixedStartId,
      theme.palette.background.paper,
      theme.palette.divider,
    ],
  );

  const getColumnSizingSx = useCallback(
    (columnId: string) => {
      const column = columnMap.get(columnId);
      if (!column) return {};

      return {
        width: column.width,
        minWidth: column.minWidth,
      };
    },
    [columnMap],
  );

  return (
    <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
      <TableContainer ref={tableContainerRef} sx={{ flex: 1, minHeight: 0, overflow: 'auto', position: 'relative' }}>
        <Table size="small">
          <TableHead sx={{ position: 'sticky', top: 0, zIndex: 5, bgcolor: 'background.paper' }}>
            {headerRows.map((headerRow, rowIndex) => (
              <TableRow key={`header-row-${rowIndex}`}>
                {headerRow.map((cell) => (
                  <TableCell
                    key={cell.id}
                    align={cell.align}
                    colSpan={cell.colSpan}
                    rowSpan={cell.rowSpan}
                    data-column-id={cell.id}
                    sx={toSxArray(
                      {
                        whiteSpace: 'nowrap',
                      },
                      getColumnSizingSx(cell.id),
                      getStickyCellSx(cell.id, 'header'),
                      cell.sx,
                    )}
                  >
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        width: cell.align === 'center' ? '100%' : undefined,
                        justifyContent: cell.align === 'center' ? 'center' : undefined,
                      }}
                    >
                      {cell.sortKey ? (
                        <TableSortLabel
                          active={sort === cell.sortKey}
                          disabled={loading}
                          direction={
                            sort === cell.sortKey ? (direction.toLowerCase() === 'desc' ? 'desc' : 'asc') : 'asc'
                          }
                          sx={getSortLabelSx(cell.align)}
                          onClick={() => onSort(cell.sortKey as string)}
                        >
                          {cell.label}
                        </TableSortLabel>
                      ) : (
                        cell.label
                      )}
                      {cell.filter ? (
                        <Tooltip title={cell.filter.label}>
                          <span>
                            <IconButton
                              size="small"
                              color={cell.filter.active ? 'primary' : 'default'}
                              disabled={loading || cell.filter.disabled}
                              onClick={cell.filter.onClick}
                              aria-label={cell.filter.label}
                            >
                              <FilterListRoundedIcon fontSize="inherit" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      ) : null}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>

          <TableBody>
            {loading && !rows.length ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  <Box
                    sx={{
                      py: 2,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <CircularProgress size={18} />
                    <Typography variant="body2">{loadingLabel}</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : rows.length ? (
              rows.map((row) => (
                <TableRow key={getRowId(row)}>
                  {columns.map((column) => (
                    <TableCell
                      key={`${getRowId(row)}-${column.id}`}
                      align={column.align}
                      data-column-id={column.id}
                      sx={toSxArray(
                        getColumnSizingSx(column.id),
                        getStickyCellSx(column.id, 'body'),
                        column.cellSx,
                        column.getCellSx?.(row),
                      )}
                    >
                      {column.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  <Typography variant="body2" color="text.secondary">
                    {emptyLabel}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {loading && rows.length ? (
          <Box
            sx={{
              position: 'absolute',
              top: 42,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 6,
              bgcolor: (theme) => theme.palette.action.disabledBackground,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2">{loadingLabel}</Typography>
            </Box>
          </Box>
        ) : null}
      </TableContainer>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
          borderTop: 1,
          borderColor: 'divider',
          pointerEvents: loading ? 'none' : undefined,
          opacity: loading ? 0.55 : undefined,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0, pl: 1 }}>
          {columnVisibility ? (
            <Tooltip title={columnVisibility.label}>
              <span>
                <IconButton
                  size="small"
                  disabled={loading || columnVisibility.disabled}
                  aria-label={columnVisibility.label}
                  onClick={() => setColumnVisibilityOpen(true)}
                >
                  <FilterAltRoundedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          ) : null}
        </Box>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_event, nextPage) => onPageChange(nextPage)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(event) => onPageSizeChange(Number(event.target.value))}
          labelRowsPerPage=""
          rowsPerPageOptions={rowsPerPageOptions}
          getItemAriaLabel={(type) => `${rowsPerPageLabel} ${type}`}
          sx={{
            borderTop: 0,
            flexShrink: 0,
            '& .MuiTablePagination-toolbar': {
              pl: 0,
            },
          }}
        />
      </Box>

      {columnVisibility && columnVisibilityOpen ? (
        <ModuleColumnVisibilityDialog
          open={columnVisibilityOpen}
          title={columnVisibility.label}
          options={columnVisibility.options}
          visibleIds={columnVisibility.visibleIds}
          defaultVisibleIds={columnVisibility.defaultVisibleIds}
          onClose={() => setColumnVisibilityOpen(false)}
          onSave={(value) => {
            columnVisibility.onChange(value);
            setColumnVisibilityOpen(false);
          }}
        />
      ) : null}
    </Paper>
  );
};
