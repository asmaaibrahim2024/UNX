import {React, useState} from 'react';
import './SearchResult.scss';
import FeatureItem from "../featureItem/FeatureItem";

import { useDispatch, useSelector } from "react-redux";
import {
  getAttributeCaseInsensitive,
  createFeatureLayer,
} from "../../../../handlers/esriHandler";

import {
  setDisplaySearchResults
} from "../../../../redux/widgets/find/findAction";

import close from "../../../../style/images/x-close.svg";
import arrowdown from "../../../../style/images/cheveron-down.svg";
import file from "../../../../style/images/document-text.svg";
import dot from "../../../../style/images/dots-vertical.svg";


export default function SearchResult({ 
  isVisible
}) {
  
  const searchResults = useSelector((state) => state.findReducer.searchResults);

  const dispatch = useDispatch();



  if (!searchResults) return null;

  return (
    <div className="search-result">
      <div className="search-header">
        <div className="result-header">
          <h4>Search Result</h4>
        </div>
        <div className="result-header-action">
          <img
            src={close}
            alt="close"
            className="cursor-pointer"
            onClick={() => dispatch(setDisplaySearchResults(false))}
          />
        </div>
      </div>

      {searchResults.map((result, idx) => (
        <div key={idx} className="feature-layers">
          <div className="layer-header">
            <span>
              Layer ID: {result.layerId} ({result.features.length})
            </span>
            {result.features.length > 0 && (
              <span onClick={() => { /* Add your toggle function here if needed */ }}>
                <img src={arrowdown} alt="toggle" />
              </span>
            )}
          </div>

          {result.features.length > 0 ? (
            <ul className="elements-list">
              {result.features.map((element, i) => (
                <li key={i} className="element-item">
                  <div className="object-header">
                    <span># {element.attributes.OBJECTID}</span>
                  </div>
                  <div className="header-action">
                    <img
                      src={file}
                      alt="folder"
                      className="cursor-pointer"
                    />
                    <img
                      src={dot}
                      alt="options"
                      className="cursor-pointer"
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No features found in this layer.</p>
          )}
        </div>
      ))}
    </div>
  );
}