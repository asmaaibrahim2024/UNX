import React from 'react';
import { Tooltip } from "app/components/mgComponents";

import PropTypes from 'prop-types';
import { Checkbox } from 'antd';

import './Checkbox.scss';

/**
 * A Basic Switch/Toggle common component made by Ant.design
 * {@link https://ant.design/components/checkbox Checkbox Antdesign}
 * {@link https://designsystemchecklist.com/category/core-components/ Revise Input Swith in designsystemchecklist.com when implementing}
 * @param {boolean} disabled false => Disables the switch
 * @param {boolean} checked false => sets the checked state
 * @param {string} size "default" or "small"
 * @param {string | @ant-design/icons} checkedChildren This can be a string or icon to show when checked
 * @param {string | @ant-design/icons} unCheckedChildren This can be a string or icon to show when unchecked
 * @param {string} className additional class to the tag
 * @param {function} onChange function triggerd when check changes
 * @param {object} style inline style object
 */
const onChange = (e) => {
  //  console.log(`checked = ${e.target.checked}`);
};
const AppCheckBox = ({
    label,
    disabled,
    checked,
    size,
    checkedChildren,
    unCheckedChildren,
    className,
    onChange,
    style,
    title,
    ...restProps
}) => {
    return (
        <Tooltip title={title}>
            <Checkbox
                label={title}
                disabled={disabled}
                checked={checked}
                size={size}
                checkedChildren={checkedChildren}
                unCheckedChildren={unCheckedChildren}
                className={className}
                onChange={onChange}
                style={style}
                {...restProps}>test</Checkbox>
        </Tooltip>
    );
};

AppCheckBox.propTypes = {
  disabled: PropTypes.bool,
  checked: PropTypes.bool,
  size: PropTypes.string,
  checkedChildren: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  unCheckedChildren: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  className: PropTypes.string,
  onChange: PropTypes.func,
};

AppCheckBox.defaultProps = {
    disabled: false,
    checked: true,
    size: 'default',
    label: ''
};

export default React.memo(AppCheckBox);
