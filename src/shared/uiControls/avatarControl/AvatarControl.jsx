import React from 'react';
import { Icon } from "app/components/mgComponents";
import PropTypes from 'prop-types';
import './AvatarControl.scss';

/**
 * UnitType: displays unit type next to it's icon
 * @param {string} id // avatar icon id
 * @param {string} icon: // avatar icon link
 * @param {string} text // avatar text
 * @param {string} avatarClassName
 * @param {string} iconClassName
 * @param {string} textClassName
 * @param {string} containerClassName
 * @param {bool} positionTextBottom // when true text will appear under the icon
 */
const AvatarControl = ({
  id,
  AvatarIcon,
  text,
  avatarClassName,
  iconClassName,
  textClassName,
  containerClassName,
  iconAltText,
  positionTextBottom,
}) => {
  return AvatarIcon || text ? (
    <div
      className={containerClassName}
      style={{
        display: 'flex',
        flexDirection: positionTextBottom ? 'column' : 'row',
        width: 'fit-content',
      }}
    >
      <div
        className="row middle-xs"
        style={{ flexWrap: 'nowrap', margin: 'auto' }}
      >
        <div>
          <div className="box">
            <div
              className={`row center-xs middle-xs avatar-control-icon-frame ${avatarClassName}`}
            >
              <Icon
                id={id}
                imgSrc={AvatarIcon}
                imgClassName={`avatar-control-icon-width ${iconClassName}`}
                altText={iconAltText}
              />
            </div>
          </div>
        </div>
      </div>

      <div
        className={`avatar-control-no-padding avatar-control-bottom-text  ${textClassName}`}
      >
        {text && <span className="box">{text}</span>}
      </div>
    </div>
  ) : (
    <></>
  );
};

AvatarControl.propTypes = {
  id: PropTypes.string,
  icon: PropTypes.string,
  text: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  avatarClassName: PropTypes.string,
  iconClassName: PropTypes.string,
  textClassName: PropTypes.string,
  containerClassName: PropTypes.string,
  iconAltText: PropTypes.string,
  positionTextBottom: PropTypes.bool,
};

AvatarControl.defaultProps = {
  id: '',
  icon: null,
  text: null,
  avatarClassName: null,
  iconClassName: null,
  textClassName: null,
  containerClassName: null,
  iconAltText: '',
  positionTextBottom: false,
};

export default React.memo(AvatarControl);
