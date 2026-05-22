'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import clsx from 'clsx';
import { FaIcon } from '../primitives/FaIcon';
import styles from './DateInput.module.css';
import { warnIfUnnamed } from './naming';
export var DateInput = function (_a) {
    var value = _a.value, onChange = _a.onChange, _b = _a.placeholder, placeholder = _b === void 0 ? 'yy-mm-dd' : _b, ariaLabel = _a.ariaLabel, ariaLabelledBy = _a.ariaLabelledBy, _c = _a.disabled, disabled = _c === void 0 ? false : _c, _d = _a.invalid, invalid = _d === void 0 ? false : _d, previewState = _a.previewState;
    var _e = useState(false), focused = _e[0], setFocused = _e[1];
    var currentState = focused && !disabled ? 'focus' : previewState;
    var isFilled = Boolean(value);
    warnIfUnnamed('Orbit DateInput', undefined, ariaLabel, ariaLabelledBy);
    var getIconColor = function () {
        if (disabled)
            return 'var(--orbit-color-btn-secondary-icon-disabled)';
        return 'var(--orbit-color-btn-secondary-icon)';
    };
    return (_jsxs("div", { className: clsx(styles.container, currentState === 'focus' && styles.containerFocused, currentState === 'hover' && styles.containerHover, invalid && styles.containerError, disabled && styles.containerDisabled), children: [_jsx("input", { type: "text", "aria-label": ariaLabelledBy ? undefined : ariaLabel, "aria-labelledby": ariaLabelledBy, value: value, onChange: function (e) { return onChange(e.target.value); }, placeholder: placeholder, disabled: disabled, "aria-invalid": invalid || undefined, onFocus: function () { return setFocused(true); }, onBlur: function () { return setFocused(false); }, className: clsx(styles.input, isFilled && styles.inputFilled) }), _jsx("span", { className: clsx(styles.iconButton, currentState === 'focus' && styles.iconButtonFocused, invalid && styles.iconButtonError, disabled && styles.iconButtonDisabled), children: _jsx("span", { className: styles.iconInner, children: _jsx(FaIcon, { icon: '\uf073', size: 12, color: getIconColor() }) }) })] }));
};
