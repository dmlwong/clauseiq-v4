'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import clsx from 'clsx';
import { FaIcon, FA } from '../primitives/FaIcon';
import chipStyles from './Chip.module.css';
var variantStyles = {
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
    Additional: {
        bg: 'var(--orbit-color-chip-additional-bg)',
        border: 'var(--orbit-color-chip-additional-border)',
        fg: 'var(--orbit-color-chip-additional-fg)',
    },
    'No Status': {
        bg: 'var(--orbit-color-chip-no-status-bg)',
        fg: 'var(--orbit-color-text-primary)',
    },
    Outline: {
        bg: 'var(--orbit-color-white)',
        border: 'var(--orbit-color-chip-default-border)',
        fg: 'var(--orbit-color-text-primary)',
    },
    Disabled: {
        bg: 'var(--orbit-color-chip-disabled-bg)',
        fg: 'var(--orbit-color-chip-disabled-fg)',
    },
};
export var Chip = function (props) {
    var _a;
    var _b = props.size, size = _b === void 0 ? 'Default' : _b, _c = props.variant, variant = _c === void 0 ? 'Outline' : _c, label = props.label, _d = props.selected, selected = _d === void 0 ? false : _d;
    var removable = props.removable === true;
    var disabled = (_a = props.disabled) !== null && _a !== void 0 ? _a : variant === 'Disabled';
    var onClick = 'onClick' in props ? props.onClick : undefined;
    var onRemove = 'onRemove' in props ? props.onRemove : undefined;
    var vs = variantStyles[variant];
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
