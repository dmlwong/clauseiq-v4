import React from 'react';
import { type FieldNamingProps } from './naming';
export interface BaseCurrencyInputProps {
    message?: string;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    currency?: string;
    required?: boolean;
    disabled?: boolean;
    invalid?: boolean;
    previewState?: 'hover' | 'focus';
}
export type CurrencyInputProps = BaseCurrencyInputProps & FieldNamingProps;
export declare const CurrencyInput: React.FC<CurrencyInputProps>;
