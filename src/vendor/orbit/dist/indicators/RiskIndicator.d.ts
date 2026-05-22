import React from 'react';
export interface RiskIndicatorProps {
    level?: 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low' | 'None';
    position?: 'Left' | 'Right';
    ariaLabel?: string;
}
export declare const RiskIndicator: React.FC<RiskIndicatorProps>;
