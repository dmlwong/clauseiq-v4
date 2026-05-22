import React from 'react';
export interface RadialIndicatorProps {
    status?: 'Success' | 'Information' | 'Error' | 'Warning' | 'No Status';
    progress?: number;
    size?: number;
    ariaLabel?: string;
}
export declare const RadialIndicator: React.FC<RadialIndicatorProps>;
