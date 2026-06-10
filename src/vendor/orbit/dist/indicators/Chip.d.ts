import React from 'react';
type ChipSize = 'Default' | 'Mini' | 'Small' | 'Medium';
type ChipContrast = 'High' | 'Low';
type ChipVariant = 'Information' | 'Success' | 'Warning' | 'Error' | 'Style 1' | 'Style 2' | 'Style 3' | 'Style 4' | 'Additional' | 'No Status' | 'None' | 'Outline' | 'Disabled';
export interface ChipBaseProps {
    size?: ChipSize;
    variant?: ChipVariant;
    contrast?: ChipContrast;
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
