import React from 'react';
export type CardState = 'Default' | 'Hover' | 'Accent' | 'Highlight' | 'Feature' | 'Information' | 'Success' | 'Warning' | 'Error' | 'Disabled';
export interface CardProps {
    state?: CardState;
    type?: 'Static' | 'Dynamic';
    padding?: 'Base' | 'Medium' | 'Small';
    indicator?: boolean;
    children: React.ReactNode;
    style?: React.CSSProperties;
}
export declare const Card: React.FC<CardProps>;
