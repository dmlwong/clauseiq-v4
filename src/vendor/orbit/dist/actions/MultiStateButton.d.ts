import React from 'react';
export interface MultiStateButtonProps {
    value: string;
    label: string;
    selected?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    leftIcon?: string;
    rightIcon?: string;
    count?: number;
    tabIndex?: number;
}
export declare const MultiStateButton: React.FC<MultiStateButtonProps>;
export interface MultiStateGroupProps {
    children: React.ReactNode;
    ariaLabel?: string;
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
}
export declare const MultiStateGroup: React.FC<MultiStateGroupProps>;
