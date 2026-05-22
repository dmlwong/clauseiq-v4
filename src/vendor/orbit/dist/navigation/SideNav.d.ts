import React from 'react';
export interface SideNavAction {
    id: string;
    href?: string;
    onClick?: () => void;
    ariaLabel?: string;
}
export interface SideNavItem extends SideNavAction {
    icon: string;
    label: string;
    active?: boolean;
    badge?: number;
}
export interface SideNavSubItem extends SideNavAction {
    icon: string;
    label: string;
    active?: boolean;
    muted?: boolean;
}
export interface SideNavSection extends SideNavAction {
    label: string;
    color: string;
    expanded?: boolean;
    showChevron?: boolean;
    items?: SideNavSubItem[];
}
export interface SideNavWorkItem extends SideNavAction {
    title: string;
    subtitle: string;
    active?: boolean;
}
export interface SideNavProps {
    appName: string;
    clientName: string;
    width?: number;
    logoIcon?: string;
    clientChevronIcon?: string;
    navItems?: SideNavItem[];
    sections?: SideNavSection[];
    workItems?: SideNavWorkItem[];
    workHeading?: string;
    workSearchIcon?: string;
    workSearchAriaLabel?: string;
    onWorkSearch?: () => void;
    userName: string;
    userInitials: string;
    profileMenuIcon?: string;
    profileMenuAriaLabel?: string;
    onProfileMenu?: () => void;
    ariaLabel?: string;
}
export type RowPrimitiveProps = {
    href?: string;
    onClick?: () => void;
    className: string;
    children: React.ReactNode;
    ariaLabel?: string;
    ariaCurrent?: 'page';
};
export declare const SideNav: React.FC<SideNavProps>;
