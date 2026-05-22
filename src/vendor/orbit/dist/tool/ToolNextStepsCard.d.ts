import React from 'react';
export interface ToolNextStepAction {
    id: string;
    icon: string;
    title: string;
    description: string;
    href?: string;
    disabled?: boolean;
    ariaLabel?: string;
    /** Render a horizontal divider line below this row. Used to visually group rows. */
    dividerAfter?: boolean;
    /** Hide the trailing chevron while preserving its layout space. */
    hideChevron?: boolean;
    /** Render the trailing chevron pointing up to indicate an expanded row. */
    expanded?: boolean;
    /** Optional expanded content rendered below the row header when expanded is true. */
    expandedContent?: React.ReactNode;
}
export interface ToolNextStepsCardProps {
    title?: string;
    actions?: ToolNextStepAction[];
    onActionSelect?: (id: string) => void;
}
export declare function ToolNextStepsCard({ title, actions, onActionSelect, }: ToolNextStepsCardProps): import("react/jsx-runtime").JSX.Element;
