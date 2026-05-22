'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useState } from 'react';
import clsx from 'clsx';
import styles from './Input.module.css';
import { warnIfUnnamed } from './naming';
export var Input = function (_a) {
    var placeholder = _a.placeholder, value = _a.value, onChange = _a.onChange, icon = _a.icon, externalStyle = _a.style, id = _a.id, ariaLabel = _a.ariaLabel, ariaLabelledBy = _a.ariaLabelledBy, _b = _a.required, required = _b === void 0 ? false : _b, _c = _a.disabled, disabled = _c === void 0 ? false : _c, _d = _a.invalid, invalid = _d === void 0 ? false : _d, previewState = _a.previewState;
    var generatedId = useId();
    var inputId = id || generatedId;
    var _e = useState(false), isFocused = _e[0], setIsFocused = _e[1];
    var isFocusedState = (isFocused || previewState === 'focus') && !disabled;
    var isHoverState = previewState === 'hover' && !disabled;
    var isFilled = Boolean(value);
    var accessibleName = ariaLabelledBy ? undefined : ariaLabel;
    warnIfUnnamed('Orbit Input', undefined, ariaLabel, ariaLabelledBy);
    return (_jsxs("div", { className: clsx(styles.container, isFocusedState && styles.containerFocused, isHoverState && styles.containerHover, invalid && styles.containerError, disabled && styles.containerDisabled), style: externalStyle, children: [icon && (_jsx("span", { className: clsx(styles.icon, disabled && styles.iconDisabled), children: icon })), _jsx("input", { id: inputId, className: clsx(styles.input, isFilled && styles.inputFilled), placeholder: placeholder, value: value, onChange: function (e) { return onChange(e.target.value); }, disabled: disabled, "aria-label": accessibleName, "aria-labelledby": ariaLabelledBy, "aria-invalid": invalid || undefined, "aria-required": required || undefined, required: required, onFocus: function () { return setIsFocused(true); }, onBlur: function () { return setIsFocused(false); } })] }));
};
