import React from 'react';
export interface LinkTextProps {
    label: string;
    href?: string;
    variant?: 'Primary' | 'Secondary' | 'Heading';
    disabled?: boolean;
    current?: boolean;
    external?: boolean;
    onClick?: () => void;
}
export declare const LinkText: React.FC<LinkTextProps>;
