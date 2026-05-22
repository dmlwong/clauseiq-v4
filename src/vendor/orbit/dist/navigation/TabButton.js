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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import clsx from 'clsx';
import styles from './TabButton.module.css';
export var TabButton = React.forwardRef(function TabButton(_a, ref) {
    var _b = _a.active, active = _b === void 0 ? false : _b, _c = _a.status, status = _c === void 0 ? 'Rest' : _c, _d = _a.showUnderline, showUnderline = _d === void 0 ? true : _d, children = _a.children, onClick = _a.onClick, ariaControls = _a.ariaControls, _e = _a.disabled, disabled = _e === void 0 ? false : _e, className = _a.className, _f = _a.type, type = _f === void 0 ? 'button' : _f, buttonProps = __rest(_a, ["active", "status", "showUnderline", "children", "onClick", "ariaControls", "disabled", "className", "type"]);
    var isDisabled = disabled || status === 'Disabled';
    return (_jsxs("button", __assign({}, buttonProps, { ref: ref, type: type, className: clsx(styles.tabButton, status === 'Hover' && styles.previewHover, className), onClick: isDisabled ? undefined : onClick, disabled: isDisabled, role: "tab", "aria-selected": active, "aria-disabled": isDisabled || undefined, "aria-controls": ariaControls, tabIndex: active && !isDisabled ? 0 : -1, children: [_jsx("div", { className: styles.wrapper, children: _jsx("span", { className: clsx(styles.label, active && styles.labelActive), children: children }) }), active && showUnderline ? (_jsx("div", { className: styles.underline })) : (_jsx("div", { className: styles.spacer }))] })));
});
