'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import clsx from 'clsx';
import styles from './InlineBanner.module.css';
import { FaIcon, FA } from '../primitives/FaIcon';
var highContrastMap = {
    Information: { bg: 'var(--orbit-color-status-high-bg-information)', fg: 'var(--orbit-color-white)', iconColor: 'var(--orbit-color-white)' },
    Success: { bg: 'var(--orbit-color-status-high-bg-success)', fg: 'var(--orbit-color-white)', iconColor: 'var(--orbit-color-white)' },
    Warning: { bg: 'var(--orbit-color-status-high-bg-warning)', fg: 'var(--orbit-color-text-primary)', iconColor: 'var(--orbit-color-white)' },
    Error: { bg: 'var(--orbit-color-status-high-bg-error)', fg: 'var(--orbit-color-white)', iconColor: 'var(--orbit-color-white)' },
    'Style 1': { bg: 'var(--orbit-color-status-high-bg-style-1)', fg: 'var(--orbit-color-white)', iconColor: 'var(--orbit-color-white)' },
    None: { bg: 'var(--orbit-color-white)', fg: 'var(--orbit-color-text-primary)', iconColor: 'var(--orbit-color-dove-gray)' },
    'No Status': { bg: 'var(--orbit-color-status-high-bg-no-status)', fg: 'var(--orbit-color-text-primary)', iconColor: 'var(--orbit-color-dove-gray)' },
    Disabled: { bg: 'var(--orbit-color-chip-disabled-bg)', fg: 'var(--orbit-color-chip-disabled-fg)', iconColor: 'var(--orbit-color-chip-disabled-fg)' },
};
var lowContrastMap = {
    Information: { bg: 'var(--orbit-color-status-low-bg-information)', fg: 'var(--orbit-color-text-info)', iconColor: 'var(--orbit-color-status-low-icon-information)' },
    Success: { bg: 'var(--orbit-color-status-low-bg-success)', fg: 'var(--orbit-color-text-success)', iconColor: 'var(--orbit-color-status-low-icon-success)' },
    Warning: { bg: 'var(--orbit-color-status-low-bg-warning)', fg: 'var(--orbit-color-text-warning)', iconColor: 'var(--orbit-color-status-low-icon-warning)' },
    Error: { bg: 'var(--orbit-color-status-low-bg-error)', fg: 'var(--orbit-color-text-error)', iconColor: 'var(--orbit-color-status-low-icon-error)' },
    'Style 1': { bg: 'var(--orbit-color-chip-additional-bg)', fg: 'var(--orbit-color-chip-additional-fg)', iconColor: 'var(--orbit-color-chip-additional-fg)' },
    None: { bg: 'var(--orbit-color-white)', fg: 'var(--orbit-color-text-primary)', iconColor: 'var(--orbit-color-dove-gray)' },
    'No Status': { bg: 'var(--orbit-color-status-high-bg-no-status)', fg: 'var(--orbit-color-text-primary)', iconColor: 'var(--orbit-color-dove-gray)' },
    Disabled: { bg: 'var(--orbit-color-chip-disabled-bg)', fg: 'var(--orbit-color-chip-disabled-fg)', iconColor: 'var(--orbit-color-chip-disabled-fg)' },
};
var iconMap = {
    Information: FA.circleInfo,
    Success: FA.circleCheck,
    Warning: FA.triangleExclamation,
    Error: FA.circleExclamation,
    'Style 1': FA.star,
    None: FA.file,
    'No Status': FA.file,
    Disabled: FA.file,
};
export var InlineBanner = function (_a) {
    var variant = _a.variant, _b = _a.contrast, contrast = _b === void 0 ? 'High' : _b, label = _a.label, status = _a.status, icon = _a.icon;
    var colors = (contrast === 'High' ? highContrastMap : lowContrastMap)[variant];
    // Figma renders a border only for the high-contrast None banner.
    var isNoneOutline = variant === 'None' && contrast === 'High';
    return (_jsxs("div", { className: clsx(styles.banner, isNoneOutline && styles.outlined), style: { '--_bg': colors.bg, '--_fg': colors.fg }, children: [_jsxs("div", { className: styles.wrapper, children: [_jsx("span", { className: styles.iconBox, children: _jsx(FaIcon, { icon: icon || iconMap[variant], size: 12, color: colors.iconColor }) }), _jsx("span", { className: styles.label, children: label })] }), status && _jsx("span", { className: styles.status, children: status })] }));
};
