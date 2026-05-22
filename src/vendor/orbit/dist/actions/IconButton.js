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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import clsx from 'clsx';
import styles from './IconButton.module.css';
var variantMap = {
    Primary: styles.primary,
    Secondary: styles.secondary,
    Tertiary: styles.tertiary,
    Positive: styles.positive,
    Destructive: styles.destructive,
};
var sizeMap = {
    Small: styles.small,
    Medium: styles.medium,
    Large: styles.large,
};
export var IconButton = React.forwardRef(function IconButton(_a, ref) {
    var _b = _a.variant, variant = _b === void 0 ? 'Secondary' : _b, _c = _a.size, size = _c === void 0 ? 'Medium' : _c, _d = _a.state, state = _d === void 0 ? 'Default' : _d, icon = _a.icon, onClick = _a.onClick, ariaLabel = _a.ariaLabel, _e = _a.disabled, disabled = _e === void 0 ? false : _e, className = _a.className, _f = _a.type, type = _f === void 0 ? 'button' : _f, buttonProps = __rest(_a, ["variant", "size", "state", "icon", "onClick", "ariaLabel", "disabled", "className", "type"]);
    var isDisabled = disabled || state === 'Disabled';
    return (_jsx("button", __assign({}, buttonProps, { ref: ref, type: type, className: clsx(styles.iconButton, variantMap[variant], sizeMap[size], state === 'Hover' && styles.previewHover, className), onClick: isDisabled ? undefined : onClick, disabled: isDisabled, "aria-label": ariaLabel, children: icon })));
});
