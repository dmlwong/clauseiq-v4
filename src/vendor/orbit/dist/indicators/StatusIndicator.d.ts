import React from 'react';
export interface StatusIndicatorProps {
    status: 'Success' | 'Warning' | 'Information' | 'Error' | 'No Status';
    size?: 'Small' | 'Default';
    label?: string;
    ariaLabel?: string;
}
export declare const StatusIndicator: React.FC<StatusIndicatorProps>;
