import React, { useState } from 'react';
import PropTypes from 'prop-types';

import './InlineMenuList.scss';
import { ReactComponent as ListArrow } from 'app/style/images/mg-list-arrow.svg';

//temp icon
const InlineMenuList = ({
  id,
  menuTitle,
  menuData,
  menuClassName,
  menuTitleClassName,
  menuOverlayClassName,
  menuItemClassName,
  optionValueField,
  optionLabelField,
}) => {
  const [menuVisibility, setMenuVisibility] = useState(false);
  const onClick = () => {
    setMenuVisibility(!menuVisibility);
  };
  return (
    <div className={`inline-menu ${menuClassName}`} id={id}>
      <div
        className={`inline-menu-title ${menuTitleClassName}`}
        onClick={onClick}
      >
        {menuTitle}
        <ListArrow
          className={`inline-menu-arrow  ${
            menuVisibility
              ? 'inline-menu--opened-arrow'
              : 'inline-menu--closed-arrow'
          }`}
        />
      </div>
      {menuVisibility ? (
        <div className={`inline-menu-overlay ${menuOverlayClassName}`}>
          {menuData.map((item, index) => {
            let valueField = index;
            let labelField = item;
            if (optionLabelField && optionValueField) {
              valueField = item[optionValueField];
              labelField = item[optionLabelField];
            }
            return (
              <div
                className={`inline-menu-item ${menuItemClassName}`}
                key={valueField}
              >
                {labelField}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

InlineMenuList.propTypes = {
  id: PropTypes.string,
  menuTitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  menuData: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.object])
  ).isRequired,
  optionValueField: PropTypes.string,
  optionLabelField: PropTypes.string,
  menuClassName: PropTypes.string,
  menuTitleClassName: PropTypes.string,
  menuOverlayClassName: PropTypes.string,
  menuItemClassName: PropTypes.string,
};
InlineMenuList.defultProps = {
  menuData: [],
};

export default React.memo(InlineMenuList);
