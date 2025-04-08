import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Menu,
  MenuItem,
  Dropdown,
} from "app/components/externalComponents";
import { Button } from "app/components/mgComponents";
import './MenuList.scss';
const MenuList = ({
  id,
  data,
  disabled,
  icon,
  optionValueField,
  optionLabelField,
  onMenuClick,
  onDropdownClick,
  dropdownBtnTitle,
  imgSrc,
  altText,
  btnClassName,
  activeBtnClassName,
  imgClassName,
  txtClassName,
  MenuIconClassName,
  placement,
  overlayClassName,
  overlayStyle,
  trigger,
  dropdownTitle,
  isMenuDisabled,
}) => {
  const [visible, setVisible] = useState(false);
  const menuButtonRef = useRef();

  const onVisibleChange = () => {
    if (visible) {
      if (onDropdownClick) {
        onDropdownClick();
      }
    }
    setVisible(!visible);
  };

  const handleOnFlexClick = () => {
    setVisible(false);
  };

  useEffect(() => {
    if (visible)
      document
        .querySelectorAll('.flexlayout__tabset ,.flexlayout__splitter')
        .forEach((flex) =>
          flex.addEventListener('mousedown', handleOnFlexClick)
        );

    return () => {
      document
        .querySelectorAll('.flexlayout__tabset ,.flexlayout__flex')
        .forEach((flex) =>
          flex.removeEventListener('mousedown', handleOnFlexClick)
        );
    };
  }, [visible]);

  useEffect(() => {
    if (menuButtonRef.current)
      menuButtonRef.current.addEventListener('keydown', handleKeyDown);

    return () => {
      if (menuButtonRef.current)
        menuButtonRef.current.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleKeyDown = (event) => {
    switch (event.keyCode) {
      case 27:
        event.preventDefault();
        setVisible(false);
        break;
      default:
        break;
    }
  };
  const menuId = `${id}_menu`;
  const menu = (
    <Menu
      onClick={onMenuClick}
      id={menuId}
      aria-controls={menuId}
      aria-owns={menuId}
      aria-activedescendant={menuId}
    >
      {data.map((item, index) => {
        let valueField = index;
        let labelField = item;
        const menuItemIcon = item.icon ? item.icon : icon;
        if (optionLabelField && optionValueField) {
          valueField = item[optionValueField];
          labelField = item[optionLabelField];
        }
        return (
          <MenuItem
            key={valueField}
            disabled={item.disabled || disabled || false}
            icon={
              menuItemIcon ? (
                <img
                  id={`${id}_menuItem_icon`}
                  src={menuItemIcon}
                  alt={altText}
                  className={`menuItem_icon ${MenuIconClassName}`}
                />
              ) : null
            }
            id={`${id}_menuItem${valueField}`}
          >
            {labelField}
          </MenuItem>
        );
      })}
    </Menu>
  );
  return (
    <Dropdown
      overlay={menu}
      trigger={[trigger]}
      id={`${id}_dropdown`}
      placement={placement}
      overlayClassName={`overlayClassName ${overlayClassName}`}
      overlayStyle={overlayStyle}
      onVisibleChange={onVisibleChange}
      visible={visible}
      disabled={isMenuDisabled}
    >
      <Button
        id={`${id}_dropdown`}
        onClick={onVisibleChange}
        imgSrc={imgSrc}
        altText={altText}
        btnClassName={`${btnClassName} ${visible ? activeBtnClassName : ''}`}
        imgClassName={imgClassName}
        txtClassName={txtClassName}
        title={dropdownTitle}
        ref={(node) => {
          menuButtonRef.current = node;
          return menuButtonRef.current;
        }}
      >
        {dropdownBtnTitle}
      </Button>
    </Dropdown>
  );
};
MenuList.propTypes = {
  id: PropTypes.string,
  data: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.arrayOf(PropTypes.object),
  ]).isRequired,
  disabled: PropTypes.bool,
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  optionLabelField: PropTypes.string,
  optionValueField: PropTypes.string,
  onMenuClick: PropTypes.func,
  onDropdownClick: PropTypes.func,
  dropdownBtnTitle: PropTypes.string,
  imgSrc: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  altText: PropTypes.string,
  btnClassName: PropTypes.string,
  activeBtnClassName: PropTypes.string,
  imgClassName: PropTypes.string,
  txtClassName: PropTypes.string,
  MenuIconClassName: PropTypes.string,
  placement: PropTypes.string,
  overlayClassName: PropTypes.string,
  overlayStyle: PropTypes.object,
  trigger: PropTypes.string,
};
MenuList.defaultProps = {
  data: [],
  placement: 'bottomLeft',
  trigger: 'click',
};
export default React.memo(MenuList);
