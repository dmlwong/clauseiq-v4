'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { FaIcon, FA } from '../primitives/FaIcon';
import styles from './Toast.module.css';
export var Toast = function (_a) {
    var type = _a.type, message = _a.message, visible = _a.visible, onDismiss = _a.onDismiss, actions = _a.actions;
    useEffect(function () {
        if (visible && onDismiss) {
            var timer_1 = setTimeout(onDismiss, 3000);
            return function () { return clearTimeout(timer_1); };
        }
    }, [visible, onDismiss]);
    if (!visible)
        return null;
    var bgMap = {
        Success: 'var(--orbit-color-status-high-bg-success)',
        Error: 'var(--orbit-color-status-high-bg-error)',
        Info: 'var(--orbit-color-status-high-bg-information)',
        Warning: 'var(--orbit-color-status-high-bg-warning)',
        Mute: 'var(--orbit-color-status-high-bg-no-status)',
        NoStatus: 'var(--orbit-color-status-high-bg-no-status)',
    };
    var fgMap = {
        Success: 'var(--orbit-color-white)',
        Error: 'var(--orbit-color-white)',
        Info: 'var(--orbit-color-white)',
        Warning: 'var(--orbit-color-black)',
        Mute: 'var(--orbit-color-text-primary)',
        NoStatus: 'var(--orbit-color-text-primary)',
    };
    var iconMap = {
        Success: FA.circleCheck,
        Error: FA.circleExclamation,
        Info: FA.circleInfo,
        Warning: FA.triangleExclamation,
        Mute: FA.minus,
        NoStatus: FA.minus,
    };
    return (_jsxs("div", { className: styles.toast, style: { '--_bg': bgMap[type], '--_fg': fgMap[type] }, role: type === 'Error' ? 'alert' : 'status', "aria-live": type === 'Error' ? 'assertive' : 'polite', children: [_jsxs("div", { className: styles.content, children: [_jsx("span", { className: styles.iconWrapper, children: _jsx(FaIcon, { icon: iconMap[type], size: 12, color: "inherit" }) }), _jsx("span", { children: message })] }), (actions === null || actions === void 0 ? void 0 : actions.length) ? (_jsx("div", { className: styles.actions, children: actions.map(function (action) { return (_jsx("button", { type: "button", className: action.variant === 'Primary' ? styles.actionPrimary : styles.actionSecondary, onClick: action.onClick, children: action.label }, action.label)); }) })) : null, onDismiss && (_jsx("button", { type: "button", className: styles.dismissButton, onClick: onDismiss, "aria-label": "Dismiss ".concat(type.toLowerCase(), " toast"), children: _jsx(FaIcon, { icon: FA.xmarkLarge, size: 12, color: "inherit" }) }))] }));
};
