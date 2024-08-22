import React, { useState, useMemo } from "react";
import TablePagination from "@mui/material/TablePagination";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { createTheme, ThemeProvider, useTheme } from "@mui/material/styles";
import * as locales from "@mui/material/locale";

export default function TableWithPagination({ listings }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [sortConfig, setSortConfig] = useState({
    key: "nombre",
    direction: "asc",
  });
  const [filterText, setFilterText] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const theme = useTheme();
  const themeWithLocale = useMemo(
    () => createTheme(theme, locales["esES"]),
    [theme]
  );

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredRows = useMemo(() => {
    let sortedListings = [...listings];

    if (sortConfig.key) {
      sortedListings.sort((a, b) => {
        const aValue = a.data[sortConfig.key].toLowerCase();
        const bValue = b.data[sortConfig.key].toLowerCase();
        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    if (filterText) {
      sortedListings = sortedListings.filter((listing) =>
        listing.data.nombre.toLowerCase().includes(filterText.toLowerCase())
      );
    }

    if (filterStatus) {
      sortedListings = sortedListings.filter(
        (listing) => listing.data.estado === filterStatus
      );
    }

    return sortedListings;
  }, [listings, sortConfig, filterText, filterStatus]);

  const emptyRows =
    page > 0
      ? Math.max(0, (1 + page) * rowsPerPage - sortedAndFilteredRows.length)
      : 0;

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />;
    }
    return <FaSort />;
  };

  return (
    <ThemeProvider theme={themeWithLocale}>
      <div className="max-w-full overflow-x-auto">
        <div className="flex justify-between p-4">
          <input
            type="text"
            placeholder="Filtrar por Nombre"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="rounded border p-2 text-sm"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded border p-2 text-sm"
          >
            <option value="">Todos los Estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_proceso">En Proceso</option>
            <option value="concretado">Concretado</option>
          </select>
        </div>
        <table className="min-w-full border-collapse bg-white">
          <thead>
            <tr>
              <th
                className="cursor-pointer border-b px-6 py-4 text-left text-sm font-semibold text-gray-900"
                onClick={() => handleSort("nombre")}
              >
                Nombre {getSortIcon("nombre")}
              </th>
              <th
                className="cursor-pointer border-b px-6 py-4 text-left text-sm font-semibold text-gray-900"
                onClick={() => handleSort("descripcion")}
              >
                Descripción {getSortIcon("descripcion")}
              </th>
              <th
                className="cursor-pointer border-b px-6 py-4 text-left text-sm font-semibold text-gray-900"
                onClick={() => handleSort("estado")}
              >
                Estado {getSortIcon("estado")}
              </th>
            </tr>
          </thead>
          <tbody>
            {(rowsPerPage > 0
              ? sortedAndFilteredRows.slice(
                  page * rowsPerPage,
                  page * rowsPerPage + rowsPerPage
                )
              : sortedAndFilteredRows
            ).map((listing) => (
              <tr key={listing.id} className="even:bg-gray-100">
                <td className="border-b px-6 py-4 text-sm text-gray-700">
                  {listing.data.nombre}
                </td>
                <td className="border-b px-6 py-4 text-sm text-gray-700">
                  {listing.data.descripcion}
                </td>
                <td className="border-b px-6 py-4 text-sm text-gray-700">
                  {listing.data.estado}
                </td>
              </tr>
            ))}
            {emptyRows > 0 && (
              <tr style={{ height: 41 * emptyRows }}>
                <td colSpan={3} className="border-b px-6 py-4" />
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}>
                <TablePagination
                  component="div"
                  count={sortedAndFilteredRows.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25, { label: "Todo", value: -1 }]}
                  showFirstButton
                  showLastButton
                  labelRowsPerPage="Filas por página"
                  labelDisplayedRows={({ from, to, count }) =>
                    `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                  }
                  className="flex items-center justify-between px-6 py-4"
                  SelectProps={{
                    native: true,
                  }}
                  classes={{
                    toolbar: "flex items-center justify-between",
                    selectLabel: "mr-2",
                    displayedRows: "ml-auto",
                    spacer: "hidden",
                  }}
                />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </ThemeProvider>
  );
}
