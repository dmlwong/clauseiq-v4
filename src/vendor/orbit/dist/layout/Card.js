'use client';
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { jsx as _jsx } from "react/jsx-runtime";
import clsx from 'clsx';
import styles from './Card.module.css';
export var Card = function (_a) {
    var _b = _a.state, state = _b === void 0 ? 'Default' : _b, _c = _a.type, type = _c === void 0 ? 'Dynamic' : _c, _d = _a.padding, padding = _d === void 0 ? 'Base' : _d, children = _a.children, externalStyle = _a.style;
    var isDisabled = state === 'Disabled';
    var isDynamic = type === 'Dynamic';
    var getBorderColor = function () {
        switch (state) {
            case 'Highlight': return 'var(--orbit-color-card-border-highlight)';
            case 'Accent': return 'var(--orbit-color-card-border-accent)';
            case 'Disabled': return 'transparent';
            case 'Success': return 'var(--orbit-color-card-border-selected)';
            case 'Warning': return 'var(--orbit-color-card-border-style1)';
            default: return 'var(--orbit-color-card-border-default)';
        }
    };
    var getBgColor = function () {
        switch (state) {
            case 'Accent': return 'var(--orbit-color-card-bg-accent)';
            case 'Disabled': return 'var(--orbit-color-card-bg-disabled)';
            case 'Success': return 'var(--orbit-color-card-bg-selected)';
            case 'Warning': return 'var(--orbit-color-card-bg-style1)';
            default: return 'var(--orbit-color-card-bg-default)';
        }
    };
    var paddingClass = {
        Base: styles.paddingBase,
        Medium: styles.paddingMedium,
        Small: styles.paddingSmall,
    }[padding];
    return (_jsx("div", { className: clsx(styles.card, isDynamic ? styles.dynamic : styles.static, state === 'Hover' && styles.previewHover, isDisabled && styles.disabled, paddingClass), style: __assign({ '--_bg': getBgColor(), '--_border-color': getBorderColor() }, externalStyle), "aria-disabled": isDisabled || undefined, children: children }));
};
