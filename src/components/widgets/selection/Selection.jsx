import "./Selection.scss";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  FaFolderOpen,
  FaFolder,
  FaFile,
  FaCaretDown,
  FaCaretRight,
} from "react-icons/fa";
import {
  createGraphicsLayer,
  createSketchViewModel,
  createQueryFeaturesWithConditionWithGeo,
  highlightOrUnhighlightFeature,
  getSelectedFeaturesCount,
  ZoomToFeature,
  getAttributeCaseInsensitive,
  getDomainValues,
  createGraphic,
} from "../../../handlers/esriHandler";
import {
  setExpandedGroups,
  setExpandedObjects,
  setExpandedTypes,
  setSelectedFeatures,
} from "../../../redux/widgets/selection/selectionAction";
import { useTranslation } from "react-i18next";
import chevronleft from "../../../style/images/chevron-left.svg";
import close from "../../../style/images/x-close.svg";
import folder from "../../../style/images/folder.svg";
import arrowup from "../../../style/images/cheveron-up.svg";
import arrowdown from "../../../style/images/cheveron-down.svg";
import file from "../../../style/images/document-text.svg";
import dot from "../../../style/images/dots-vertical.svg";
import reset from "../../../style/images/refresh.svg";

import { setActiveButton } from "../../../redux/sidebar/sidebarAction";
import FeatureItem from "./featureItem/FeatureItem";

export default function Selection({ isVisible }) {
  const { t, i18n } = useTranslation("Selection");

  const selectedFeatures = useSelector(
    (state) => state.selectionReducer.selectedFeatures
  );
  const expandedGroups = useSelector(
    (state) => state.selectionReducer.expandedGroups
  );
  const expandedTypes = useSelector(
    (state) => state.selectionReducer.expandedTypes
  );
  const expandedObjects = useSelector(
    (state) => state.selectionReducer.expandedObjects
  );
  const utilityNetwork = useSelector(
    (state) => state.traceReducer.utilityNetworkIntial
  );

  const view = useSelector((state) => state.mapViewReducer.intialView);

  const dispatch = useDispatch();

  const resetSelection = () => {
    dispatch(setSelectedFeatures([]));

    //to remove the drawn graphic polygon layer
    view.map.allLayers.items
      .filter((layer) => layer._isSelectionLayer)
      .forEach((layer) => layer.removeAll());

    //to remove the features highlights
    view.graphics.items
      .filter((g) => getAttributeCaseInsensitive(g.attributes, "objectid"))
      .forEach((g) => {
        view.graphics.remove(g);
      });
  };

  const closeSelectionPanel = () => {
    dispatch(setActiveButton(null));
  };

  const toggleGroup = (assetGroup) => {
    dispatch(
      setExpandedGroups({
        ...expandedGroups,
        [assetGroup]: !expandedGroups[assetGroup],
      })
    );
  };

  const toggleType = (assetGroup, assetType) => {
    dispatch(
      setExpandedTypes({
        ...expandedTypes,
        [`${assetGroup}-${assetType}`]:
          !expandedTypes[`${assetGroup}-${assetType}`],
      })
    );
  };

  const toggleObject = (assetGroup, assetType, objectId) => {
    dispatch(
      setExpandedObjects({
        ...expandedObjects,
        [`${assetGroup}-${assetType}-${objectId}`]:
          !expandedObjects[`${assetGroup}-${assetType}-${objectId}`],
      })
    );
  };

  const handleZoomToFeature = async (feature) => {
    if (!feature || !view) return;

    ZoomToFeature(feature, view);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* {isContainerVisible && ( */}
      <div className="selection-container">
        <div className="selection-header">
          <div className="container-title">
            {t("Selection")} ({getSelectedFeaturesCount(selectedFeatures)})
          </div>
          <img
            src={close}
            alt="close"
            className="cursor-pointer"
            onClick={closeSelectionPanel}
          />
        </div>

        <main className="selection-body">
          <div>
            {selectedFeatures.length === 0 && (
              <div> {t("No features found in selection")}</div>
            )}
            {selectedFeatures.map((group, index) => (
              <div key={group.layer.title} className="feature-layers">
                {" "}
                <div
                  className={`layer-header ${
                    expandedGroups[group.layer.title] ? "expanded" : ""
                  }`}
                  onClick={() => toggleGroup(group.layer.title)}
                >
                  <span>
                    {/* {expandedGroups[group.layerName] ? (
                    <img src={folder} alt="file" />
                  ) : (
                    <img src={folder} alt="file" />
                  )}{" "} */}
                    {group.layer.title} ({group.features.length})
                  </span>
                  <span>
                    {expandedGroups[group.layer.title] ? (
                      <img src={arrowup} alt="arrow up" />
                    ) : (
                      <img src={arrowdown} alt="arrow down" />
                    )}
                  </span>
                </div>
                {expandedGroups[group.layer.title] && (
                  <div className="asset-groups">
                    {Object.entries(
                      group.features.reduce((acc, feature) => {
                        const featureWithDomainValues = {};

                        // Override the attributes with domain values
                        featureWithDomainValues.attributes = getDomainValues(
                          utilityNetwork,
                          feature.attributes,
                          group.layer,
                          Number(group.layer.layerId)
                        ).rawKeyValues;

                        const assetGroup =
                          getAttributeCaseInsensitive(
                            featureWithDomainValues.attributes,
                            "assetgroup"
                          ) || "Unknown";

                        const assetType =
                          getAttributeCaseInsensitive(
                            featureWithDomainValues.attributes,
                            "assettype"
                          ) || "Unknown";

                        if (!acc[assetGroup]) acc[assetGroup] = {};
                        if (!acc[assetGroup][assetType])
                          acc[assetGroup][assetType] = [];

                        acc[assetGroup][assetType].push(feature);

                        return acc;
                      }, {})
                    ).map(([assetGroup, assetTypes]) => {
                      const assetGroupName = assetGroup; // Fallback to code if name not found
                      return (
                        <div key={assetGroup} className="asset-group">
                          <div
                            className="group-header"
                            onClick={() => toggleType(assetGroup, assetTypes)}
                          >
                            <span>
                              {/* {expandedTypes[`${assetGroup}-${assetTypes}`] ? (
                              <img src={folder} alt="file" />
                            ) : (
                              <img src={folder} alt="file" />
                            )}{" "} */}
                              {assetGroupName} (
                              {Object.values(assetTypes).flat().length})
                            </span>
                            <span>
                              {expandedTypes[`${assetGroup}-${assetTypes}`] ? (
                                <img src={arrowup} alt="arrow up" />
                              ) : (
                                <img src={arrowdown} alt="arrow down" />
                              )}
                            </span>
                          </div>
                          {expandedTypes[`${assetGroup}-${assetTypes}`] && (
                            <ul className="asset-types">
                              {Object.entries(assetTypes).map(
                                ([assetType, elements]) => {
                                  const assetTypeName = assetType; // Fallback to code if name not found
                                  return (
                                    <li key={assetType} className="asset-type">
                                      <div
                                        className="type-header"
                                        onClick={() =>
                                          toggleObject(
                                            assetGroup,
                                            assetType,
                                            getAttributeCaseInsensitive(
                                              elements[0].attributes,
                                              "objectid"
                                            )
                                          )
                                        }
                                      >
                                        <span>
                                          {/* <FaFile />  */}
                                          {assetTypeName}
                                        </span>
                                        <span>
                                          {expandedObjects[
                                            `${assetGroup}-${assetType}-${getAttributeCaseInsensitive(
                                              elements[0].attributes,
                                              "objectid"
                                            )}`
                                          ] ? (
                                            <img src={arrowup} alt="arrow up" />
                                          ) : (
                                            <img
                                              src={arrowdown}
                                              alt="arrow down"
                                            />
                                          )}
                                        </span>
                                      </div>
                                      {expandedObjects[
                                        `${assetGroup}-${assetType}-${getAttributeCaseInsensitive(
                                          elements[0].attributes,
                                          "objectid"
                                        )}`
                                      ] && (
                                        <ul className="elements-list">
                                          {elements.map((element, i) => (
                                            <li
                                              key={`${assetTypeName} - ${getAttributeCaseInsensitive(
                                                element.attributes,
                                                "objectid"
                                              )}`}
                                              className="element-item"
                                            >
                                              <FeatureItem
                                                feature={element}
                                                layerTitle={group.layer.title}
                                                layer={group.layer}
                                              />
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </li>
                                  );
                                }
                              )}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="action-btns">
            <button className="reset" onClick={resetSelection}>
              <img src={reset} alt="reset" />
              {t("Reset")}
            </button>
          </div>
        </main>
        {/* <button className="reset-btn" onClick={resetSelection}>
            Reset Selection
          </button> */}
      </div>
      {/* )} */}
    </>
  );
}
