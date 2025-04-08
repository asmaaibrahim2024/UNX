import React from 'react';
import { Tooltip as AntTooltip } from "app/components/externalComponents";
import PropTypes from 'prop-types';
import './Tooltip.scss';

/**
 * @param {object} props Component Properties
 * @param {string | React.Component} props.title - The tooltip content whether it is a string or React Component.
 * @param {string} props.placement - The position of the tooltip relative to the target, which can be one of:
 *  [`top`, `left`, `right`, `bottom`, `topLeft`, `topRight`, `bottomLeft`,
 *  `bottomRight`, `leftTop`, `leftBottom`, `rightTop`, `rightBottom`].//TODO move to enum file
 * @param {string} props.color - The background color of the tooltip.
 * @param {string | string[]} props.trigger - Tooltip trigger. One or more of: ["hover", "focus", "click", "contextMenu"].
 * @param {React.CSSProperties} props.style - CSS-in-JS style object of the tooltip card.
 * @param {string} props.className - Class name of the tooltip card.
 * @returns {React.Component}
 */
const Tooltip = ({
  title,
  placement,
  color,
  trigger,
  style,
  className,
  children,
}) => {
  return (
    <AntTooltip
      title={title}
      placement={placement}
      color={color}
      trigger={trigger}
      overlayClassName={className}
      overlayStyle={style}
    >
      {children}
    </AntTooltip>
  );
};

Tooltip.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  placement: PropTypes.string,
  color: PropTypes.string,
  trigger: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  style: PropTypes.object,
  className: PropTypes.string,
};

export default React.memo(Tooltip);
