import React from 'react';
export interface AlertProps {
    type: 'Information' | 'Success' | 'Error' | 'Warning' | 'No Status';
    title: string;
    description?: string;
    onDismiss?: () => void;
}
export declare const Alert: React.FC<AlertProps>;
