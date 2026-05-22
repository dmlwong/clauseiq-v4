import React from 'react';
export interface TableColumn<T> {
    id: string;
    header: React.ReactNode;
    render: (row: T) => React.ReactNode;
    width?: string;
    sortable?: boolean;
    sortDirection?: 'asc' | 'desc';
    info?: string;
    onSortChange?: (direction: 'asc' | 'desc') => void;
}
export interface TablePaginationProps {
    pageSize: number;
    page: number;
    totalRows: number;
    onPageChange: (page: number) => void;
}
export interface TableProps<T> {
    columns: TableColumn<T>[];
    rows: T[];
    getRowKey: (row: T) => React.Key;
    ariaLabel?: string;
    ariaLabelledBy?: string;
    density?: 'Default' | 'Compact';
    variant?: 'Default' | 'SeparatedRows';
    emptyState?: React.ReactNode;
    onRowSelect?: (row: T) => void;
    getRowSelectionLabel?: (row: T, index: number) => string;
    pagination?: TablePaginationProps;
}
export declare function Table<T>({ columns, rows, getRowKey, ariaLabel, ariaLabelledBy, density, variant, emptyState, onRowSelect, getRowSelectionLabel, pagination, }: TableProps<T>): import("react/jsx-runtime").JSX.Element;
