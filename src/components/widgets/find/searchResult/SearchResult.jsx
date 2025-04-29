import React from 'react';
import './SearchResult.scss';
export default function SearchResult({ isVisible, setActiveButton }) {
  if (!isVisible) return null;

  return (
    <div className="search-result">
      <h3>Search Results</h3>
      {/* Show your results here */}
    </div>
  );
}
