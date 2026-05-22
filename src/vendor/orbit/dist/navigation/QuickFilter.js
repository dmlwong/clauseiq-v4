'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import clsx from 'clsx';
import { FaIcon } from '../primitives/FaIcon';
import styles from './QuickFilter.module.css';
export var QuickFilterItem = function (_a) {
    var label = _a.label, _b = _a.selected, selected = _b === void 0 ? false : _b, _c = _a.disabled, disabled = _c === void 0 ? false : _c, onClick = _a.onClick, leftIcon = _a.leftIcon, rightIcon = _a.rightIcon;
    var iconColor = selected
        ? 'var(--orbit-color-efficio-blue)'
        : 'var(--orbit-color-dove-gray)';
    return (_jsxs("button", { type: "button", "aria-pressed": selected, disabled: disabled, onClick: disabled ? undefined : onClick, className: clsx(styles.item, selected && styles.selected), children: [leftIcon && _jsx(FaIcon, { icon: leftIcon, size: 12, color: iconColor }), _jsx("span", { className: styles.itemLabel, children: label }), rightIcon && _jsx(FaIcon, { icon: rightIcon, size: 12, color: iconColor })] }));
};
export var QuickFilterGroup = function (_a) {
    var children = _a.children, _b = _a.ariaLabel, ariaLabel = _b === void 0 ? 'Quick filters' : _b;
    var handleKeyDown = function (event) {
        var _a;
        if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key))
            return;
        var options = Array.from(event.currentTarget.querySelectorAll('button:not(:disabled)'));
        var currentIndex = options.indexOf(document.activeElement);
        if (options.length === 0 || currentIndex === -1)
            return;
        event.preventDefault();
        var nextIndex = event.key === 'Home'
            ? 0
            : event.key === 'End'
                ? options.length - 1
                : event.key === 'ArrowRight' || event.key === 'ArrowDown'
                    ? (currentIndex + 1) % options.length
                    : (currentIndex - 1 + options.length) % options.length;
        (_a = options[nextIndex]) === null || _a === void 0 ? void 0 : _a.focus();
    };
    return (_jsx("div", { role: "toolbar", "aria-label": ariaLabel, className: styles.group, onKeyDown: handleKeyDown, children: children }));
};
