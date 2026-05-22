'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from 'react';
import clsx from 'clsx';
import styles from './Toggle.module.css';
export var Toggle = function (_a) {
    var checked = _a.checked, _b = _a.state, state = _b === void 0 ? 'Active' : _b, _c = _a.alignment, alignment = _c === void 0 ? 'Left' : _c, label = _a.label, _d = _a.ariaLabel, ariaLabel = _d === void 0 ? 'Toggle' : _d, onChange = _a.onChange;
    var isDisabled = state === 'Disabled';
    var inputId = useId();
    return (_jsxs("label", { htmlFor: inputId, className: clsx(styles.container, alignment === 'Right' && styles.containerRight, isDisabled && styles.containerDisabled), children: [_jsx("input", { id: inputId, type: "checkbox", role: "switch", checked: checked, disabled: isDisabled, onChange: function () { return !isDisabled && onChange(!checked); }, onKeyDown: function (event) {
                    if (event.key === 'Enter' && !isDisabled) {
                        event.preventDefault();
                        onChange(!checked);
                    }
                }, className: styles.hiddenInput, "aria-label": label ? undefined : ariaLabel }), _jsx("span", { className: clsx(styles.track, checked && styles.trackChecked, isDisabled && styles.trackDisabled), "aria-hidden": "true", children: _jsx("span", { className: clsx(styles.handle, isDisabled && styles.handleDisabled) }) }), label && (_jsx("span", { className: clsx(styles.label, isDisabled && styles.labelDisabled), children: label }))] }));
};
