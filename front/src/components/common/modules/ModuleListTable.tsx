import {
  Box,
  CircularProgress,
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
  Typography,
  useTheme,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
    : {};

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
  fixedStartColumnIds = [],
  fixedEndColumnIds = DEFAULT_FIXED_END_COLUMN_IDS,
}: ModuleListTableProps<RowType>) => {
  const theme = useTheme();
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

  const columnMap = useMemo(() => new Map(columns.map((column) => [column.id, column])), [columns]);

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
    <Paper variant="outlined">
      <TableContainer ref={tableContainerRef}>
        <Table size="small">
          <TableHead>
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
                    {cell.sortKey ? (
                      <TableSortLabel
                        active={sort === cell.sortKey}
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
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>

          <TableBody>
            {loading ? (
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
      </TableContainer>

      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(_event, nextPage) => onPageChange(nextPage)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(event) => onPageSizeChange(Number(event.target.value))}
        labelRowsPerPage={rowsPerPageLabel}
        rowsPerPageOptions={[10, 25, 50, 100]}
      />
    </Paper>
  );
};
