import React from 'react';
import PropTypes from 'prop-types';
import './Skeleton.scss';

/**
 * Skeleton common component
 * @param {String} type :skeleton type could be [grid or avatarwithparagraph or paragraph or square or circle or bar ]
 * @param {Number} rows : number of rows
 * @param {Number} cols : number of columns
 * @param {Number} lines : number of lines
 * @param {Boolean} opacity : to apply opacity animation
 * @param {String} height : height
 * @param {String} width : width
 * @param {String} style : additional styles
 */
/**
//  Grid Skeleton is configured using height, number of rows, number of columns, and opacity.
//  Avatar with Paragraph Skeleton is configured using height,number of lines, and opacity.
//  Form Skeleton is configured using height, number of lines, and opacity.
//  Paragraph Skeleton is configured using height, number of lines, and opacity.
//  Square Skeleton is configured using height, width , and opacity.
//  Circle Skeleton is configured using height and 
opacity.
//  Bar Skeleton is configured using height, width , and opacity.
 */
const Skeleton = ({
  type,
  rows,
  cols,
  lines,
  opacity,
  height,
  width,
  style,
}) => {
  if (type === 'grid') {
    return (
      <div className={`grid ${opacity === true ? 'opacity' : ''}`}>
        <table>
          <thead>
            <tr>
              {[...Array(Number(rows))].map((item, index) => (
                <th key={index}>
                  <div
                    className="grid__header"
                    style={{ height: `${height}`, ...style }}
                  ></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(Number(cols))].map((item, index) => (
              <tr key={index}>
                {[...Array(Number(rows))].map((item, index) => (
                  <td key={index}>
                    <div
                      className="grid__body"
                      style={{ height: `${height}`, ...style }}
                    ></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  } else if (type === 'avatarparagraph') {
    return (
      <div className={`avatar-paragraph ${opacity === true ? 'opacity' : ''}`}>
        <div className="avatar-paragraph__avatar">
          <div className="avatar-paragraph__img responsive-circle"></div>
        </div>
        <div className="avatar-paragraph__parag">
          {[...Array(Number(lines))].map((item, index) => (
            <div
              key={index}
              style={{ height: `${height}`, ...style }}
              className={`avatar-paragraph__parag-line bar ${
                index === 0 ? 'first' : ''
              } ${index === Number(lines) - 1 ? 'last' : ''}`}
            ></div>
          ))}
        </div>
      </div>
    );
  } else if (type === 'form') {
    return (
      <div className={`form ${opacity === true ? 'opacity' : ''}`}>
        {[...Array(Number(lines))].map((item, index) => (
          <div key={index} className="form__row-wrapper">
            <div className="form__title-wrapper">
              <div
                className="form__title"
                style={{ height: `${height}`, ...style }}
              ></div>
            </div>
            {/*  // last child add class textfield */}
            {/* <div className='form-input-wrapper'><div className={`form-input ${index ===Number(lines) - 1 ? "text-field" : ""}`}></div></div> */}
            <div className="form__input-wrapper">
              <div
                className="form__input"
                style={{ height: `${height}`, ...style }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  } else if (type === 'paragraph') {
    return (
      <div
        className={`paragraph__wrapper ${opacity === true ? 'opacity' : ''}`}
      >
        {[...Array(Number(lines))].map((item, index) => (
          <div
            key={index}
            style={{ height: `${height}`, ...style }}
            className={`paragraph__parag-line bar ${
              index === 0 ? 'first' : ''
            } ${index === Number(lines) - 1 ? 'last' : ''}`}
          ></div>
        ))}
      </div>
    );
  } else if (type === 'circle') {
    return (
      <div className={`circle__wrapper ${opacity === true ? 'opacity' : ''}`}>
        <div
          className="circle__item responsive-circle"
          style={{
            height,
            ...style,
          }}
        ></div>
      </div>
    );
  } else if (type === 'square') {
    return (
      <div
        className={`square__wrapper ${opacity === true ? 'opacity' : ''}`}
        style={{
          height: `${height}`,
          width: `${width}`,
        }}
      >
        <div
          className="square__item"
          style={{
            ...style,
          }}
        ></div>
      </div>
    );
  } else if (type === 'bar') {
    return (
      <div className={`bar__wrapper ${opacity === true ? 'opacity' : ''}`}>
        <div
          className="bar__item bar"
          style={{ height: `${height}`, width: `${width}`, ...style }}
        ></div>
      </div>
    );
  }
};

Skeleton.propTypes = {
  type: PropTypes.oneOf([
    'grid',
    'avatarparagraph',
    'form',
    'paragraph',
    'circle',
    'square',
    'bar',
  ]),
  rows: PropTypes.number,
  cols: PropTypes.number,
  lines: PropTypes.number,
  opacity: PropTypes.bool,
  height: PropTypes.string,
  width: PropTypes.string,
};
Skeleton.defaultProps = {
  type: 'bar',
  rows: 3,
  cols: 4,
  lines: 3,
  opacity: true,
  height: '7px',
  width: '100%',
};

export default React.memo(Skeleton);
