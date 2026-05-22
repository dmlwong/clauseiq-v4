import React from 'react';
import { type StandaloneFieldNamingProps } from './naming';
export interface BaseInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    icon?: React.ReactNode;
    style?: React.CSSProperties;
    id?: string;
    required?: boolean;
    disabled?: boolean;
    invalid?: boolean;
    previewState?: 'hover' | 'focus';
}
export type InputProps = BaseInputProps & StandaloneFieldNamingProps;
export declare const Input: React.FC<InputProps>;
