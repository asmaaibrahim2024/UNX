import { useEffect, useRef, useState } from "react";
import "./Find.scss";
import { useSelector, useDispatch } from "react-redux";
import {
  loadFeatureLayers,
  createFeatureLayer,
  createGraphicFromFeature,
} from "../../../handlers/esriHandler";
import { setSelectedFeatures } from "../../../redux/widgets/selection/selectionAction";
import React from "react";
export default function Find({ isVisible }) {
  const [layers, setLayers] = useState(null);
  const [selectedLayerId, setSelectedLayerId] = useState("");
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState("");
  const [features, setFeatures] = useState([]);
  const [zoomInValue, setZoomInValue] = useState("");
  const [searchClicked, setSearchClicked] = useState(false);
  const [clickedOptions, setClickedOptions] = useState(null);
  const [popupFeature, setPopupFeature] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [filteredFeatures, setFilteredFeatures] = useState([]);
  const view = useSelector((state) => state.mapViewReducer.intialView);
  const currentSelectedFeatures = useSelector(
    (state) => state.selectionReducer.selectedFeatures
  );

  const dispatch = useDispatch();

  useEffect(() => {
    if (!view) return;
    if (view && layers == null) {
      view.when(() => loadLayers());
    }
  }, [view, layers]);

  useEffect(() => {
    updateFieldsAndFeatures();
  }, [selectedLayerId]);

  useEffect(() => {
    zoomToFeature();
  }, [zoomInValue]);

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
      const results = await loadFeatureLayers(
        window.findConfig.Configurations.mapServerUrl
      );

      const newLayers = results.layers.map((layer) => ({
        id: layer.id,
        title: layer.name,
        type: layer.type,
      }));

      setLayers(newLayers);
    } catch (error) {
      console.error("Error loading layers:", error);
    }
  };

  const updateFieldsAndFeatures = async () => {
    if (!selectedLayerId) return;

    const layerData = layers.find(
      (layer) => layer.id.toString() === selectedLayerId
    );
    if (!layerData) return;

    const featureLayer = await createFeatureLayer(
      `Layer ${layerData.id}`,
      layerData.id,
      `${window.findConfig.Configurations.mapServerUrl}/${layerData.id}`,
      {
        outFields: ["*"],
      }
    );

    try {
      await featureLayer.load();

      setFields(featureLayer.fields.map((field) => field.name));

      const result = await featureLayer.queryFeatures({
        where: "1=1",
        outFields: ["*"],
        returnGeometry: true,
      });

      setFeatures(result.features);
    } catch (error) {
      console.error("Error loading features:", error);
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
    return layer?.features.some((f) => f.objectid == objectId) || false;
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
            (f) => f.objectid != objectId
          );
          return filteredFeatures.length > 0
            ? { ...layer, features: filteredFeatures }
            : null;
        }
        return layer;
      })
      .filter(Boolean); // Remove empty layers
  };

  const addOrRemoveFeatureFromSelection = (
    layerTitle,
    objectId,
    featureAttributes
  ) => {
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

  // Main selectFeature function
  const selectFeature = (objectId) => {
    const matchingFeature = features.find(
      (f) => f.attributes.objectid == objectId
    );
    if (!matchingFeature) return;

    const layerTitle = getLayerTitle();
    const featureAttributes = matchingFeature.attributes;

    const updatedFeatures = addOrRemoveFeatureFromSelection(
      layerTitle,
      objectId,
      featureAttributes
    );

    dispatch(setSelectedFeatures(updatedFeatures));
    setClickedOptions(null);
  };

  const zoomToFeature = () => {
    if (!zoomInValue || !view) return;

    // Find the feature by objectid instead of selectedField
    const matchingFeature = features.find(
      (feature) => feature.attributes.objectid == zoomInValue
    );

    if (matchingFeature) {
      highlightFeature(matchingFeature);
      view
        .goTo({
          target: matchingFeature.geometry,
          zoom: 25,
        })
        .catch(console.error);
    }
  };

  const highlightFeature = async (feature) => {
    // Remove previous graphics if any
    view.graphics.removeAll();

    // Create a simple marker symbol
    const symbol = {
      type: "simple-marker",
      style: "circle",
      color: [255, 0, 0, 0.3], // red with some transparency
      size: 30,
      outline: {
        color: [255, 255, 255],
        width: 2,
      },
    };

    // Create a graphic for the selected feature
    const graphic = await createGraphicFromFeature(
      feature.geometry,
      symbol,
      feature.attributes
    );

    // Add the graphic to the view
    view.graphics.add(graphic);
  };

  const resetSelection = () => {
    setSelectedLayerId("");
    setSelectedField("");
    setZoomInValue("");
    setFeatures([]);
    setFields([]);
    setSearchClicked(false);
    setSearchValue("");
    setFilteredFeatures([]);
  };

  const showProperties = (value) => {
    if (!selectedField) return;

    const matchingFeature = features.find(
      (feature) => feature.attributes.objectid == value
    );

    if (matchingFeature) {
      setPopupFeature(matchingFeature.attributes);
    }
  };

  const OnSearchClicked = () => {
    setSearchClicked(true);
    if (!searchValue) {
      setFilteredFeatures(features);
    } else {
      setFilteredFeatures(
        features.filter((feature) =>
          String(feature.attributes[selectedField])
            .toLowerCase()
            .includes(searchValue.toLowerCase())
        )
      );
    }
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

          {fields.length > 0 && (
            <>
              <h3>Select a Field:</h3>
              <select
                onChange={(e) => {
                  setZoomInValue("");
                  setSearchClicked(null);
                  setSelectedField(e.target.value);
                }}
                value={selectedField}
              >
                <option value="">-- Select a Field --</option>
                {fields.map((field) => (
                  <option key={field} value={field}>
                    {field}
                  </option>
                ))}
              </select>
            </>
          )}
          {selectedField && (
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
          )}

          <div className="button-group">
            <button
              onClick={() => OnSearchClicked()}
              disabled={!selectedLayerId || !selectedField}
              className="search-button"
            >
              Search
            </button>
            <button onClick={resetSelection} className="reset-button">
              Reset
            </button>
          </div>

          {searchClicked && selectedField && (
            <div>
              <h3>Select a Value:</h3>
              <div className="value-list">
                {filteredFeatures.map((feature) => (
                  <div key={feature.attributes.objectid} className="value-item">
                    <div className="value">
                      labeltext: {feature.attributes.labeltext} <br />
                      {selectedField}: {feature.attributes[selectedField]}
                    </div>

                    <div
                      className="options-button"
                      onClick={() =>
                        setClickedOptions(feature.attributes.objectid)
                      }
                    >
                      <div className="options-button-dot">.</div>
                      <div className="options-button-dot">.</div>
                      <div className="options-button-dot">.</div>
                    </div>

                    {clickedOptions === feature.attributes.objectid && (
                      <div className="value-menu">
                        <button
                          onClick={() =>
                            setZoomInValue(feature.attributes.objectid)
                          }
                        >
                          Zoom to
                        </button>
                        <button
                          onClick={() =>
                            selectFeature(feature.attributes.objectid)
                          }
                        >
                          {isFeatureSelected(
                            currentSelectedFeatures,
                            getLayerTitle(),
                            feature.attributes.objectid
                          )
                            ? "Unselect"
                            : "Select"}
                        </button>
                        <button
                          onClick={() =>
                            showProperties(feature.attributes.objectid)
                          }
                        >
                          Properties
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {zoomInValue && (
            <>
              <h3>Zoom In Value:</h3>
              <p>{zoomInValue}</p>
            </>
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
