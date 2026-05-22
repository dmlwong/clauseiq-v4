import React from 'react';
type ChipSize = 'Default' | 'Mini' | 'Small' | 'Medium';
type ChipVariant = 'Information' | 'Success' | 'Warning' | 'Error' | 'Additional' | 'No Status' | 'Outline' | 'Disabled';
export interface ChipBaseProps {
    size?: ChipSize;
    variant?: ChipVariant;
    label: string;
    selected?: boolean;
    disabled?: boolean;
}
export type StaticChipProps = ChipBaseProps & {
    removable?: false;
    onClick?: never;
    onRemove?: never;
};
export type ToggleChipProps = ChipBaseProps & {
    removable?: false;
    onClick: () => void;
    onRemove?: never;
};
export type RemovableChipProps = ChipBaseProps & {
    removable: true;
    onRemove?: () => void;
    onClick?: never;
};
export type ChipProps = StaticChipProps | ToggleChipProps | RemovableChipProps;
export declare const Chip: React.FC<ChipProps>;
export {};
