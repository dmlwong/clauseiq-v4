import React from 'react';
export interface InlineBannerProps {
    variant: 'Information' | 'Success' | 'Warning' | 'Error' | 'Style 1' | 'None' | 'No Status' | 'Disabled';
    contrast?: 'High' | 'Low';
    label: string;
    /**
     * Optional by design: product flows may use the strip as label-only feedback.
     * The Figma reference renders a status slot, and the showcase covers that path.
     */
    status?: string;
    icon?: string;
}
export declare const InlineBanner: React.FC<InlineBannerProps>;
