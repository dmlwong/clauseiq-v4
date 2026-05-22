'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import clsx from 'clsx';
import styles from './StatusIndicator.module.css';
var colorMap = {
    Success: 'var(--orbit-color-status-high-bg-success)',
    Information: 'var(--orbit-color-status-high-bg-information)',
    Error: 'var(--orbit-color-status-high-bg-error)',
    Warning: 'var(--orbit-color-status-high-bg-warning)',
    'No Status': 'var(--orbit-color-status-high-bg-no-status)',
};
export var StatusIndicator = function (_a) {
    var status = _a.status, _b = _a.size, size = _b === void 0 ? 'Default' : _b, label = _a.label, ariaLabel = _a.ariaLabel;
    return (_jsxs("span", { className: styles.container, role: label ? undefined : 'img', "aria-label": label ? undefined : ariaLabel || status, children: [_jsx("span", { className: clsx(styles.dot, size === 'Small' ? styles.dotSmall : styles.dotDefault), style: { '--_color': colorMap[status] }, "aria-hidden": "true" }), label && _jsx("span", { className: styles.label, children: label })] }));
};
