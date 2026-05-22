import React from 'react';
import { type FieldNamingProps } from './naming';
export interface BaseTextAreaProps {
    message?: string;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    maxLength?: number;
    required?: boolean;
    disabled?: boolean;
    invalid?: boolean;
    previewState?: 'hover' | 'focus';
    rows?: number;
}
export type TextAreaProps = BaseTextAreaProps & FieldNamingProps;
export declare const TextArea: React.FC<TextAreaProps>;
