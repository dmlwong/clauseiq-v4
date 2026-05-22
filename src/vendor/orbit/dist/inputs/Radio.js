'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useId } from 'react';
import clsx from 'clsx';
import styles from './Radio.module.css';
export var Radio = function (_a) {
    var checked = _a.checked, _b = _a.state, state = _b === void 0 ? 'Active' : _b, _c = _a.alignment, alignment = _c === void 0 ? 'Left' : _c, label = _a.label, _d = _a.ariaLabel, ariaLabel = _d === void 0 ? 'Radio' : _d, name = _a.name, value = _a.value, onChange = _a.onChange, onKeyDown = _a.onKeyDown;
    var inputId = useId();
    var isDisabled = state === 'Disabled';
    var isError = state === 'Error';
    return (_jsxs("label", { htmlFor: inputId, className: clsx(styles.container, alignment === 'Right' && styles.containerRight, isDisabled && styles.containerDisabled), children: [_jsx("input", { type: "radio", id: inputId, name: name, value: value, checked: checked, disabled: isDisabled, onChange: function () {
                    if (!isDisabled)
                        onChange(value);
                }, onKeyDown: onKeyDown, className: styles.hiddenInput, "aria-label": label ? undefined : ariaLabel, "aria-invalid": isError || undefined }), _jsx("span", { className: clsx(styles.dot, checked && styles.dotChecked, state === 'Hover' && styles.dotHover, isError && styles.dotError, isDisabled && styles.dotDisabled), "aria-hidden": "true" }), label && (_jsx("span", { className: clsx(styles.label, isDisabled && styles.labelDisabled), children: label }))] }));
};
export var RadioGroup = function (_a) {
    var value = _a.value, name = _a.name, ariaLabel = _a.ariaLabel, onChange = _a.onChange, children = _a.children;
    var radios = React.Children.toArray(children).filter((React.isValidElement));
    var enabledValues = radios
        .filter(function (child) { return child.props.state !== 'Disabled'; })
        .map(function (child) { return child.props.value; });
    var handleKeyDown = function (event) {
        if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key))
            return;
        if (enabledValues.length === 0)
            return;
        event.preventDefault();
        var currentIndex = Math.max(enabledValues.indexOf(value), 0);
        var direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
        var nextIndex = (currentIndex + direction + enabledValues.length) % enabledValues.length;
        var nextValue = enabledValues[nextIndex];
        if (nextValue)
            onChange(nextValue);
    };
    return (_jsx("div", { role: "radiogroup", "aria-label": ariaLabel, className: styles.group, children: React.Children.map(children, function (child) {
            if (!React.isValidElement(child))
                return child;
            return React.cloneElement(child, {
                name: name,
                checked: child.props.value === value,
                onChange: onChange,
                onKeyDown: function (event) {
                    var _a, _b;
                    (_b = (_a = child.props).onKeyDown) === null || _b === void 0 ? void 0 : _b.call(_a, event);
                    if (!event.defaultPrevented)
                        handleKeyDown(event);
                },
            });
        }) }));
};
