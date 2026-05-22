'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useState } from 'react';
import clsx from 'clsx';
import { FaIcon } from '../primitives/FaIcon';
import styles from './Textbox.module.css';
import { warnIfUnnamed } from './naming';
export var Textbox = function (_a) {
    var label = _a.label, ariaLabel = _a.ariaLabel, ariaLabelledBy = _a.ariaLabelledBy, message = _a.message, _b = _a.placeholder, placeholder = _b === void 0 ? 'Enter text' : _b, value = _a.value, onChange = _a.onChange, _c = _a.required, required = _c === void 0 ? false : _c, _d = _a.disabled, disabled = _d === void 0 ? false : _d, _e = _a.invalid, invalid = _e === void 0 ? false : _e, _f = _a.locked, locked = _f === void 0 ? false : _f, previewState = _a.previewState;
    var inputId = useId();
    var messageId = useId();
    var _g = useState(false), focused = _g[0], setFocused = _g[1];
    var isDisabled = disabled || locked;
    var currentState = focused && !isDisabled ? 'focus' : previewState;
    var isFilled = Boolean(value);
    warnIfUnnamed('Orbit Textbox', label, ariaLabel, ariaLabelledBy);
    return (_jsxs("div", { className: styles.wrapper, children: [label && (_jsxs("label", { htmlFor: inputId, className: styles.label, children: [_jsx("span", { className: styles.labelText, children: label }), required && _jsx("span", { className: styles.required, children: "*" })] })), _jsxs("div", { className: clsx(styles.inputContainer, currentState === 'focus' && styles.inputContainerFocused, currentState === 'hover' && styles.inputContainerHover, invalid && styles.inputContainerError, isDisabled && styles.inputContainerDisabled, locked && styles.inputContainerLocked), children: [_jsx("input", { id: inputId, type: "text", value: value, onChange: function (e) { return onChange(e.target.value); }, placeholder: placeholder, disabled: isDisabled, "aria-label": label || ariaLabelledBy ? undefined : ariaLabel, "aria-labelledby": label ? undefined : ariaLabelledBy, "aria-describedby": message ? messageId : undefined, "aria-invalid": invalid || undefined, "aria-required": required || undefined, required: required, onFocus: function () { return setFocused(true); }, onBlur: function () { return setFocused(false); }, className: clsx(styles.input, isFilled && styles.inputFilled) }), locked && (_jsx("span", { className: styles.lockIcon, children: _jsx(FaIcon, { icon: '\uf023', size: 12, color: "var(--orbit-color-btn-secondary-icon)" }) }))] }), message && (_jsx("span", { id: messageId, className: clsx(styles.message, invalid && styles.messageError), children: message }))] }));
};
