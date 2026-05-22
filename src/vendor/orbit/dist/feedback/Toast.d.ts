import React from 'react';
export interface ToastAction {
    label: string;
    onClick: () => void;
    variant?: 'Primary' | 'Secondary';
}
export interface ToastProps {
    type: 'Success' | 'Error' | 'Info' | 'Warning' | 'Mute' | 'NoStatus';
    message: string;
    visible: boolean;
    onDismiss?: () => void;
    actions?: ToastAction[];
}
export declare const Toast: React.FC<ToastProps>;
