import React from 'react';
export interface QuickFilterItemProps {
    label: string;
    selected?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    leftIcon?: string;
    rightIcon?: string;
}
export declare const QuickFilterItem: React.FC<QuickFilterItemProps>;
export interface QuickFilterGroupProps {
    children: React.ReactNode;
    ariaLabel?: string;
}
export declare const QuickFilterGroup: React.FC<QuickFilterGroupProps>;
