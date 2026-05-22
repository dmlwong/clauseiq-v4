'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useState } from 'react';
import clsx from 'clsx';
import styles from './CurrencyInput.module.css';
import { warnIfUnnamed } from './naming';
export var CurrencyInput = function (_a) {
    var label = _a.label, ariaLabel = _a.ariaLabel, ariaLabelledBy = _a.ariaLabelledBy, message = _a.message, _b = _a.placeholder, placeholder = _b === void 0 ? 'Enter text' : _b, value = _a.value, onChange = _a.onChange, _c = _a.currency, currency = _c === void 0 ? 'GBP' : _c, _d = _a.required, required = _d === void 0 ? false : _d, _e = _a.disabled, disabled = _e === void 0 ? false : _e, _f = _a.invalid, invalid = _f === void 0 ? false : _f, previewState = _a.previewState;
    var inputId = useId();
    var messageId = useId();
    var _g = useState(false), focused = _g[0], setFocused = _g[1];
    var currentState = focused && !disabled ? 'focus' : previewState;
    var isFocused = currentState === 'focus' && !disabled;
    var isFilled = Boolean(value);
    warnIfUnnamed('Orbit CurrencyInput', label, ariaLabel, ariaLabelledBy);
    return (_jsxs("div", { className: styles.container, children: [label && (_jsxs("label", { htmlFor: inputId, className: styles.labelRow, children: [_jsx("span", { className: clsx(styles.labelText, isFocused && styles.labelFocused, invalid && styles.labelError), children: label }), required && _jsx("span", { className: styles.required, children: "*" })] })), _jsxs("div", { className: clsx(styles.box, isFocused && styles.boxFocused, currentState === 'hover' && styles.boxHover, invalid && styles.boxError, disabled && styles.boxDisabled), children: [_jsx("input", { id: inputId, type: "text", className: clsx(styles.input, isFilled && styles.inputFilled), value: value, onChange: function (e) { return onChange(e.target.value); }, placeholder: placeholder, disabled: disabled, "aria-label": label || ariaLabelledBy ? undefined : ariaLabel, "aria-labelledby": label ? undefined : ariaLabelledBy, "aria-describedby": message ? messageId : undefined, "aria-invalid": invalid || undefined, "aria-required": required || undefined, required: required, onFocus: function () { return setFocused(true); }, onBlur: function () { return setFocused(false); } }), _jsx("span", { className: clsx(styles.currency, disabled && styles.currencyDisabled), children: currency })] }), message && (_jsx("span", { id: messageId, className: clsx(styles.message, invalid && styles.messageError), children: message }))] }));
};
