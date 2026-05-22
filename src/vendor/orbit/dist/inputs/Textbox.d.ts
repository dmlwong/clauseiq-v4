import React from 'react';
import { type FieldNamingProps } from './naming';
export interface BaseTextboxProps {
    message?: string;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    disabled?: boolean;
    invalid?: boolean;
    locked?: boolean;
    previewState?: 'hover' | 'focus';
}
export type TextboxProps = BaseTextboxProps & FieldNamingProps;
export declare const Textbox: React.FC<TextboxProps>;
