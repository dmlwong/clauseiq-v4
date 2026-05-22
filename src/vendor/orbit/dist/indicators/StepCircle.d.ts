import React from 'react';
export interface StepCircleProps {
    status: 'Checked' | 'Active' | 'To Do' | 'Numbered' | 'Disabled';
    size?: 'Large' | 'Medium' | 'Small';
    label?: string | number;
    ariaLabel?: string;
}
export declare const StepCircle: React.FC<StepCircleProps>;
