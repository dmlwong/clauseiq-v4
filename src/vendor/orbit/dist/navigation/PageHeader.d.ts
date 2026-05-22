import React from 'react';
export interface PageHeaderAction {
    id?: string;
    label: string;
    ariaLabel?: string;
    icon?: string;
    variant?: 'Primary' | 'Secondary' | 'IconOnly';
    onClick?: () => void;
    disabled?: boolean;
}
export interface PageHeaderTab {
    id?: string;
    label: string;
    badge?: number;
    panelId?: string;
    disabled?: boolean;
}
export interface PageHeaderPill {
    code: string;
    label: string;
}
export interface PageHeaderProps {
    /** 'main' = greeting header, 'tool' = tool/app header with icon */
    type?: 'main' | 'tool';
    title: string;
    subtitle?: string;
    /** FA icon unicode for tool headers */
    icon?: string;
    /** Gradient colors [from, to] for the icon button */
    iconGradient?: [string, string];
    /** Bottom border color (2px). Omit for no colored border */
    borderColor?: string;
    /** Right-side action buttons */
    actions?: PageHeaderAction[];
    /** Initiative pill shown on the right */
    pill?: PageHeaderPill;
    /** Tab bar below the header */
    tabs?: PageHeaderTab[];
    /** Active tab index */
    activeTab?: number;
    /** Initial tab index for uncontrolled headers */
    defaultActiveTab?: number;
    /** Callback when tab is clicked */
    onTabChange?: (index: number) => void;
    /** Whether active tab shows underline */
    showTabUnderline?: boolean;
}
export declare const HeaderPresets: {
    identify: {
        iconGradient: [string, string];
        borderColor: string;
    };
    deliver: {
        iconGradient: [string, string];
        borderColor: string;
    };
    sustain: {
        iconGradient: [string, string];
        borderColor: string;
    };
    rfp: {
        iconGradient: [string, string];
        borderColor: string;
    };
};
export declare const PageHeader: React.FC<PageHeaderProps>;
