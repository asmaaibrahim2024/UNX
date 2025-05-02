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

export default function Selection({ isVisible, setActiveButton }) {
  const { t, i18n } = useTranslation("Find");

  //To access the config
  const [isContainerVisible, setIsContainerVisible] = useState(false);

  const [sketchVMInstance, setSketchVMInstance] = useState(null);
  const [selectionLayerInstance, setSelectionLayerInstance] = useState(null);

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

  const view = useSelector((state) => state.mapViewReducer.intialView);

  const dispatch = useDispatch();

  useEffect(() => {
    if (!view) return;
    if (!isVisible) return;

    let selectionLayer;
    let sketchVM;

    const initialize = async () => {
      try {
        console.log(view, "viewviewview");

        selectionLayer = await createGraphicsLayer();
        await selectionLayer.load();
        view.map.add(selectionLayer);

        const polygonSymbol = {
          type: "simple-fill",
          color: [173, 216, 230, 0.2],
          outline: {
            color: [70, 130, 180],
            width: 2,
          },
        };

        sketchVM = await createSketchViewModel(
          view,
          selectionLayer,
          polygonSymbol
        );
        console.log(sketchVM, "sketchVM");

        view.container.style.cursor = "crosshair";
        const selectFeatures = async (geometry) => {
          try {
            const layers = view.map.allLayers.items.filter(
              (layer) => layer.type === "feature"
            );

            if (!layers.length) {
              console.warn("No feature layers found.");
              return;
            }

            let newFeatures = [];
            const currentSelectedFeatures = [...selectedFeatures]; // Get current selections

            for (const layer of layers) {
              if (!layer.capabilities?.query) {
                console.warn(`Layer ${layer.title} does not support querying.`);
                continue;
              }

              const features = await createQueryFeaturesWithConditionWithGeo(
                layer.parsedUrl.path,
                "1=1",
                layer.outFields?.length ? layer.outFields : ["*"],
                true,
                geometry
              );

              if (features.length) {
                // Check if we already have features from this layer
                const existingLayerIndex = currentSelectedFeatures.findIndex(
                  (item) => item.layerName === layer.title
                );

                if (existingLayerIndex >= 0) {
                  // Merge new features with existing ones, avoiding duplicates
                  const existingFeatures =
                    currentSelectedFeatures[existingLayerIndex].features;
                  const newFeatureAttributes = features.map(
                    (f) => f.attributes
                  );

                  // Combine and remove duplicates based on objectid
                  const combinedFeatures = [
                    ...existingFeatures,
                    ...newFeatureAttributes.filter(
                      (newF) =>
                        !existingFeatures.some(
                          (existingF) => existingF.OBJECTID === newF.OBJECTID
                        )
                    ),
                  ];

                  newFeatures.push({
                    layerName: layer.title,
                    features: combinedFeatures,
                  });
                  //higlight all the selected features
                } else {
                  // New layer selection
                  newFeatures.push({
                    layerName: layer.title,
                    features: features.map((f) => f.attributes),
                  });
                }

                highlightSelectedFeatures(features);
              }
            }

            // Combine with selections from other layers that weren't modified
            const otherSelections = currentSelectedFeatures.filter(
              (item) =>
                !newFeatures.some(
                  (newItem) => newItem.layerName === item.layerName
                )
            );

            const allFeatures = [...otherSelections, ...newFeatures];

            dispatch(setSelectedFeatures(allFeatures));

            setIsContainerVisible(true);
          } catch (error) {
            console.error("Error selecting features:", error);
            if (error.details) {
              console.error("Detailed Error Info:", error.details);
            }
          }
        };

        sketchVM.on("create", async (event) => {
          if (event.state === "complete") {
            const geometry = event.graphic.geometry;
            await selectFeatures(geometry);
            view.container.style.cursor = "default";
            sketchVM.cancel();
          }
        });

        sketchVM.create("rectangle");
        setSketchVMInstance(sketchVM);
        setSelectionLayerInstance(selectionLayer);
      } catch (error) {
        console.error("Error initializing selection:", error);
      }
    };

    initialize();

    const highlightSelectedFeatures = (features) => {
      features.map((feature) => {
        highlightOrUnhighlightFeature(feature, false, view);
      });
    };

    return () => {
      if (view) {
        view.container.style.cursor = "default";
        if (selectionLayer) {
          view.map.remove(selectionLayer);
        }
        if (sketchVM) {
          sketchVM.destroy();
        }
      }
    };
  }, [view, isVisible]);

  const resetSelection = () => {
    dispatch(setSelectedFeatures([]));
    selectionLayerInstance.removeAll();
    sketchVMInstance.cancel();
    view.graphics.removeAll();
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

  if (!isVisible) return null;

  return (
    <>
      {isContainerVisible && (
        <div className="selection-container">
          <div className="selection-header">
            <div className="container-title">Selection (50)</div>
            <img
              src={close}
              alt="close"
              className="cursor-pointer"
              onClick={{ resetSelection }}
            />
          </div>

          <main className="selection-body">
            <div>
              {selectedFeatures.map((group, index) => (
                <div key={index} className="feature-layers">
                  <div
                    className={`layer-header ${
                      expandedGroups[group.layerName] ? "expanded" : ""
                    }`}
                    onClick={() => toggleGroup(group.layerName)}
                  >
                    <span>
                      {/* {expandedGroups[group.layerName] ? (
                    <img src={folder} alt="file" />
                  ) : (
                    <img src={folder} alt="file" />
                  )}{" "} */}
                      {group.layerName} ({group.features.length})
                    </span>
                    <span>
                      {expandedGroups[group.layerName] ? (
                        <img src={arrowup} alt="arrow up" />
                      ) : (
                        <img src={arrowdown} alt="arrow down" />
                      )}
                    </span>
                  </div>
                  {expandedGroups[group.layerName] && (
                    <div className="asset-groups">
                      {Object.entries(
                        group.features.reduce((acc, feature) => {
                          const assetGroup = feature.assetgroup || "Unknown";
                          const assetType = feature.assettype || "Unknown";
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
                                {expandedTypes[
                                  `${assetGroup}-${assetTypes}`
                                ] ? (
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
                                      <li
                                        key={assetType}
                                        className="asset-type"
                                      >
                                        <div
                                          className="type-header"
                                          onClick={() =>
                                            toggleObject(
                                              assetGroup,
                                              assetType,
                                              elements[0].OBJECTID
                                            )
                                          }
                                        >
                                          <span>
                                            {/* <FaFile />  */}
                                            {assetTypeName}
                                          </span>
                                          <span>
                                            {expandedObjects[
                                              `${assetGroup}-${assetType}-${elements[0].OBJECTID}`
                                            ] ? (
                                              <img
                                                src={arrowup}
                                                alt="arrow up"
                                              />
                                            ) : (
                                              <img
                                                src={arrowdown}
                                                alt="arrow down"
                                              />
                                            )}
                                          </span>
                                        </div>
                                        {expandedObjects[
                                          `${assetGroup}-${assetType}-${elements[0].OBJECTID}`
                                        ] && (
                                          <ul className="elements-list">
                                            {elements.map((element, i) => (
                                              <li
                                                key={i}
                                                className="element-item"
                                              >
                                                <div className="object-header">
                                                  <span>
                                                    # {element.OBJECTID}
                                                  </span>
                                                </div>
                                                <div className="header-action">
                                                  <img
                                                    src={file}
                                                    alt="folder"
                                                    className="cursor-pointer"
                                                  />
                                                  <img
                                                    src={dot}
                                                    alt="folder"
                                                    className="cursor-pointer"
                                                  />
                                                </div>
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
          </main>
          {/* <button className="reset-btn" onClick={resetSelection}>
            Reset Selection
          </button> */}
        </div>
      )}
    </>
  );
}
