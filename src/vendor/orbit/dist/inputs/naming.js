export function warnIfUnnamed(componentName, label, ariaLabel, ariaLabelledBy) {
    if (process.env.NODE_ENV === 'production')
        return;
    if (label || ariaLabel || ariaLabelledBy)
        return;
    console.warn("".concat(componentName, " requires label, ariaLabel, or ariaLabelledBy to provide an accessible name."));
}
