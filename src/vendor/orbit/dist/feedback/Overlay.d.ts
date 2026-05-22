import React from 'react';
export interface OverlayProps {
    visible: boolean;
    onClose: () => void;
    children: React.ReactNode;
    ariaLabel?: string;
    ariaLabelledBy?: string;
    size?: 'Default' | 'Large';
    height?: 'Viewport' | 'Content';
}
export declare const Overlay: React.FC<OverlayProps>;
