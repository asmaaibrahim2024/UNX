import {React, useState} from 'react';
import './SearchResult.scss';
import FeatureItem from "../featureItem/FeatureItem";
import {
  getAttributeCaseInsensitive,
  createFeatureLayer,
} from "../../../../handlers/esriHandler";

import close from "../../../../style/images/x-close.svg";

export default function SearchResult({ 
  isVisible, 
  // setActiveButton, 
  features,
  layers,
  searchClicked,
  selectedLayerId,
  setShowSidebar


}) {


  const getLayerTitle = () => {
    if (selectedLayerId === -1) return "All Layers";
    return (
      layers.find((layer) => layer.id.toString() === selectedLayerId)?.title ||
      "Unknown Layer"
    );
  };


  if (!isVisible) return null;

  return (
    <div className="search-result">
      <div className="search-header">
              <div className="result-header">
                <h4>Search Results</h4>
              </div>
              <div className="result-header-action">
                <img
                  src={close}
                  alt="close"
                  className="cursor-pointer"
                  onClick={() => setShowSidebar(false)}
                />
              </div>
            </div>
      {/* Check if search is clicked and sidebar is visible */}
      {features && searchClicked && isVisible && (
        <div className="properties-sidebar">
          <ul className="elements-list">
            {/* Check if "All Layers" is selected */}
            {selectedLayerId === -1
              ? features.map((layerGroup) => (
                  <li key={`layer-${layerGroup.layer.id}`} className="element-item">
                    <div className="layer-group-header">{layerGroup?.layer?.title}</div>
                    {layerGroup.features.length > 0 ? (
                      layerGroup.features.slice(0, 5).map((feature) => (
                        <div
                          key={`${
                            layerGroup.layer.layerId
                          } - ${getAttributeCaseInsensitive(
                            feature.attributes,
                            "objectid"
                          )}`}
                        >
                          <FeatureItem
                            feature={feature}
                            layerTitle={feature.layer.title}
                            selectedLayerId={feature.layer.layerId}
                            getLayerTitle={getLayerTitle}
                          />

                        </div>
                      ))
                    ) : (
                      <div>No features for this layer</div>
                    )}
                  </li>
                ))
              : features.slice(0, 5).map((feature) => (
                <li
                  className="element-item"
                  key={getAttributeCaseInsensitive(
                    feature.attributes,
                    "objectid"
                  )}
                >
                  <FeatureItem
                    feature={feature}
                    layerTitle={getLayerTitle()}
                    selectedLayerId={selectedLayerId}
                    getLayerTitle={getLayerTitle}
                  />
                </li>
                ))}
          </ul>
          
          {/* Button to show all results (no functionality defined) */}
          <button className="all-result flex-shrink-0">Show All Result</button>
        </div>
      )}
    </div>
  );
}