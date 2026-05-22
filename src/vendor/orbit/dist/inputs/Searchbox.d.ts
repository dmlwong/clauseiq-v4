import React from 'react';
import { type StandaloneFieldNamingProps } from './naming';
export interface BaseSearchboxProps {
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    invalid?: boolean;
    previewState?: 'hover' | 'focus';
}
export type SearchboxProps = BaseSearchboxProps & StandaloneFieldNamingProps;
export declare const Searchbox: React.FC<SearchboxProps>;
