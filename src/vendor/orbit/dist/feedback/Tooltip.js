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
import React, { useState, useId } from 'react';
import clsx from 'clsx';
import styles from './Tooltip.module.css';
var alignClassMap = {
    start: styles.alignStart,
    center: styles.alignCenter,
    end: styles.alignEnd,
};
export var Tooltip = function (_a) {
    var _b = _a.direction, direction = _b === void 0 ? 'top' : _b, _c = _a.align, align = _c === void 0 ? 'center' : _c, children = _a.children, content = _a.content;
    var _d = useState(false), visible = _d[0], setVisible = _d[1];
    var tooltipId = useId();
    var show = function () { return setVisible(true); };
    var hide = function () { return setVisible(false); };
    var triggerProps = {
        onMouseEnter: show,
        onMouseLeave: hide,
        onFocus: show,
        onBlur: hide,
        'aria-describedby': visible ? tooltipId : undefined,
    };
    var trigger = React.isValidElement(children)
        ? React.cloneElement(children, {
            onMouseEnter: function (event) {
                var _a, _b;
                (_b = (_a = children.props).onMouseEnter) === null || _b === void 0 ? void 0 : _b.call(_a, event);
                show();
            },
            onMouseLeave: function (event) {
                var _a, _b;
                (_b = (_a = children.props).onMouseLeave) === null || _b === void 0 ? void 0 : _b.call(_a, event);
                hide();
            },
            onFocus: function (event) {
                var _a, _b;
                (_b = (_a = children.props).onFocus) === null || _b === void 0 ? void 0 : _b.call(_a, event);
                show();
            },
            onBlur: function (event) {
                var _a, _b;
                (_b = (_a = children.props).onBlur) === null || _b === void 0 ? void 0 : _b.call(_a, event);
                hide();
            },
            'aria-describedby': visible
                ? [children.props['aria-describedby'], tooltipId].filter(Boolean).join(' ')
                : children.props['aria-describedby'],
        })
        : (_jsx("span", __assign({ tabIndex: 0 }, triggerProps, { children: children })));
    return (_jsxs("div", { className: styles.trigger, children: [trigger, visible && (_jsx("div", { id: tooltipId, role: "tooltip", className: clsx(styles.tooltip, styles[direction], alignClassMap[align]), children: content }))] }));
};
