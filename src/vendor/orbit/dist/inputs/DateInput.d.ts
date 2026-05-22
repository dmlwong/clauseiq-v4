import React from 'react';
import { type StandaloneFieldNamingProps } from './naming';
export interface BaseDateInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    invalid?: boolean;
    previewState?: 'hover' | 'focus';
}
export type DateInputProps = BaseDateInputProps & StandaloneFieldNamingProps;
export declare const DateInput: React.FC<DateInputProps>;
