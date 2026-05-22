import React from 'react';
export interface TooltipProps {
    direction?: 'top' | 'bottom' | 'left' | 'right';
    align?: 'start' | 'center' | 'end';
    children: React.ReactNode;
    content: string;
}
export declare const Tooltip: React.FC<TooltipProps>;
