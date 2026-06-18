import React from 'react';
export type ToggleCardStatus = 'Default' | 'Hover' | 'Selected' | 'Disabled';
export interface ToggleCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    status?: ToggleCardStatus;
}
export declare const ToggleCard: React.ForwardRefExoticComponent<ToggleCardProps & React.RefAttributes<HTMLButtonElement>>;
