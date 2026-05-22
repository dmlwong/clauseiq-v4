'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import styles from './Badge.module.css';
var bgMap = {
    Green: 'var(--orbit-color-bright-green)',
    Red: 'var(--orbit-color-bright-orange)',
    Gray: 'var(--orbit-color-mid-gray)',
    Success: 'var(--orbit-color-status-high-bg-success)',
    Information: 'var(--orbit-color-status-high-bg-information)',
    Warning: 'var(--orbit-color-status-high-bg-warning)',
    Error: 'var(--orbit-color-status-high-bg-error)',
    'No Status': 'var(--orbit-color-status-high-bg-no-status)',
};
var fgMap = {
    Green: 'var(--orbit-color-white)',
    Red: 'var(--orbit-color-white)',
    Gray: 'var(--orbit-color-white)',
    Success: 'var(--orbit-color-white)',
    Information: 'var(--orbit-color-white)',
    Warning: 'var(--orbit-color-text-primary)',
    Error: 'var(--orbit-color-white)',
    'No Status': 'var(--orbit-color-text-primary)',
};
export var Badge = function (_a) {
    var label = _a.label, _b = _a.status, status = _b === void 0 ? 'Green' : _b, ariaLabel = _a.ariaLabel;
    return (_jsx("span", { className: styles.badge, style: { '--_bg': bgMap[status], '--_fg': fgMap[status] }, "aria-label": ariaLabel, children: label }));
};
