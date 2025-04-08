import React from 'react';
import PropTypes from 'prop-types';

import { Slider as AntSlider } from 'app/components/externalComponents';
import './Slider.scss';

const Slider = ({
  id,
  min,
  max,
  tooltipVisible,
  onChange,
  value,
  ...restProps
}) => {
  return (
    <div className="ant-slider-wrapper">
      <AntSlider
        id={id}
        min={min}
        max={max}
        tooltipVisible={tooltipVisible}
        onChange={onChange}
        value={typeof value === 'number' ? value : 0}
        {...restProps}
      />
    </div>
  );
};

Slider.propTypes = {
  id: PropTypes.string,
  min: PropTypes.number,
  max: PropTypes.number,
  tooltipVisible: PropTypes.bool,
  value: PropTypes.number,
  onchange: PropTypes.func,
};

Slider.defaultProps = {
  tooltipVisible: false,
};

export default React.memo(Slider);
