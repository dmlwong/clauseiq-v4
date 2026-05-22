export type FieldNamingProps = {
    label: string;
    ariaLabel?: string;
    ariaLabelledBy?: string;
} | {
    label?: undefined;
    ariaLabel: string;
    ariaLabelledBy?: string;
} | {
    label?: undefined;
    ariaLabel?: string;
    ariaLabelledBy: string;
};
export type StandaloneFieldNamingProps = {
    ariaLabel: string;
    ariaLabelledBy?: string;
} | {
    ariaLabel?: string;
    ariaLabelledBy: string;
};
export declare function warnIfUnnamed(componentName: string, label?: string, ariaLabel?: string, ariaLabelledBy?: string): void;
