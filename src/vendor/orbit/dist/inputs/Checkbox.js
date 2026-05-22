'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from 'react';
import clsx from 'clsx';
import { FaIcon, FA } from '../primitives/FaIcon';
import styles from './Checkbox.module.css';
export var Checkbox = function (_a) {
    var checked = _a.checked, _b = _a.state, state = _b === void 0 ? 'Active' : _b, _c = _a.alignment, alignment = _c === void 0 ? 'Left' : _c, label = _a.label, _d = _a.ariaLabel, ariaLabel = _d === void 0 ? 'Checkbox' : _d, onChange = _a.onChange;
    var isDisabled = state === 'Disabled';
    var inputId = useId();
    return (_jsxs("label", { htmlFor: inputId, className: clsx(styles.container, alignment === 'Right' && styles.containerRight, isDisabled && styles.containerDisabled), children: [_jsx("input", { type: "checkbox", id: inputId, checked: checked, disabled: isDisabled, onChange: function () { return !isDisabled && onChange(!checked); }, onKeyDown: function (event) {
                    if (event.key === 'Enter' && !isDisabled) {
                        event.preventDefault();
                        onChange(!checked);
                    }
                }, className: styles.hiddenInput, "aria-label": label ? undefined : ariaLabel }), _jsx("span", { className: clsx(styles.box, checked && styles.boxChecked, state === 'Hover' && styles.boxHover, isDisabled && styles.boxDisabled), "aria-hidden": "true", children: checked && (_jsx(FaIcon, { icon: FA.check, size: 10, color: "var(--orbit-color-white)" })) }), label && (_jsx("span", { className: clsx(styles.label, isDisabled && styles.labelDisabled), children: label }))] }));
};
