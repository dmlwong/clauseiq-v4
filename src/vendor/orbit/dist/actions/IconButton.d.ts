import React from 'react';
export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'disabled' | 'aria-label'> {
    variant?: 'Primary' | 'Secondary' | 'Tertiary' | 'Positive' | 'Destructive';
    size?: 'Small' | 'Medium' | 'Large';
    state?: 'Default' | 'Hover' | 'Disabled';
    icon: React.ReactNode;
    ariaLabel: string;
    disabled?: boolean;
}
export declare const IconButton: React.ForwardRefExoticComponent<IconButtonProps & React.RefAttributes<HTMLButtonElement>>;
