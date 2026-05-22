import React from 'react';
interface BreadcrumbItem {
    label: string;
    href?: string;
    id?: string;
}
export interface BreadcrumbProps {
    items: BreadcrumbItem[];
}
export declare const Breadcrumb: React.FC<BreadcrumbProps>;
export {};
