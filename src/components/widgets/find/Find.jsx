import { useEffect, useRef, useState } from "react";
import "./Find.scss";
import { useSelector, useDispatch } from "react-redux";
import {
  getAttributeCaseInsensitive,
  makeEsriRequest,
  createFeatureLayer,
  highlightOrUnhighlightFeature,
  ZoomToFeature,
} from "../../../handlers/esriHandler";
import { setSelectedFeatures } from "../../../redux/widgets/selection/selectionAction";
import {
  addTraceSelectedPoint,
  removeTracePoint,
} from "../../../redux/widgets/trace/traceAction";
import React from "react";
import { useTranslation } from "react-i18next";
import { addPointToTrace } from "../trace/traceHandler";

export default function Find({ isVisible }) {
  const { t, i18n } = useTranslation("Find");

  const [layers, setLayers] = useState(null);
  const [selectedLayerId, setSelectedLayerId] = useState("");
  const [selectedField, setSelectedField] = useState("");
  const [features, setFeatures] = useState([]);
  const [searchClicked, setSearchClicked] = useState(false);
  const [clickedOptions, setClickedOptions] = useState(null);
  const [popupFeature, setPopupFeature] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const view = useSelector((state) => state.mapViewReducer.intialView);
  const selectedPoints = useSelector(
    (state) => state.traceReducer.selectedPoints
  );
  const layersAndTablesData = useSelector(
    (state) => state.mapViewReducer.layersAndTablesData
  );

  const currentSelectedFeatures = useSelector(
    (state) => state.selectionReducer.selectedFeatures
  );

  const dispatch = useDispatch();

  // efect to load layers and to check if the view is loaded or not
  useEffect(() => {
    if (!view) return;
    if (view && layers == null) {
      view.when(() => loadLayers());
    }
  }, [view, layers]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is outside the options menu
      if (
        !event.target.closest(".value-menu") &&
        !event.target.closest(".options-button")
      ) {
        setClickedOptions(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const loadLayers = async () => {
    try {
      const featureLayers = layersAndTablesData[0].layers
        .filter((layer) => layer.type.toLowerCase() === "feature layer")
        .map((layer) => ({
          id: layer.id,
          title: layer.name,
          type: layer.type,
        }));

      setLayers(featureLayers);
    } catch (error) {
      console.error("Error loading layers:", error);
    }
  };

  const getLayerTitle = () => {
    return (
      layers.find((layer) => layer.id.toString() === selectedLayerId)?.title ||
      "Unknown Layer"
    );
  };

  const isFeatureSelected = (selectedFeatures, layerTitle, objectId) => {
    const layer = selectedFeatures.find(
      (item) => item.layerName === layerTitle
    );
    return (
      layer?.features.some((f) => {
        return getAttributeCaseInsensitive(f, "objectid") == objectId;
      }) || false
    );
  };

  const addFeatureToSelection = (
    selectedFeatures,
    layerTitle,
    featureAttributes
  ) => {
    const existingLayerIndex = selectedFeatures.findIndex(
      (item) => item.layerName === layerTitle
    );

    if (existingLayerIndex >= 0) {
      // Add to existing layer
      return selectedFeatures.map((item, index) =>
        index === existingLayerIndex
          ? { ...item, features: [...item.features, featureAttributes] }
          : item
      );
    } else {
      // Create new layer entry
      return [
        ...selectedFeatures,
        {
          layerName: layerTitle,
          features: [featureAttributes],
        },
      ];
    }
  };

  const removeFeatureFromSelection = (
    selectedFeatures,
    layerTitle,
    objectId
  ) => {
    return selectedFeatures
      .map((layer) => {
        if (layer.layerName === layerTitle) {
          // Filter out the feature
          const filteredFeatures = layer.features.filter(
            (f) =>
              getAttributeCaseInsensitive(f.attributes, "objectid") != objectId
          );
          return filteredFeatures.length > 0
            ? { ...layer, features: filteredFeatures }
            : null;
        }
        return layer;
      })
      .filter(Boolean); // Remove empty layers
  };

  const addOrRemoveFeatureFromSelection = (layerTitle, objectId, feature) => {
    const featureAttributes = feature.attributes;

    if (isFeatureSelected(currentSelectedFeatures, layerTitle, objectId)) {
      // Feature exists - remove it
      return removeFeatureFromSelection(
        currentSelectedFeatures,
        layerTitle,
        objectId
      );
    } else {
      // Feature doesn't exist - add it
      return addFeatureToSelection(
        currentSelectedFeatures,
        layerTitle,
        featureAttributes
      );
    }
  };

  const handleselectFeature = async (objectId) => {
    const matchingFeature = features.find(
      (f) => getAttributeCaseInsensitive(f.attributes, "objectid") == objectId
    );
    if (!matchingFeature) return;

    const layerTitle = getLayerTitle();

    const updatedFeatures = addOrRemoveFeatureFromSelection(
      layerTitle,
      objectId,
      matchingFeature
    );

    dispatch(setSelectedFeatures(updatedFeatures));
    highlightOrUnhighlightFeature(matchingFeature, false, view);

    handleZoomToFeature(objectId);
  };

  const handleZoomToFeature = async (objectId) => {
    if (!objectId || !view) return;

    const matchingFeature = features.find(
      (feature) =>
        getAttributeCaseInsensitive(feature.attributes, "objectid") == objectId
    );
    ZoomToFeature(matchingFeature, view);
  };

  const resetSelection = () => {
    setSelectedLayerId("");
    setSelectedField("");
    setFeatures([]);
    setSearchClicked(false);
    setSearchValue("");
  };

  const showProperties = (value) => {
    const matchingFeature = features.find(
      (feature) =>
        getAttributeCaseInsensitive(feature.attributes, "objectid") == value
    );
    console.log(matchingFeature);
    if (matchingFeature) {
      setPopupFeature(matchingFeature.attributes);
    }
  };

  const OnSearchClicked = async () => {
    setSearchClicked(true);
    if (!searchValue) {
      getAllFeatures();
    } else {
      getFilteredFeatures();
    }
  };
  const getAllFeatures = async () => {
    if (!selectedLayerId) return;

    const featureLayer = await getFeatureLayer();

    try {
      await featureLayer.load();

      const queryFeaturesresult = await featureLayer.queryFeatures({
        where: "1=1",
        outFields: ["*"],
        returnGeometry: true,
      });

      setFeatures(queryFeaturesresult.features);
    } catch (error) {
      console.error("Error loading features:", error);
    }
  };

  const getFilteredFeatures = async () => {
    if (!selectedLayerId) return;

    const featureLayer = await getFeatureLayer();

    try {
      await featureLayer.load();

      const whereClause = getFilteredFeaturesWhereClause();
      console.log(whereClause);

      const queryFeaturesresult = await featureLayer.queryFeatures({
        where: whereClause,
        outFields: ["*"],
        returnGeometry: true,
      });

      setFeatures(queryFeaturesresult.features);
    } catch (error) {
      console.error("Error loading features:", error);
    }
  };

  const getFilteredFeaturesWhereClause = () => {
    const searchString = searchValue;
    const searchFields = ["ASSETGROUP", "ASSETTYPE"];

    const whereClause = searchFields
      // .map((field) => `${field} LIKE '%${searchString}%'`)
      .map((field) => `${field} = ${searchString}`)
      .join(" OR ");

    return whereClause;
  };

  const getFeatureLayer = async () => {
    const layerData = layers.find(
      (layer) => layer.id.toString() === selectedLayerId
    );
    if (!layerData) return;

    const utilityNetworkLayerUrl =
      window.mapConfig.portalUrls.utilityNetworkLayerUrl;
    const featureServerUrl = utilityNetworkLayerUrl
      .split("/")
      .slice(0, -1)
      .join("/");
    const featureLayerUrl = `${featureServerUrl}/${layerData.id}`;

    const featureLayer = await createFeatureLayer(
      // `Layer ${layerData.id}`,
      // layerData.id,
      featureLayerUrl,
      {
        outFields: ["*"],
      }
    );

    return featureLayer;
  };

  const isStartingPoint = (globalId) => {
    if (!selectedPoints?.StartingPoints) return false;

    const selectedpoint = selectedPoints.StartingPoints.find(
      (point) => point[1] === globalId
    );
    return selectedpoint !== undefined;
  };

  const addOrRemoveTraceStartPoint = (objectId, feature) => {
    const type = "startingPoint";
    const globalId = getAttributeCaseInsensitive(
      feature.attributes,
      "globalid"
    );
    const assetGroup = getAttributeCaseInsensitive(
      feature.attributes,
      "assetgroup"
    );
    const terminalId = getAttributeCaseInsensitive(
      feature.attributes,
      "terminalid"
    );
    if (isStartingPoint(globalId)) {
      dispatch(removeTracePoint(globalId));
    } else {
      addPointToTrace(
        type,
        globalId,
        assetGroup,
        terminalId,
        selectedPoints,
        dispatch
      );
    }
  };

  const handleTraceStartPoint = (objectId) => {
    const matchingFeature = features.find(
      (feature) =>
        getAttributeCaseInsensitive(feature.attributes, "objectid") == objectId
    );
    addOrRemoveTraceStartPoint(objectId, matchingFeature);
  };

  const isBarrierPoint = (globalId) => {
    if (!selectedPoints?.Barriers) return false;

    const selectedpoint = selectedPoints.Barriers.find(
      (point) => point[1] === globalId
    );
    return selectedpoint !== undefined;
  };

  const addOrRemoveBarrierPoint = (objectId, feature) => {
    const type = "barrier";
    const globalId = getAttributeCaseInsensitive(
      feature.attributes,
      "globalid"
    );
    const assetGroup = getAttributeCaseInsensitive(
      feature.attributes,
      "assetgroup"
    );
    const terminalId = getAttributeCaseInsensitive(
      feature.attributes,
      "terminalid"
    );
    if (isBarrierPoint(globalId)) {
      dispatch(removeTracePoint(globalId));
    } else {
      addPointToTrace(
        type,
        globalId,
        assetGroup,
        terminalId,
        selectedPoints,
        dispatch
      );
    }
  };

  const handleBarrierPoint = (objectId) => {
    const matchingFeature = features.find(
      (feature) =>
        getAttributeCaseInsensitive(feature.attributes, "objectid") == objectId
    );
    addOrRemoveBarrierPoint(objectId, matchingFeature);
  };

  if (!isVisible) return null;
  return (
    <div>
      <div className="find-container">
        {/* Sidebar */}
        <div className="find-select">
          <h3>Select a Layer:</h3>
          <select
            onChange={(e) => setSelectedLayerId(e.target.value)}
            value={selectedLayerId}
          >
            <option value="">-- Select a Layer --</option>
            {layers?.map((layer) => (
              <option key={layer.id} value={layer.id}>
                {layer.title} ({layer.type})
              </option>
            ))}
          </select>
          {
            <div>
              <h3>Search {selectedField}:</h3>
              <input
                type="text"
                placeholder={`Search by ${selectedField}...`}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="search-input"
              />
            </div>
          }

          <div className="button-group">
            <button
              onClick={() => OnSearchClicked()}
              disabled={!selectedLayerId}
              className="search-button"
            >
              Search
            </button>
            <button onClick={resetSelection} className="reset-button">
              Reset
            </button>
          </div>

          {searchClicked && (
            <div>
              <h3>Select a Value:</h3>
              <div className="value-list">
                {features.map((feature) => (
                  <div
                    key={getAttributeCaseInsensitive(
                      feature.attributes,
                      "objectid"
                    )}
                    className="value-item"
                  >
                    <div className="value">
                      labeltext:{" "}
                      {getAttributeCaseInsensitive(
                        feature.attributes,
                        "labeltext"
                      )}{" "}
                      <br />
                      objectid:{" "}
                      {getAttributeCaseInsensitive(
                        feature.attributes,
                        "objectid"
                      )}
                    </div>

                    <div
                      className="options-button"
                      onClick={() =>
                        setClickedOptions(
                          getAttributeCaseInsensitive(
                            feature.attributes,
                            "objectid"
                          )
                        )
                      }
                    >
                      <div className="options-button-dot">.</div>
                      <div className="options-button-dot">.</div>
                      <div className="options-button-dot">.</div>
                    </div>

                    {clickedOptions ===
                      getAttributeCaseInsensitive(
                        feature.attributes,
                        "objectid"
                      ) && (
                      <div className="value-menu">
                        <button
                          onClick={() =>
                            handleZoomToFeature(
                              getAttributeCaseInsensitive(
                                feature.attributes,
                                "objectid"
                              )
                            )
                          }
                        >
                          Zoom to
                        </button>
                        <button
                          onClick={() =>
                            handleselectFeature(
                              getAttributeCaseInsensitive(
                                feature.attributes,
                                "objectid"
                              )
                            )
                          }
                        >
                          {isFeatureSelected(
                            currentSelectedFeatures,
                            getLayerTitle(),
                            getAttributeCaseInsensitive(
                              feature.attributes,
                              "objectid"
                            )
                          )
                            ? "Unselect"
                            : "Select"}
                        </button>
                        <button
                          onClick={() =>
                            showProperties(
                              getAttributeCaseInsensitive(
                                feature.attributes,
                                "objectid"
                              )
                            )
                          }
                        >
                          Properties
                        </button>
                        <button
                          onClick={() =>
                            handleTraceStartPoint(
                              getAttributeCaseInsensitive(
                                feature.attributes,
                                "objectid"
                              )
                            )
                          }
                        >
                          {isStartingPoint(
                            getAttributeCaseInsensitive(
                              feature.attributes,
                              "globalid"
                            )
                          )
                            ? "Remove trace start point"
                            : "Add as a trace start point"}
                        </button>{" "}
                        <button
                          onClick={() =>
                            handleBarrierPoint(
                              getAttributeCaseInsensitive(
                                feature.attributes,
                                "objectid"
                              )
                            )
                          }
                        >
                          {isBarrierPoint(
                            getAttributeCaseInsensitive(
                              feature.attributes,
                              "globalid"
                            )
                          )
                            ? "Remove barrier point"
                            : "Add as a barrier point"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {popupFeature && (
        <div className="properties-sidebar">
          <button
            className="close-button"
            onClick={() => setPopupFeature(null)}
          >
            ❌
          </button>
          <h3>Feature Details</h3>
          <ul>
            {Object.entries(popupFeature).map(([key, val]) => (
              <li key={key}>
                <strong>{key}:</strong> {val}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
