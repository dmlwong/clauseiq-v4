import React from 'react';
export interface CardProps {
    state?: 'Default' | 'Hover' | 'Highlight' | 'Accent' | 'Disabled' | 'Success' | 'Warning';
    type?: 'Static' | 'Dynamic';
    padding?: 'Base' | 'Medium' | 'Small';
    children: React.ReactNode;
    style?: React.CSSProperties;
}
export declare const Card: React.FC<CardProps>;
