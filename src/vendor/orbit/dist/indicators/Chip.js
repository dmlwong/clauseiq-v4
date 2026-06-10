'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import clsx from 'clsx';
import { FaIcon, FA } from '../primitives/FaIcon';
import chipStyles from './Chip.module.css';
var disabledStyle = {
    bg: 'var(--orbit-color-chip-disabled-bg)',
    fg: 'var(--orbit-color-chip-disabled-fg)',
};
var lowStyles = {
    Information: {
        bg: 'var(--orbit-color-status-low-bg-information)',
        border: 'var(--orbit-color-status-low-border-information)',
        fg: 'var(--orbit-color-text-info)',
    },
    Success: {
        bg: 'var(--orbit-color-status-low-bg-success)',
        border: 'var(--orbit-color-status-low-border-success)',
        fg: 'var(--orbit-color-text-success)',
    },
    Warning: {
        bg: 'var(--orbit-color-status-low-bg-warning)',
        border: 'var(--orbit-color-status-low-border-warning)',
        fg: 'var(--orbit-color-text-warning)',
    },
    Error: {
        bg: 'var(--orbit-color-status-low-bg-error)',
        border: 'var(--orbit-color-status-low-border-error)',
        fg: 'var(--orbit-color-text-error)',
    },
    'Style 1': {
        bg: 'var(--orbit-color-chip-style-1-bg)',
        border: 'var(--orbit-color-chip-style-1-border)',
        fg: 'var(--orbit-color-chip-style-1-border)',
    },
    'Style 2': {
        bg: 'var(--orbit-color-chip-style-2-bg)',
        border: 'var(--orbit-color-chip-style-2-border)',
        fg: 'var(--orbit-color-chip-style-2-border)',
    },
    'Style 3': {
        bg: 'var(--orbit-color-chip-style-3-bg)',
        border: 'var(--orbit-color-chip-style-3-border)',
        fg: 'var(--orbit-color-chip-style-3-border)',
    },
    'Style 4': {
        bg: 'var(--orbit-color-chip-style-4-bg)',
        border: 'var(--orbit-color-chip-style-4-border)',
        fg: 'var(--orbit-color-chip-style-4-border)',
    },
    Additional: {
        bg: 'var(--orbit-color-chip-additional-bg)',
        border: 'var(--orbit-color-chip-additional-border)',
        fg: 'var(--orbit-color-chip-additional-fg)',
    },
    'No Status': {
        bg: 'var(--orbit-color-chip-no-status-bg)',
        fg: 'var(--orbit-color-text-primary)',
    },
    None: {
        bg: 'var(--orbit-color-chip-no-status-bg)',
        fg: 'var(--orbit-color-text-primary)',
    },
    Outline: {
        bg: 'var(--orbit-color-white)',
        border: 'var(--orbit-color-chip-default-border)',
        fg: 'var(--orbit-color-text-primary)',
    },
    Disabled: disabledStyle,
};
var highStyles = {
    Information: { bg: 'var(--orbit-color-chip-high-bg-information)', fg: 'var(--orbit-color-chip-high-fg)' },
    Success: { bg: 'var(--orbit-color-chip-high-bg-success)', fg: 'var(--orbit-color-chip-high-fg)' },
    Warning: { bg: 'var(--orbit-color-chip-high-bg-warning)', fg: 'var(--orbit-color-chip-high-fg)' },
    Error: { bg: 'var(--orbit-color-chip-high-bg-error)', fg: 'var(--orbit-color-chip-high-fg)' },
    'Style 1': { bg: 'var(--orbit-color-chip-high-bg-style-1)', fg: 'var(--orbit-color-chip-high-fg)' },
    'No Status': { bg: 'var(--orbit-color-chip-high-bg-none)', fg: 'var(--orbit-color-chip-high-fg-none)' },
    None: { bg: 'var(--orbit-color-chip-high-bg-none)', fg: 'var(--orbit-color-chip-high-fg-none)' },
    Disabled: disabledStyle,
};
function resolveChipStyle(variant, contrast) {
    if (contrast === 'High' && highStyles[variant]) {
        return highStyles[variant];
    }
    return lowStyles[variant] || lowStyles.Outline;
}
export var Chip = function (props) {
    var _a;
    var _b = props.size, size = _b === void 0 ? 'Default' : _b, _c = props.variant, variant = _c === void 0 ? 'Outline' : _c, _d = props.contrast, contrast = _d === void 0 ? 'Low' : _d, label = props.label, _e = props.selected, selected = _e === void 0 ? false : _e;
    var removable = props.removable === true;
    var disabled = (_a = props.disabled) !== null && _a !== void 0 ? _a : variant === 'Disabled';
    var onClick = 'onClick' in props ? props.onClick : undefined;
    var onRemove = 'onRemove' in props ? props.onRemove : undefined;
    var vs = disabled ? disabledStyle : resolveChipStyle(variant, contrast);
    var isMini = size === 'Mini' || size === 'Small';
    var isInteractive = Boolean(onClick);
    var className = clsx(chipStyles.chip, isMini ? chipStyles.mini : chipStyles.default, isInteractive && chipStyles.interactive, selected && chipStyles.selected, disabled && chipStyles.disabled);
    var style = {
        '--_bg': vs.bg,
        '--_border': vs.border ? "1px solid ".concat(vs.border) : 'none',
        '--_fg': vs.fg,
    };
    if (isInteractive) {
        return (_jsx("button", { type: "button", className: className, style: style, "aria-pressed": selected, disabled: disabled, onClick: disabled ? undefined : onClick, children: _jsx("span", { children: label }) }));
    }
    return (_jsxs("span", { className: className, style: style, "aria-disabled": disabled || undefined, children: [_jsx("span", { children: label }), removable && (_jsx("button", { type: "button", className: chipStyles.closeButton, onClick: function (event) {
                    event.stopPropagation();
                    if (!disabled)
                        onRemove === null || onRemove === void 0 ? void 0 : onRemove();
                }, disabled: disabled, "aria-label": "Remove ".concat(label), children: _jsx(FaIcon, { icon: FA.xmark, size: 10, color: "inherit" }) }))] }));
};
