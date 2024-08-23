import React, { useState, useMemo } from "react";
import TablePagination from "@mui/material/TablePagination";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { createTheme, ThemeProvider, useTheme } from "@mui/material/styles";
import * as locales from "@mui/material/locale";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

export default function TableWithPagination({ listings, donations }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [sortConfig, setSortConfig] = useState({
    key: "nombre_articulo",
    direction: "asc",
  });
  const [filterText, setFilterText] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [tabIndex, setTabIndex] = useState(0);

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
    // Separate `concretado` items from listings
    const concretadoItems = [];
    const nonConcretadoItems = [];

    listings.forEach((listing) => {
      if (listing.listingItems) {
        listing.listingItems.forEach((item) => {
          if (item.data.estado === "concretado") {
            concretadoItems.push(item);
          } else {
            nonConcretadoItems.push(item);
          }
        });
      }
    });

    const data = tabIndex === 0 ? nonConcretadoItems : concretadoItems;

    let items = data;

    if (sortConfig.key) {
      items.sort((a, b) => {
        const aValue = String(a.data[sortConfig.key] || "").toLowerCase();
        const bValue = String(b.data[sortConfig.key] || "").toLowerCase();
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
      items = items.filter((item) =>
        item.data.nombre_articulo
          .toLowerCase()
          .includes(filterText.toLowerCase())
      );
    }

    if (filterStatus) {
      items = items.filter((item) => item.data.estado === filterStatus);
    }

    return items;
  }, [listings, donations, sortConfig, filterText, filterStatus, tabIndex]);

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

  const formatDate = (timestamp) => {
    if (!timestamp || typeof timestamp.seconds !== "number") return "N/A";

    // Convert Firestore timestamp to milliseconds
    const date = new Date(
      timestamp.seconds * 1000 + timestamp.nanoseconds / 1e6
    );

    // Format the date to DD/MM/YYYY in 'es-PY' locale
    return isNaN(date.getTime())
      ? "N/A"
      : date.toLocaleDateString("es-PY", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
  };

  const convertToCSV = (data) => {
    if (data.length === 0) return "";

    // Filter out columns that start with "id_"
    const headers = Object.keys(data[0]).filter(
      (header) => !header.startsWith("id_")
    );
    const csvRows = [];
    csvRows.push(headers.join(","));

    for (const row of data) {
      const values = headers.map((header) => {
        let value = row[header];
        if (header.startsWith("fecha") && value) {
          value = formatDate(value);
        }
        value = value !== null && value !== undefined ? value : "(vacio)";
        const escaped = ("" + value).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(","));
    }

    return csvRows.join("\n");
  };

  const handleExportCSV = () => {
    const csv = convertToCSV(sortedAndFilteredRows.map((row) => row.data));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "table_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
    setPage(0); // Reset pagination when switching tabs
  };

  return (
    <ThemeProvider theme={themeWithLocale}>
      <div
        className="max-w-full overflow-x-auto"
        style={{ backgroundColor: "white " }}
      >
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          style={{ backgroundColor: "white " }}
        >
          <Tab label="PEDIDOS" />
          <Tab label="DONACIONES" />
        </Tabs>
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
          </select>
        </div>
        <table className="min-w-full border-collapse bg-white">
          <thead>
            <tr>
              <th
                className="cursor-pointer border-b px-6 py-4 text-left text-sm font-semibold text-gray-900"
                onClick={() => handleSort("nombre_articulo")}
              >
                Nombre {getSortIcon("nombre_articulo")}
              </th>
              <th
                className="cursor-pointer border-b px-6 py-4 text-left text-sm font-semibold text-gray-900"
                onClick={() => handleSort("categoria")}
              >
                Categoría {getSortIcon("categoria")}
              </th>
              <th
                className="cursor-pointer border-b px-6 py-4 text-left text-sm font-semibold text-gray-900"
                onClick={() => handleSort("ingrediente")}
              >
                Ingrediente {getSortIcon("ingrediente")}
              </th>
              <th
                className="cursor-pointer border-b px-6 py-4 text-left text-sm font-semibold text-gray-900"
                onClick={() => handleSort("fecha_creacion")}
              >
                Fecha Creación {getSortIcon("fecha_creacion")}
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
            ).map((item) => (
              <tr key={item.id} className="even:bg-gray-100">
                <td className="border-b px-6 py-4 text-sm text-gray-700">
                  {item.data.nombre_articulo}
                </td>
                <td className="border-b px-6 py-4 text-sm text-gray-700">
                  {item.data.categoria}
                </td>
                <td className="border-b px-6 py-4 text-sm text-gray-700">
                  {item.data.ingrediente}
                </td>
                <td className="border-b px-6 py-4 text-sm text-gray-700">
                  {formatDate(item.data.fecha_creacion)}
                </td>
                <td className="border-b px-6 py-4 text-sm text-gray-700">
                  {item.data.estado}
                </td>
              </tr>
            ))}
            {emptyRows > 0 && (
              <tr style={{ height: 41 * emptyRows }}>
                <td colSpan={5} className="border-b px-6 py-4" />
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5}>
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
            <tr>
              <td colSpan={5} className="p-4 text-right">
                <button
                  onClick={handleExportCSV}
                  className="rounded bg-green-700 px-4 py-2 text-white"
                >
                  Exportar a CSV
                </button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </ThemeProvider>
  );
}
