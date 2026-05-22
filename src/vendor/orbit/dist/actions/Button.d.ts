import React from 'react';
export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
    variant?: 'Primary' | 'Secondary' | 'Tertiary' | 'Positive' | 'Destructive';
    size?: 'Small' | 'Medium';
    state?: 'Default' | 'Hover' | 'Disabled';
    children: React.ReactNode;
    icon?: React.ReactNode;
    iconRight?: React.ReactNode;
    disabled?: boolean;
}
export declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;
