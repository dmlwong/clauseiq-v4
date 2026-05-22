import React from 'react';
export interface BadgeProps {
    label: string;
    status?: 'Green' | 'Red' | 'Gray' | 'Information' | 'Warning' | 'Success' | 'Error' | 'No Status';
    ariaLabel?: string;
}
export declare const Badge: React.FC<BadgeProps>;
