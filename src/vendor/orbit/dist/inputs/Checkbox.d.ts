import React from 'react';
export interface CheckboxProps {
    checked: boolean;
    state?: 'Active' | 'Hover' | 'Disabled';
    alignment?: 'Left' | 'Right';
    label?: string;
    ariaLabel?: string;
    onChange: (checked: boolean) => void;
}
export declare const Checkbox: React.FC<CheckboxProps>;
