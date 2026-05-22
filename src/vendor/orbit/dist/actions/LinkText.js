'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import clsx from 'clsx';
import styles from './LinkText.module.css';
export var LinkText = function (_a) {
    var label = _a.label, _b = _a.href, href = _b === void 0 ? '#' : _b, _c = _a.variant, variant = _c === void 0 ? 'Primary' : _c, _d = _a.disabled, disabled = _d === void 0 ? false : _d, _e = _a.current, current = _e === void 0 ? false : _e, _f = _a.external, external = _f === void 0 ? false : _f, onClick = _a.onClick;
    var variantClass = variant === 'Heading'
        ? styles.heading
        : variant === 'Secondary'
            ? styles.secondary
            : styles.primary;
    return (_jsx("a", { href: disabled ? undefined : href, className: clsx(styles.link, variantClass, disabled && styles.disabled), onClick: disabled ? function (event) { return event.preventDefault(); } : onClick, "aria-disabled": disabled || undefined, "aria-current": current ? 'page' : undefined, tabIndex: disabled ? -1 : undefined, target: external && !disabled ? '_blank' : undefined, rel: external && !disabled ? 'noopener noreferrer' : undefined, children: label }));
};
