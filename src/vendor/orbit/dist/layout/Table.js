'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import clsx from 'clsx';
import styles from './Table.module.css';
import { Tooltip } from '../feedback/Tooltip';
import { FaIcon, FA } from '../primitives/FaIcon';
export function Table(_a) {
    var columns = _a.columns, rows = _a.rows, getRowKey = _a.getRowKey, ariaLabel = _a.ariaLabel, ariaLabelledBy = _a.ariaLabelledBy, _b = _a.density, density = _b === void 0 ? 'Default' : _b, _c = _a.variant, variant = _c === void 0 ? 'Default' : _c, _d = _a.emptyState, emptyState = _d === void 0 ? 'No rows available.' : _d, onRowSelect = _a.onRowSelect, getRowSelectionLabel = _a.getRowSelectionLabel, pagination = _a.pagination;
    var isSelectable = Boolean(onRowSelect);
    return (_jsxs("div", { className: clsx(styles.tableWrap, variant === 'SeparatedRows' && styles.separatedWrap), children: [_jsxs("table", { className: clsx(styles.table, density === 'Compact' && styles.compact, variant === 'SeparatedRows' && styles.separatedTable), "aria-label": ariaLabelledBy ? undefined : ariaLabel, "aria-labelledby": ariaLabelledBy, children: [_jsx("thead", { children: _jsx("tr", { children: columns.map(function (column) { return (_jsx("th", { scope: "col", style: column.width ? { width: column.width } : undefined, children: _jsx(TableHeader, { column: column }) }, column.id)); }) }) }), _jsxs("tbody", { children: [rows.map(function (row, rowIndex) { return (_jsx("tr", { className: isSelectable ? styles.selectableRow : undefined, children: columns.map(function (column, columnIndex) {
                                    var _a;
                                    return (_jsx("td", { children: isSelectable && columnIndex === 0 ? (_jsx("button", { type: "button", className: styles.rowAction, "aria-label": (_a = getRowSelectionLabel === null || getRowSelectionLabel === void 0 ? void 0 : getRowSelectionLabel(row, rowIndex)) !== null && _a !== void 0 ? _a : 'Select row', onClick: function () { return onRowSelect === null || onRowSelect === void 0 ? void 0 : onRowSelect(row); }, children: column.render(row) })) : (column.render(row)) }, column.id));
                                }) }, getRowKey(row))); }), rows.length === 0 && (_jsx("tr", { children: _jsx("td", { className: styles.emptyCell, colSpan: columns.length, children: emptyState }) }))] })] }), pagination && _jsx(TablePagination, { pagination: pagination })] }));
}
function TableHeader(_a) {
    var column = _a.column;
    var sortIcon = column.sortDirection === 'asc'
        ? FA.sortUp
        : column.sortDirection === 'desc'
            ? FA.sortDown
            : FA.arrowUpDown;
    var headerLabel = typeof column.header === 'string' ? column.header : column.id;
    var nextDirection = column.sortDirection === 'asc' ? 'desc' : 'asc';
    return (_jsxs("div", { className: styles.headerContent, children: [column.sortable ? (_jsxs("button", { type: "button", className: styles.sortButton, onClick: function () { var _a; return (_a = column.onSortChange) === null || _a === void 0 ? void 0 : _a.call(column, nextDirection); }, disabled: !column.onSortChange, "aria-label": "Sort ".concat(headerLabel, " ").concat(nextDirection), children: [_jsx("span", { children: column.header }), _jsx(FaIcon, { icon: sortIcon, size: 12, color: "currentColor" })] })) : (_jsx("span", { children: column.header })), column.info && (_jsx(Tooltip, { content: column.info, children: _jsx("span", { className: styles.infoIcon, tabIndex: 0, "aria-label": "".concat(headerLabel, " information"), role: "img", children: _jsx(FaIcon, { icon: FA.circleQuestion, size: 12, color: "currentColor" }) }) }))] }));
}
function TablePagination(_a) {
    var pagination = _a.pagination;
    var pageSize = Math.max(pagination.pageSize, 1);
    var totalPages = Math.max(Math.ceil(pagination.totalRows / pageSize), 1);
    var currentPage = Math.min(Math.max(pagination.page, 1), totalPages);
    var start = pagination.totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    var end = Math.min(currentPage * pageSize, pagination.totalRows);
    var pages = Array.from({ length: totalPages }, function (_, index) { return index + 1; });
    return (_jsxs("nav", { className: styles.pagination, "aria-label": "Table pagination", children: [_jsxs("span", { className: styles.pageRange, children: [_jsxs("strong", { children: [start, " to ", end] }), " of ", pagination.totalRows, " items"] }), _jsxs("div", { className: styles.pageControls, children: [_jsx("button", { type: "button", className: styles.pageButton, onClick: function () { return pagination.onPageChange(currentPage - 1); }, disabled: currentPage <= 1, "aria-label": "Previous page", children: _jsx(FaIcon, { icon: FA.angleUp, size: 12, color: "currentColor", style: { transform: 'rotate(-90deg)' } }) }), pages.map(function (page) { return (_jsx("button", { type: "button", className: clsx(styles.pageButton, page === currentPage && styles.pageButtonActive), onClick: function () { return pagination.onPageChange(page); }, "aria-current": page === currentPage ? 'page' : undefined, children: page }, page)); }), _jsx("button", { type: "button", className: styles.pageButton, onClick: function () { return pagination.onPageChange(currentPage + 1); }, disabled: currentPage >= totalPages, "aria-label": "Next page", children: _jsx(FaIcon, { icon: FA.angleDown, size: 12, color: "currentColor", style: { transform: 'rotate(-90deg)' } }) })] })] }));
}
