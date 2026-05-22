import React from 'react';
export interface SpinnerProps {
    size?: 'Inline' | 'Medium' | 'Large';
    label?: string;
    decorative?: boolean;
}
export declare const Spinner: React.FC<SpinnerProps>;
