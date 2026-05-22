'use client';
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef, useState } from 'react';
import clsx from 'clsx';
import { FaIcon, FA } from '../primitives/FaIcon';
import { warnIfUnnamed } from './naming';
import styles from './MultiSelectDropdown.module.css';
export var MultiSelectDropdown = function (_a) {
    var label = _a.label, ariaLabel = _a.ariaLabel, ariaLabelledBy = _a.ariaLabelledBy, options = _a.options, value = _a.value, onChange = _a.onChange, _b = _a.placeholder, placeholder = _b === void 0 ? 'Please Select...' : _b, _c = _a.required, required = _c === void 0 ? false : _c, _d = _a.disabled, disabled = _d === void 0 ? false : _d, _e = _a.invalid, invalid = _e === void 0 ? false : _e;
    var _f = useState(false), isOpen = _f[0], setIsOpen = _f[1];
    var _g = useState(-1), activeIndex = _g[0], setActiveIndex = _g[1];
    var ref = useRef(null);
    var triggerRef = useRef(null);
    var listboxId = useId();
    var labelId = useId();
    var valueId = useId();
    var activeOptionId = activeIndex >= 0 ? "".concat(listboxId, "-option-").concat(activeIndex) : undefined;
    var selectedOptions = options.filter(function (option) { return value.includes(option.value); });
    warnIfUnnamed('Orbit MultiSelectDropdown', label, ariaLabel, ariaLabelledBy);
    useEffect(function () {
        var handleClick = function (event) {
            if (ref.current && !ref.current.contains(event.target))
                setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return function () { return document.removeEventListener('mousedown', handleClick); };
    }, []);
    var toggleValue = function (nextValue) {
        if (value.includes(nextValue)) {
            onChange(value.filter(function (existing) { return existing !== nextValue; }));
            return;
        }
        onChange(__spreadArray(__spreadArray([], value, true), [nextValue], false));
    };
    var handleKeyDown = function (event) {
        var _a;
        if (disabled)
            return;
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setIsOpen(true);
            setActiveIndex(function (prev) {
                if (options.length === 0)
                    return -1;
                return Math.min(prev < 0 ? 0 : prev + 1, options.length - 1);
            });
        }
        else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setIsOpen(true);
            setActiveIndex(function (prev) {
                if (options.length === 0)
                    return -1;
                return Math.max(prev < 0 ? options.length - 1 : prev - 1, 0);
            });
        }
        else if (event.key === 'Home' && isOpen) {
            event.preventDefault();
            setActiveIndex(options.length > 0 ? 0 : -1);
        }
        else if (event.key === 'End' && isOpen) {
            event.preventDefault();
            setActiveIndex(options.length > 0 ? options.length - 1 : -1);
        }
        else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (isOpen && activeIndex >= 0)
                toggleValue(options[activeIndex].value);
            else
                setIsOpen(true);
        }
        else if (event.key === 'Escape') {
            event.preventDefault();
            setIsOpen(false);
            (_a = triggerRef.current) === null || _a === void 0 ? void 0 : _a.focus();
        }
    };
    var triggerLabelledBy = label ? "".concat(labelId, " ").concat(valueId) : ariaLabelledBy ? "".concat(ariaLabelledBy, " ").concat(valueId) : undefined;
    var triggerAriaLabel = label || ariaLabelledBy || !ariaLabel ? undefined : "".concat(ariaLabel, " ").concat(selectedOptions.map(function (option) { return option.label; }).join(', ') || placeholder);
    var listboxLabelledBy = label ? labelId : ariaLabelledBy;
    var listboxAriaLabel = listboxLabelledBy ? undefined : ariaLabel;
    return (_jsxs("div", { ref: ref, className: styles.container, children: [label && (_jsxs("div", { className: styles.labelRow, children: [_jsx("span", { id: labelId, className: styles.labelText, children: label }), required && _jsx("span", { className: styles.required, "aria-hidden": "true", children: "*" })] })), _jsxs("div", { ref: triggerRef, className: clsx(styles.trigger, isOpen && styles.triggerOpen, invalid && styles.triggerError, disabled && styles.triggerDisabled), role: "combobox", tabIndex: disabled ? -1 : 0, "aria-haspopup": "listbox", "aria-expanded": isOpen, "aria-controls": isOpen ? listboxId : undefined, "aria-labelledby": triggerLabelledBy, "aria-label": triggerAriaLabel, "aria-invalid": invalid || undefined, "aria-required": required || undefined, "aria-activedescendant": isOpen ? activeOptionId : undefined, "aria-disabled": disabled || undefined, onClick: function () {
                    if (!disabled)
                        setIsOpen(function (open) { return !open; });
                }, onKeyDown: handleKeyDown, children: [_jsx("span", { id: valueId, className: styles.value, children: selectedOptions.length > 0 ? (selectedOptions.map(function (option) { return (_jsxs("span", { className: styles.chip, children: [_jsx("span", { children: option.label }), _jsx("button", { type: "button", className: styles.chipRemove, "aria-label": "Remove ".concat(option.label), disabled: disabled, onClick: function (event) {
                                        event.stopPropagation();
                                        toggleValue(option.value);
                                    }, children: _jsx(FaIcon, { icon: FA.xmark, size: 8, color: "currentColor" }) })] }, option.value)); })) : (_jsx("span", { className: styles.placeholder, children: placeholder })) }), _jsx("span", { className: styles.chevron, "aria-hidden": "true", children: _jsx(FaIcon, { icon: isOpen ? FA.angleUp : FA.angleDown, size: 12, color: "currentColor" }) })] }), isOpen && (_jsx("div", { className: styles.overlay, role: "listbox", id: listboxId, "aria-multiselectable": "true", "aria-labelledby": listboxLabelledBy, "aria-label": listboxAriaLabel, children: options.map(function (option, index) { return (_jsxs("div", { id: "".concat(listboxId, "-option-").concat(index), role: "option", "aria-selected": value.includes(option.value), className: clsx(styles.option, value.includes(option.value) && styles.optionSelected, activeIndex === index && styles.optionActive), onMouseDown: function (event) { return event.preventDefault(); }, onMouseEnter: function () { return setActiveIndex(index); }, onClick: function () { return toggleValue(option.value); }, children: [_jsx("span", { children: option.label }), value.includes(option.value) && _jsx(FaIcon, { icon: FA.check, size: 12, color: "currentColor" })] }, option.value)); }) }))] }));
};
