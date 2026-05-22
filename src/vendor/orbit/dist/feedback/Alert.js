'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FaIcon, FA } from '../primitives/FaIcon';
import styles from './Banner.module.css';
export var Alert = function (_a) {
    var type = _a.type, title = _a.title, description = _a.description, onDismiss = _a.onDismiss;
    var bgMap = {
        Information: 'var(--orbit-color-status-low-bg-information)',
        Success: 'var(--orbit-color-status-low-bg-success)',
        Error: 'var(--orbit-color-status-low-bg-error)',
        Warning: 'var(--orbit-color-status-low-bg-warning)',
        'No Status': 'var(--orbit-color-status-low-bg-no-status)',
    };
    var iconColorMap = {
        Information: 'var(--orbit-color-status-low-icon-information)',
        Success: 'var(--orbit-color-status-low-icon-success)',
        Error: 'var(--orbit-color-status-low-icon-error)',
        Warning: 'var(--orbit-color-status-low-icon-warning)',
        'No Status': 'var(--orbit-color-status-low-icon-no-status)',
    };
    var fgMap = {
        Information: 'var(--orbit-color-status-low-fg-information)',
        Success: 'var(--orbit-color-status-low-fg-success)',
        Error: 'var(--orbit-color-status-low-fg-error)',
        Warning: 'var(--orbit-color-status-low-fg-warning)',
        'No Status': 'var(--orbit-color-status-low-fg-no-status)',
    };
    var iconMap = {
        Information: FA.circleInfo,
        Success: FA.circleCheck,
        Error: FA.circleExclamation,
        Warning: FA.triangleExclamation,
        'No Status': FA.circleInfo,
    };
    return (_jsxs("div", { className: styles.banner, style: { '--_bg': bgMap[type], '--_fg': fgMap[type] }, children: [_jsxs("div", { className: styles.wrapper, children: [_jsx("span", { className: styles.iconWrapper, children: _jsx(FaIcon, { icon: iconMap[type], size: 16, color: iconColorMap[type] }) }), _jsxs("div", { className: styles.contentArea, children: [_jsx("span", { className: styles.title, children: title }), description && _jsx("span", { className: styles.description, children: description })] })] }), onDismiss && (_jsx("button", { type: "button", className: styles.dismissButton, onClick: onDismiss, "aria-label": "Dismiss ".concat(type.toLowerCase(), " alert"), children: _jsx(FaIcon, { icon: FA.xmarkLarge, size: 12, color: "var(--orbit-color-dark-grey)" }) }))] }));
};
