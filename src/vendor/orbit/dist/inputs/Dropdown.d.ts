import React from 'react';
import { type FieldNamingProps } from './naming';
export interface DropdownOption {
    label: string;
    value: string;
}
export interface BaseDropdownProps {
    message?: string;
    placeholder?: string;
    options: DropdownOption[];
    value?: string;
    onChange: (value: string) => void;
    required?: boolean;
    disabled?: boolean;
    invalid?: boolean;
    previewState?: 'hover' | 'focus';
}
export type DropdownProps = BaseDropdownProps & FieldNamingProps;
export declare const Dropdown: React.FC<DropdownProps>;
