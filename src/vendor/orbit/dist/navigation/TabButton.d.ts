import React from 'react';
export interface TabButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
    active?: boolean;
    status?: 'Rest' | 'Hover' | 'Disabled';
    showUnderline?: boolean;
    children: React.ReactNode;
    ariaControls?: string;
    disabled?: boolean;
}
export declare const TabButton: React.ForwardRefExoticComponent<TabButtonProps & React.RefAttributes<HTMLButtonElement>>;
