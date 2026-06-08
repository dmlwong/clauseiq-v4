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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import clsx from 'clsx';
import styles from './Card.module.css';
var STATE_TOKEN = {
    Default: 'default',
    Hover: 'default',
    Accent: 'accent',
    Highlight: 'highlight',
    Feature: 'feature',
    Information: 'information',
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
    Disabled: 'disabled',
};
var RAIL_STATES = new Set([
    'Highlight',
    'Feature',
    'Information',
    'Success',
    'Warning',
    'Error',
]);
export var Card = function (_a) {
    var _b = _a.state, state = _b === void 0 ? 'Default' : _b, _c = _a.type, type = _c === void 0 ? 'Dynamic' : _c, _d = _a.padding, padding = _d === void 0 ? 'Base' : _d, indicator = _a.indicator, children = _a.children, externalStyle = _a.style;
    var isDisabled = state === 'Disabled';
    var isDynamic = type === 'Dynamic';
    var token = STATE_TOKEN[state];
    var showRail = (indicator !== null && indicator !== void 0 ? indicator : RAIL_STATES.has(state)) && !isDisabled;
    var paddingClass = {
        Base: styles.paddingBase,
        Medium: styles.paddingMedium,
        Small: styles.paddingSmall,
    }[padding];
    return (_jsxs("div", { className: clsx(styles.card, isDynamic ? styles.dynamic : styles.static, state === 'Hover' && styles.previewHover, isDisabled && styles.disabled, paddingClass), style: __assign({ '--_bg': "var(--orbit-color-card-bg-".concat(token, ")"), '--_border-color': "var(--orbit-color-card-border-".concat(token, ")") }, externalStyle), "aria-disabled": isDisabled || undefined, children: [showRail && (_jsx("span", { "aria-hidden": "true", className: styles.indicator, style: { '--_indicator': "var(--orbit-color-card-indicator-".concat(token, ")") } })), children] }));
};
