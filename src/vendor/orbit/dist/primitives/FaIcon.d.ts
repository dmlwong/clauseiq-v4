import React from 'react';
/**
 * Font Awesome 6 Pro icon component.
 * Uses the locally installed OTF font files via @font-face.
 *
 * Unicode references: https://fontawesome.com/search
 */
export interface FaIconProps {
    icon: string;
    size?: number;
    color?: string;
    style?: React.CSSProperties;
    ariaHidden?: boolean;
}
export declare const FA: {
    readonly circleCheck: "";
    readonly circleInfo: "";
    readonly circleExclamation: "";
    readonly triangleExclamation: "";
    readonly xmark: "";
    readonly xmarkLarge: "";
    readonly check: "";
    readonly file: "";
    readonly star: "";
    readonly square: "";
    readonly minus: "";
    readonly chevronRight: "";
    readonly user: "";
    readonly smile: "";
    readonly anglesUp: "";
    readonly angleUp: "";
    readonly angleDown: "";
    readonly arrowUpDown: "";
    readonly sortUp: "";
    readonly sortDown: "";
    readonly circleQuestion: "";
    readonly anglesDown: "";
    readonly grip: "";
};
export declare const FaIcon: React.FC<FaIconProps>;
