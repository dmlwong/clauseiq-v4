import React from 'react';
export interface FilterProps {
    label: string;
    onRemove?: () => void;
    state?: 'Default' | 'Hover';
}
export declare const Filter: React.FC<FilterProps>;
