'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useState } from 'react';
import clsx from 'clsx';
import styles from './TextArea.module.css';
import { warnIfUnnamed } from './naming';
export var TextArea = function (_a) {
    var label = _a.label, ariaLabel = _a.ariaLabel, ariaLabelledBy = _a.ariaLabelledBy, message = _a.message, _b = _a.placeholder, placeholder = _b === void 0 ? 'Enter text' : _b, value = _a.value, onChange = _a.onChange, _c = _a.maxLength, maxLength = _c === void 0 ? 250 : _c, _d = _a.required, required = _d === void 0 ? false : _d, _e = _a.disabled, disabled = _e === void 0 ? false : _e, _f = _a.invalid, invalid = _f === void 0 ? false : _f, previewState = _a.previewState, _g = _a.rows, rows = _g === void 0 ? 3 : _g;
    var inputId = useId();
    var messageId = useId();
    var _h = useState(false), focused = _h[0], setFocused = _h[1];
    var currentState = focused && !disabled ? 'focus' : previewState;
    var isFilled = Boolean(value);
    warnIfUnnamed('Orbit TextArea', label, ariaLabel, ariaLabelledBy);
    return (_jsxs("div", { className: styles.wrapper, children: [label && (_jsxs("label", { htmlFor: inputId, className: styles.label, children: [_jsx("span", { className: styles.labelText, children: label }), required && _jsx("span", { className: styles.required, children: "*" })] })), _jsx("textarea", { id: inputId, value: value, onChange: function (e) { return onChange(e.target.value.slice(0, maxLength)); }, placeholder: placeholder, disabled: disabled, rows: rows, "aria-label": label || ariaLabelledBy ? undefined : ariaLabel, "aria-labelledby": label ? undefined : ariaLabelledBy, onFocus: function () { return setFocused(true); }, onBlur: function () { return setFocused(false); }, className: clsx(styles.textarea, currentState === 'focus' && styles.textareaFocused, currentState === 'hover' && styles.textareaHover, invalid && styles.textareaError, disabled && styles.textareaDisabled, isFilled && styles.textareaFilled), "aria-describedby": message ? messageId : undefined, "aria-invalid": invalid || undefined, "aria-required": required || undefined, required: required }), _jsxs("div", { className: styles.footer, children: [message && (_jsx("span", { id: messageId, className: clsx(styles.message, invalid && styles.messageError), children: message })), _jsxs("span", { className: styles.charCount, children: [value.length, "/", maxLength] })] })] }));
};
