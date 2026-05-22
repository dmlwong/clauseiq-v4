import React from 'react';
export interface ToggleProps {
    checked: boolean;
    state?: 'Active' | 'Disabled';
    alignment?: 'Left' | 'Right';
    label?: string;
    ariaLabel?: string;
    onChange: (checked: boolean) => void;
}
export declare const Toggle: React.FC<ToggleProps>;
