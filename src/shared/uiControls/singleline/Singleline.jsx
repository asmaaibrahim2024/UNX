import React from 'react';
import { Input } from 'app/components/externalComponents';
import PropTypes from 'prop-types';

import './Singleline.scss';

/**
 * Singleline common component
 * using AntDesign https://ant.design/components/input/
 * @param {String} label : label text
 * @param {String} id : singleline id
 * @param {String} className : singleline className
 * @param {String} value: text field value
 * @param {boolean} isRequired : to add * to singleline label
 * @param {boolean} isVertical : to make label vertical
 * @param {number} maxLength : input maxLength

 */
const Singleline = ({
    label,
    id,
    className = '',
    value,
    inputClassName = '',
    labelClassName = '',
    inputContainerClassName = '',
    isRequired = false,
    isVertical = false,
    maxLength,
    errorMsg,
    readOnly,
    placeholder='',
    ...restProps
}) => {
    return (
        <div
            className={`single-line ${isVertical ? 'single-line--vertical' : 'single-line--horizontal'
                } ${className}`}
            title={label}
        >
            {label && (
                <label className={`single-line__label ${labelClassName}`} htmlFor={id}>
                    {label}
                    {isRequired && <span className="clr-red">{' *'}</span>}
                </label>
            )}
            <div
                className={inputContainerClassName + ' single-line__input-container'}
            >
                {readOnly ? (
                    <div
                        className={`single-line__readOnly ${value ? '' : 'read-only-bg'}`}
                    >
                        {value || '--'}
                    </div>
                ) : (
                    <Input
                        className={`single-line__input form-control bg_gray_0 border rounded_4 h_30px p_x_8 p_y_0 ${inputClassName}`}
                        id={id}
                        value={value}
                        {...restProps}
                        maxLength={maxLength}
                        placeholder={`${placeholder}`}
                    />
                )}
                {errorMsg && <div className="single-line__error-msg">{errorMsg}</div>}
            </div>
        </div>
    );
};
Singleline.propTypes = {
    label: PropTypes.string,
    id: PropTypes.string,
    className: PropTypes.string,
    inputClassName: PropTypes.string,
    labelClassName: PropTypes.string,
    isRequired: PropTypes.bool,
    isVertical: PropTypes.bool,
    maxLength: PropTypes.number,
    placeholder: PropTypes.string
};
export default React.memo(Singleline);
