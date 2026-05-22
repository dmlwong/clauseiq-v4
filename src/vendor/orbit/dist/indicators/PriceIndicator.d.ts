import React from 'react';
export interface PriceIndicatorProps {
    value?: string;
    movement?: 'Positive' | 'Negative' | 'None';
    position?: 'Left' | 'Right';
    ariaLabel?: string;
}
export declare const PriceIndicator: React.FC<PriceIndicatorProps>;
