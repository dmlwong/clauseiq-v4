import React from 'react';
export interface TextProps {
    children: React.ReactNode;
    as?: 'span' | 'p' | 'div' | 'strong' | 'em';
    size?: 'Paragraph' | 'Small';
    variant?: 'Primary' | 'Secondary' | 'Bold' | 'Disabled' | 'Inverse' | 'Error' | 'Information' | 'Warning';
}
export declare const Text: React.FC<TextProps>;
