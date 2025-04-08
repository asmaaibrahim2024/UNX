import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Select } from 'app/components/externalComponents';

import DataMasking from 'app/utils/DataMasking';
import { ReactComponent as ClearIcon } from 'app/style/images/mg-clear.svg';

import './DropDownList.scss';

/**
 * DropDownList common component
 * {@link https://ant.design/components/select/ Select Antdesign}
 * @param {data} notifications array of data to be shown in the dropdown
 * @param {boolean} showSearch false => if true it allow to search in the dropdownList
 * @param {boolean} showArrow true => shows the down arrow at the end of the dropdown box
 * @param {boolean} bordered false => whether has border style
 * @param {boolean} filterOption true => If true, filter options by input, if function, filter options against it. The function will receive two arguments, inputValue and option, if the function returns true, the option will be included in the filtered set; Otherwise, it will be excluded
 * @param {boolean} labelInValue false => whether to embed label in value
 * @param {boolean} loading false => indicate loading state
 * @param {boolean} virtual true => disable virtual scroll when set to false
 * @param {string} defaultValue default selected value displayed in the dropdown box
 * @param {boolean} allowClear false => Show clear button
 * @param {boolean} readOnly  puts component iin readOnly mode
 * @param {boolean} disabled  disables the component
 * @param {boolean} isMultiple to set mode of Select to be multiple or none by not specifying it
 * @param {string} placeholder the text that is displayed in the dropdown box in case of there is no default value or selected item
 * @param {string} optionLabelField value field to be specify the value from the object in case the coming dropdown data is array of objects
 * @param {string} optionValueField key field to be specify the key from the object in case the coming dropdown data is array of objects
 * @param {string} optionDisabledField disabled field to be specify the disabled from the object in case the coming dropdown data is array of objects
 * @param {string} size size of Select input can bs large, middle or small
 * @param {string} optionToolTip title of Select after select this Option (similar to tooltip)
 * @param {string} optionFilterProp which prop value of option will be used for filter if filterOption is true
 * @param {string} selectClassName additional class for the dropdown box
 * @param {string} dropdownClassName additional class for the dropdown list container
 * @param {string} optionClassName additional class for the options tag
 * @param {string} style additional inline style
 * @param {number} listHeight config dropdown list container height
 * @param {function} onChange function called when select an option or input value change
 * @param {function} onSelect function called when a option is selected, the params are option's value (or key) and option instance
 * @param {function} onFocus function called when focus
 * @param {function} onBlur function called when blur
 * @param {function} onSearch callback function that is fired when input changed
 * @param {function} onDeselect function called when a option is deselected, the params are option's value (or key) and option instance
 */

const DropDownList = ({
  id,
  data,
  showSearch,
  value,
  defaultValue,
  placeholder,
  allowClear,
  readOnly,
  disabled,
  onChange,
  onFocus,
  onBlur,
  onSearch,
  onDeselect,
  onSelect,
  filterOption,
  style,
  bordered,
  dropdownClassName,
  labelInValue,
  loading,
  isMultiple,
  showArrow,
  size,
  virtual,
  optionClassName,
  optionToolTip,
  listHeight,
  selectClassName,
  optionFilterProp,
  optionLabelField,
  optionValueField,
  optionDisabledField,
  withDisabledStyle = true,
  ...restProps
}) => {
  const ddlID = id + '_ddl';

  const options = data.map((item) => {
    let valueField = item;
    let labelField = item;
    let readOnlyField = false;
    if (optionLabelField && optionValueField) {
      valueField = DataMasking.getValue(optionValueField, item);
      labelField = DataMasking.getValue(optionLabelField, item);
      if (optionDisabledField)
        readOnlyField = DataMasking.getValue(optionDisabledField, item);
    }

    return {
      label: labelField,
      value: valueField,
      readOnly: readOnlyField,
      title: null,
    };
  });

  const valueText = useMemo(() => {
    let text = value;
    if (optionLabelField && optionValueField) {
      const item = data.find(
        (p) => DataMasking.getValue(optionValueField, p) === value
      );

      if (item) text = DataMasking.getValue(optionLabelField, item);
    }

    return text;
  }, [value]);

  return (
    <>
      {readOnly && withDisabledStyle ? (
        <div
          className={`dropdown-list__readOnly ${value ? '' : 'read-only-bg'}`}
        >
          {valueText || '--'}
        </div>
      ) : (
        <Select
          id={ddlID}
          showSearch={showSearch}
          defaultValue={defaultValue}
          value={value}
          style={style}
          placeholder={placeholder}
          allowClear={allowClear}
          optionFilterProp={optionFilterProp}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onSearch={onSearch}
          onSelect={onSelect}
          onDeselect={onDeselect}
          filterOption={filterOption}
          bordered={bordered}
          labelInValue={labelInValue}
          loading={loading}
          mode={isMultiple ? 'multiple' : undefined}
          showArrow={showArrow}
          size={size}
          virtual={virtual}
          listHeight={listHeight}
          className={`dropdown-box ${selectClassName}`}
          dropdownClassName={`dropdown-list ${dropdownClassName}`}
          aria-controls={ddlID}
          aria-owns={ddlID}
          aria-activedescendant={ddlID}
          aria-expanded={false}
          options={options}
          disabled={disabled}
          clearIcon={<ClearIcon />}
          {...restProps}
        />
      )}
    </>
  );
};

DropDownList.propTypes = {
  id: PropTypes.string,
  data: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.arrayOf(PropTypes.object),
  ]).isRequired,
  showSearch: PropTypes.bool,
  defaultValue: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  placeholder: PropTypes.string,
  allowClear: PropTypes.bool,
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  onSearch: PropTypes.func,
  onSelect: PropTypes.func,
  filterOption: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
  bordered: PropTypes.bool,
  labelInValue: PropTypes.bool,
  loading: PropTypes.bool,
  mode: PropTypes.string,
  showArrow: PropTypes.bool,
  size: PropTypes.string,
  virtual: PropTypes.string,
  optionToolTip: PropTypes.string,
  listHeight: PropTypes.number,
  optionFilterProp: PropTypes.string,
  optionLabelField: PropTypes.string,
  optionValueField: PropTypes.string,
  optionDisabledField: PropTypes.bool,
  name: PropTypes.string,
  required: PropTypes.bool,
};

DropDownList.defaultProps = {
  data: [],
  showSearch: true,
  allowClear: false,
  filterOption: true,
  optionFilterProp: 'children',
};

export default React.memo(DropDownList);
