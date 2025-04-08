import React from 'react';
import PropTypes from 'prop-types';
import { AutoComplete as AntAutoComplete } from "app/components/externalComponents";

/*import { ReactComponent as ClearIcon } from 'app/style/images/mg-clear.svg';*/
import { ReactComponent as ClearIcon } from 'app/style/images/dgda/icons/clear_icon.svg';

import './AutoComplete.scss';
/**
 * DropDownList common component
 * {@link https://ant.design/components/auto-complete/ AutoComplete Antdesign}
 * @param {String} id : id of autoComplete component
 * @param {{ label, value }[]} options : array of objects to be used as options to autocomplete when typing
 * @param {boolean | function(inputValue, option)} filterOption If true, filter options by input, if function, filter options against it.
 *                  The function will receive two arguments, inputValue and option, if the function returns true,
 *                  the option will be included in the filtered set; Otherwise, it will be excluded
 */
const AutoComplete = ({
  id,
  options,
  filterOption,
  dropdownClassName,
  ...props
}) => {
  return (
    <AntAutoComplete
      id={`autoComplete-${id}`}
      options={options}
      filterOption={filterOption ?? true}
      dropdownClassName={`autocomplete-dropdown ${dropdownClassName}`}
      aria-controls={`autoComplete-${id}`}
      aria-owns={`autoComplete-${id}`}
      aria-activedescendant={`autoComplete-${id}`}
      aria-expanded={false}
      clearIcon={<ClearIcon />}
      {...props}
    />
  );
};

AutoComplete.propTypes = {
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      label: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string,
        PropTypes.element,
      ]),
    })
  ),
  filterOption: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

AutoComplete.defaultProps = {
  options: [],
};

export default React.memo(AutoComplete);
