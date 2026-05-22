import React from 'react';
export interface RadioProps {
    checked: boolean;
    state?: 'Active' | 'Hover' | 'Disabled' | 'Error';
    alignment?: 'Left' | 'Right';
    label?: string;
    ariaLabel?: string;
    name?: string;
    value: string;
    onChange: (value: string) => void;
    onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
}
export declare const Radio: React.FC<RadioProps>;
export interface RadioGroupProps {
    value: string;
    name: string;
    ariaLabel?: string;
    onChange: (value: string) => void;
    children: React.ReactNode;
}
export declare const RadioGroup: React.FC<RadioGroupProps>;
