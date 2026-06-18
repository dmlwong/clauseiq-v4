'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import clsx from 'clsx';
import styles from './ToggleCard.module.css';
export var ToggleCard = React.forwardRef(function ToggleCard(_a, ref) {
    var _b = _a.status, status = _b === void 0 ? 'Default' : _b, onClick = _a.onClick, children = _a.children, className = _a.className, style = _a.style, disabled = _a.disabled, props = Object.assign({}, _a);
    delete props.status;
    delete props.onClick;
    delete props.children;
    delete props.className;
    delete props.style;
    delete props.disabled;
    var isDisabled = status === 'Disabled' || disabled;
    return (_jsx("button", Object.assign({}, props, { ref: ref, type: "button", className: clsx(styles.toggleCard, status === 'Hover' && styles.hover, status === 'Selected' && styles.selected, isDisabled && styles.disabled, className), style: style, disabled: isDisabled, onClick: onClick, children: children })));
});
ToggleCard.displayName = 'ToggleCard';
