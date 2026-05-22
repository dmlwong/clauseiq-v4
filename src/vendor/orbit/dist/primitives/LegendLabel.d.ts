import React from 'react';
export interface LegendLabelProps {
    value?: string;
    color?: string;
    position?: 'Left' | 'Right';
}
export declare const LegendLabel: React.FC<LegendLabelProps>;
