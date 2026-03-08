import {
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';
import type { ModuleListTableProps } from './ModuleListTable.types';

export const ModuleListTable = <RowType,>({
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
}: ModuleListTableProps<RowType>) => {
  return (
    <Paper variant="outlined">
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.id} align={column.align}>
                  {column.sortKey ? (
                    <TableSortLabel
                      active={sort === column.sortKey}
                      direction={sort === column.sortKey ? (direction.toLowerCase() === 'desc' ? 'desc' : 'asc') : 'asc'}
                      onClick={() => onSort(column.sortKey as string)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
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
                    <TableCell key={`${getRowId(row)}-${column.id}`} align={column.align}>
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
