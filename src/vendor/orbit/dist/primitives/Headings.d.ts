import React from 'react';
export interface HeadingsProps {
    size: 'Heading 1' | 'Heading 2' | 'Heading 3' | 'Heading 4' | 'Heading 5';
    children: React.ReactNode;
    style?: React.CSSProperties;
}
export declare const Headings: React.FC<HeadingsProps>;
