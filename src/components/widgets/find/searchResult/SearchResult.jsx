import { React, useState } from "react";
import "./SearchResult.scss";
import FeatureItem from "../featureItem/FeatureItem";
import { useDispatch, useSelector } from "react-redux";
import {
  getAttributeCaseInsensitive,
  createFeatureLayer,
  getLayerOrTableName,
} from "../../../../handlers/esriHandler";
import { setDisplaySearchResults } from "../../../../redux/widgets/find/findAction";

import close from "../../../../style/images/x-close.svg";
import arrowdown from "../../../../style/images/cheveron-down.svg";
import arrowup from "../../../../style/images/cheveron-up.svg";
import file from "../../../../style/images/document-text.svg";
import dot from "../../../../style/images/dots-vertical.svg";
import { useI18n } from "../../../../handlers/languageHandler";

export default function SearchResult({
  features,
  layers,
  searchClicked,
  setShowSidebar,
  showSidebar,
}) {
  const { t, direction } = useI18n("Find");

  const layersAndTablesData = useSelector(
    (state) => state.mapViewReducer.layersAndTablesData
  );

  const [expandedGroups, setExpandedGroups] = useState({});

  if (!(features && searchClicked && showSidebar)) return null;

  const getLayerTitle = (layerId) => {
    // if (selectedLayerId === -1) return "All Layers";
    return (
      layers.find((layer) => Number(layer.id.toString()) === layerId)?.title ||
      "Unknown Layer"
    );
  };

  const toggleGroup = (layerId) => {
    setExpandedGroups((prevState) => ({
      ...prevState,
      [layerId]: !prevState[layerId],
    }));
  };

  return (
    <div className="search-result properties-sidebar flex-fill d-flex flex-column w-100 overflow-auto">
      <div className="search-header p_0">
        {/* <div className="result-header">
          <h4>{t("Search Results")}</h4>
        </div>
        <div className="result-header-action">
          <img
            src={close}
            alt="close"
            className="cursor-pointer"
            onClick={() => setShowSidebar(false)}
          />
        </div> */}
      </div>

      <ul className="feature-layers flex-fill">
        {
          // selectedLayerId === -1
          //   ?
          features.map((layerGroup) => (
            <li className="feture-layer" key={`layer-${layerGroup.layer.id}`}>
              <div
                className={`layer-header ${
                  expandedGroups[layerGroup.layer.id] ? "expanded" : "closed"
                }`} // Dynamic class based on state
                onClick={() => toggleGroup(layerGroup.layer.id)}
              >
                <span>
                  {layerGroup?.layer?.title} ({layerGroup.features.length})
                </span>
                <img
                  src={
                    expandedGroups[layerGroup.layer.id] ? arrowup : arrowdown
                  } // Toggle between arrowup and arrowdown
                  alt="toggle"
                  className={`toggle-icon ${
                    expandedGroups[layerGroup.layer.id] ? "expanded" : ""
                  }`}
                  height="16"
                />
              </div>
              {expandedGroups[layerGroup.layer.id] && (
                <>
                  {layerGroup.features.length > 0 ? (
                    layerGroup.features.slice(0, 5).map((feature) => (
                      <div
                        key={`${
                          layerGroup.layer.layerId
                        }-${getAttributeCaseInsensitive(
                          feature.attributes,
                          "objectid"
                        )}`}
                      >
                        <li
                          className="element-item"
                          key={getAttributeCaseInsensitive(
                            feature.attributes,
                            "objectid"
                          )}
                        >
                          <FeatureItem
                            feature={feature}
                            layerTitle={getLayerTitle(layerGroup.layer.layerId)}
                          />
                        </li>
                      </div>
                    ))
                  ) : (
                    <div className="element-item-noData">{t("There are no features for this layer")}</div>
                  )}
                </>
              )}
            </li>
          ))
          // : features.slice(0, 5).map((feature) => (
          //     <li
          //       className="element-item"
          //       key={getAttributeCaseInsensitive(
          //         feature.attributes,
          //         "objectid"
          //       )}
          //     >
          //       <FeatureItem
          //         feature={feature}
          //         layerTitle={getLayerTitle()}
          //         selectedLayerId={selectedLayerId}
          //         getLayerTitle={getLayerTitle}
          //       />
          //     </li>
          //   ))
        }
      </ul>

      {/* <button className="all-result flex-shrink-0">Show All Result</button> */}
    </div>
  );
}
