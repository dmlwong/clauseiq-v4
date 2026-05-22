import React from 'react';
import { type FieldNamingProps } from './naming';
export interface MultiSelectDropdownOption {
    label: string;
    value: string;
}
export interface BaseMultiSelectDropdownProps {
    options: MultiSelectDropdownOption[];
    value: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    invalid?: boolean;
}
export type MultiSelectDropdownProps = BaseMultiSelectDropdownProps & FieldNamingProps;
export declare const MultiSelectDropdown: React.FC<MultiSelectDropdownProps>;
