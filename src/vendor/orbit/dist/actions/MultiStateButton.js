'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import clsx from 'clsx';
import { FaIcon } from '../primitives/FaIcon';
import { Badge } from '../indicators/Badge';
import styles from './MultiStateButton.module.css';
export var MultiStateButton = function (_a) {
    var label = _a.label, _b = _a.selected, selected = _b === void 0 ? false : _b, _c = _a.disabled, disabled = _c === void 0 ? false : _c, onClick = _a.onClick, leftIcon = _a.leftIcon, rightIcon = _a.rightIcon, count = _a.count, tabIndex = _a.tabIndex;
    return (_jsxs("button", { type: "button", role: "tab", "aria-selected": selected, disabled: disabled, tabIndex: disabled ? -1 : tabIndex !== null && tabIndex !== void 0 ? tabIndex : 0, onClick: disabled ? undefined : onClick, className: clsx(styles.button, selected && styles.selected), children: [leftIcon && (_jsx("span", { className: styles.iconSlot, children: _jsx(FaIcon, { icon: leftIcon, size: 12, color: "var(--orbit-color-dove-gray)" }) })), _jsx("span", { className: styles.label, children: label }), count !== undefined && _jsx(Badge, { label: String(count), status: "Green" }), rightIcon && (_jsx("span", { className: styles.iconSlot, children: _jsx(FaIcon, { icon: rightIcon, size: 12, color: "var(--orbit-color-dove-gray)" }) }))] }));
};
export var MultiStateGroup = function (_a) {
    var _b, _c;
    var children = _a.children, _d = _a.ariaLabel, ariaLabel = _d === void 0 ? 'Options' : _d, value = _a.value, defaultValue = _a.defaultValue, onValueChange = _a.onValueChange;
    var _e = React.useState(defaultValue), uncontrolledValue = _e[0], setUncontrolledValue = _e[1];
    var isControlled = value !== undefined;
    var selectedValue = isControlled ? value : uncontrolledValue;
    var validChildren = React.Children.toArray(children).filter(function (child) { return React.isValidElement(child); });
    var enabledChildren = validChildren.filter(function (child) { return !child.props.disabled; });
    var selectedEnabledChild = enabledChildren.find(function (child) { return child.props.value === selectedValue; });
    var tabbableValue = (_b = selectedEnabledChild === null || selectedEnabledChild === void 0 ? void 0 : selectedEnabledChild.props.value) !== null && _b !== void 0 ? _b : (_c = enabledChildren[0]) === null || _c === void 0 ? void 0 : _c.props.value;
    var handleSelection = function (nextValue, childOnClick) {
        if (!isControlled)
            setUncontrolledValue(nextValue);
        onValueChange === null || onValueChange === void 0 ? void 0 : onValueChange(nextValue);
        childOnClick === null || childOnClick === void 0 ? void 0 : childOnClick();
    };
    var handleKeyDown = function (event) {
        var _a;
        if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key))
            return;
        var tabs = Array.from(event.currentTarget.querySelectorAll('[role="tab"]:not(:disabled)'));
        var currentIndex = tabs.indexOf(document.activeElement);
        if (tabs.length === 0 || currentIndex === -1)
            return;
        event.preventDefault();
        var nextIndex = event.key === 'Home'
            ? 0
            : event.key === 'End'
                ? tabs.length - 1
                : event.key === 'ArrowRight' || event.key === 'ArrowDown'
                    ? (currentIndex + 1) % tabs.length
                    : (currentIndex - 1 + tabs.length) % tabs.length;
        (_a = tabs[nextIndex]) === null || _a === void 0 ? void 0 : _a.focus();
    };
    return (_jsx("div", { role: "tablist", "aria-label": ariaLabel, className: styles.group, onKeyDown: handleKeyDown, children: React.Children.map(children, function (child) {
            if (!React.isValidElement(child))
                return child;
            var childValue = child.props.value;
            var childDisabled = child.props.disabled;
            return React.cloneElement(child, {
                selected: selectedValue === childValue,
                tabIndex: !childDisabled && childValue === tabbableValue ? 0 : -1,
                onClick: childDisabled ? undefined : function () { return handleSelection(childValue, child.props.onClick); },
            });
        }) }));
};
