import React from 'react';
import PropTypes from 'prop-types';

import { InputNumber as AntInputNumber } from 'app/components/externalComponents';
import './InputNumber.scss';

const InputNumber = ({
  id,
  min,
  max,
  disabled = false,
  withDisabledStyle = true,
  onChange,
  value,
  isError,
  errorValue,
  ...restProps
}) => {
  return (
    <div className="ant-input-number-warper">
      {disabled && withDisabledStyle ? (
        <div className={value ? '' : 'read-only-bg'}>{value || '--'}</div>
      ) : (
        <>
          <AntInputNumber
            type="number"
            id={id}
            min={min}
            max={max}
            value={value}
            onChange={onChange}
            disabled={disabled}
            {...restProps}
          />
          {isError ? (
            <span className="ant-input-number-warper__error-tooltip ">
              {errorValue}
            </span>
          ) : null}
        </>
      )}
    </div>
  );
};

InputNumber.propTypes = {
  id: PropTypes.string,
  min: PropTypes.number,
  max: PropTypes.number,
  value: PropTypes.number,
  onchange: PropTypes.func,
};

export default React.memo(InputNumber);
