import React from 'react';
import './SectionPlaceholder.scss';

/**
 * SectionPlaceholder Component
 * @param {object} props
 * @param {string} props.placeholder: Text to display in center of container
 * @param {boolean} [props.vertical]: Boolean to show placeholder in vertical format by default this value is false
 */
function SectionPlaceholder({
  placeholder,
  vertical = true,
  isPlaceHolderHidden,
}) {
  const textClass = `section-placeholder__text ${
    vertical ? 'section-placeholder__text--v' : ''
  }`.trim();

  return (
    <div
      className={`section-placeholder ${
        isPlaceHolderHidden ? 'section-placeholder--hidden' : ''
      }`}
    >
      <div className={textClass}>{placeholder}</div>
    </div>
  );
}

export default React.memo(SectionPlaceholder);
