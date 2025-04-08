import React from 'react';
import { Switch } from "app/components/externalComponents";
import { Tooltip } from "app/components/mgComponents";

import PropTypes from 'prop-types';

import './SwitchButton.scss';

/**
 * A Basic Switch/Toggle common component made by Ant.design
 * {@link https://ant.design/components/switch/ Switch Antdesign}
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
const SwitchButton = ({
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
      <Switch
        disabled={disabled}
        checked={checked}
        size={size}
        checkedChildren={checkedChildren}
        unCheckedChildren={unCheckedChildren}
        className={className}
        onChange={onChange}
        style={style}
        {...restProps}
      />
    </Tooltip>
  );
};

SwitchButton.propTypes = {
  disabled: PropTypes.bool,
  checked: PropTypes.bool,
  size: PropTypes.string,
  checkedChildren: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  unCheckedChildren: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  className: PropTypes.string,
  onChange: PropTypes.func,
};
SwitchButton.defaultProps = {
  disabled: false,
  checked: false,
  size: 'default',
};

export default React.memo(SwitchButton);
