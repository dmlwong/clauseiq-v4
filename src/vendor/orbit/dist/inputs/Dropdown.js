'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect, useId } from 'react';
import clsx from 'clsx';
import styles from './Dropdown.module.css';
import { FaIcon } from '../primitives/FaIcon';
import { warnIfUnnamed } from './naming';
export var Dropdown = function (_a) {
    var _b;
    var label = _a.label, ariaLabel = _a.ariaLabel, ariaLabelledBy = _a.ariaLabelledBy, message = _a.message, _c = _a.placeholder, placeholder = _c === void 0 ? 'Please Select...' : _c, options = _a.options, value = _a.value, onChange = _a.onChange, _d = _a.required, required = _d === void 0 ? false : _d, _e = _a.disabled, disabled = _e === void 0 ? false : _e, _f = _a.invalid, invalid = _f === void 0 ? false : _f, previewState = _a.previewState;
    var _g = useState(false), isOpen = _g[0], setIsOpen = _g[1];
    var _h = useState(-1), activeIndex = _h[0], setActiveIndex = _h[1];
    var ref = useRef(null);
    var triggerRef = useRef(null);
    var listboxId = useId();
    var labelId = useId();
    var valueId = useId();
    var messageId = useId();
    var isFocusedPreview = previewState === 'focus';
    var isHoverPreview = previewState === 'hover';
    useEffect(function () {
        var handleClick = function (e) {
            if (ref.current && !ref.current.contains(e.target))
                setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return function () { return document.removeEventListener('mousedown', handleClick); };
    }, []);
    useEffect(function () {
        if (isOpen) {
            var idx = options.findIndex(function (o) { return o.value === value; });
            setActiveIndex(idx >= 0 ? idx : options.length > 0 ? 0 : -1);
        }
    }, [isOpen, options, value]);
    var selectOption = function (index) {
        var _a;
        if (index < 0 || index >= options.length)
            return;
        onChange(options[index].value);
        setIsOpen(false);
        (_a = triggerRef.current) === null || _a === void 0 ? void 0 : _a.focus();
    };
    var handleTriggerKeyDown = function (e) {
        var _a;
        if (disabled)
            return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setIsOpen(true);
            setActiveIndex(function (prev) {
                if (options.length === 0)
                    return -1;
                return Math.min(prev < 0 ? 0 : prev + 1, options.length - 1);
            });
        }
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setIsOpen(true);
            setActiveIndex(function (prev) {
                if (options.length === 0)
                    return -1;
                return Math.max(prev < 0 ? options.length - 1 : prev - 1, 0);
            });
        }
        else if (e.key === 'Home' && isOpen) {
            e.preventDefault();
            setActiveIndex(options.length > 0 ? 0 : -1);
        }
        else if (e.key === 'End' && isOpen) {
            e.preventDefault();
            setActiveIndex(options.length > 0 ? options.length - 1 : -1);
        }
        else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (isOpen)
                selectOption(activeIndex);
            else
                setIsOpen(true);
        }
        else if (e.key === 'Escape') {
            e.preventDefault();
            setIsOpen(false);
            (_a = triggerRef.current) === null || _a === void 0 ? void 0 : _a.focus();
        }
    };
    var selectedLabel = (_b = options.find(function (o) { return o.value === value; })) === null || _b === void 0 ? void 0 : _b.label;
    var activeOptionId = activeIndex >= 0 ? "".concat(listboxId, "-option-").concat(activeIndex) : undefined;
    var visibleValue = selectedLabel || placeholder;
    var triggerLabelledBy = label ? "".concat(labelId, " ").concat(valueId) : ariaLabelledBy ? "".concat(ariaLabelledBy, " ").concat(valueId) : undefined;
    var triggerAriaLabel = label || ariaLabelledBy || !ariaLabel ? undefined : "".concat(ariaLabel, " ").concat(visibleValue);
    var listboxLabelledBy = label ? labelId : ariaLabelledBy;
    var listboxAriaLabel = listboxLabelledBy ? undefined : ariaLabel;
    var describedBy = message ? messageId : undefined;
    warnIfUnnamed('Orbit Dropdown', label, ariaLabel, ariaLabelledBy);
    return (_jsxs("div", { ref: ref, className: styles.container, children: [label && (_jsxs("div", { className: styles.labelRow, children: [_jsx("span", { id: labelId, className: styles.labelText, children: label }), required && _jsx("span", { className: styles.required, "aria-hidden": "true", children: "*" })] })), _jsxs("button", { type: "button", className: clsx(styles.trigger, (isOpen || isFocusedPreview) && styles.triggerOpen, isHoverPreview && styles.triggerHover, invalid && styles.triggerError), onClick: function () { return !disabled && setIsOpen(!isOpen); }, disabled: disabled, "aria-haspopup": "listbox", "aria-expanded": isOpen, "aria-controls": isOpen ? listboxId : undefined, "aria-labelledby": triggerLabelledBy, "aria-label": triggerAriaLabel, "aria-describedby": describedBy, "aria-invalid": invalid || undefined, "aria-required": required || undefined, "aria-activedescendant": isOpen ? activeOptionId : undefined, onKeyDown: handleTriggerKeyDown, ref: triggerRef, children: [_jsx("span", { id: valueId, className: clsx(styles.triggerValue, selectedLabel ? styles.filled : disabled ? styles.disabledText : styles.placeholder), children: selectedLabel || placeholder }), _jsx("span", { className: styles.chevron, children: _jsx(FaIcon, { icon: isOpen ? '\uf077' : '\uf078', size: 12, color: disabled ? 'var(--orbit-color-btn-secondary-icon-disabled)' : 'var(--orbit-color-btn-secondary-icon)' }) })] }), message && (_jsx("span", { id: messageId, className: clsx(styles.message, invalid && styles.messageError), children: message })), isOpen && (_jsx("div", { className: styles.overlay, role: "listbox", id: listboxId, "aria-labelledby": listboxLabelledBy, "aria-label": listboxAriaLabel, "aria-activedescendant": activeOptionId, children: options.map(function (option, i) { return (_jsx("div", { id: "".concat(listboxId, "-option-").concat(i), role: "option", "aria-selected": value === option.value, className: clsx(styles.option, value === option.value && styles.optionSelected, activeIndex === i && styles.optionActive), onMouseDown: function (event) { return event.preventDefault(); }, onClick: function () { return selectOption(i); }, onMouseEnter: function () { return setActiveIndex(i); }, children: option.label }, option.value)); }) }))] }));
};
