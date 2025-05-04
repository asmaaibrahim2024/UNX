import "./TraceInput.scss";
import Select from "react-select";
import { React, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useI18n } from "../../../../handlers/languageHandler";
import { SelectedTracePoint } from "../models";
import {
  getAttributeCaseInsensitive,
  showErrorToast,
  showInfoToast,
  showSuccessToast,
} from "../../../../handlers/esriHandler";
import {
  getTraceParameters,
  visualiseTraceGraphics,
  getSelectedPointTerminalId,
  getPercentAlong,
  executeTrace,
  addPointToTrace,
  categorizeTraceResult,
} from "../traceHandler";
import {
  removeTracePoint,
  setTraceResultsElements,
  setSelectedTraceTypes,
  clearTraceSelectedPoints,
  setTraceConfigHighlights,
} from "../../../../redux/widgets/trace/traceAction";

import close from '../../../../style/images/x-close.svg';
import selection from '../../../../style/images/selection-start.svg';
import copy from '../../../../style/images/copy.svg';
import reset from '../../../../style/images/refresh.svg';
// import document from '../../../../style/images/document-text.svg';
// import plus from '../../../../style/images/plus-circle.svg';
import trash from "../../../../style/images/trash-03.svg";

export default function TraceInput({
  isSelectingPoint,
  setIsSelectingPoint,
  setActiveButton,
  setActiveTab,
  mapClickHandlerRef,
}) {
  
    
  const { t, direction, dirClass, i18nInstance } = useI18n("Trace");

  const view = useSelector((state) => state.mapViewReducer.intialView);
  const layersAndTablesData = useSelector(
    (state) => state.mapViewReducer.layersAndTablesData
  );
  const utilityNetwork = useSelector(
    (state) => state.traceReducer.utilityNetworkIntial
  );
  const traceConfigurations = useSelector(
    (state) => state.traceReducer.traceConfigurations
  );
  const selectedTraceTypes = useSelector(
    (state) => state.traceReducer.selectedTraceTypes
  );
  const selectedPoints = useSelector(
    (state) => state.traceReducer.selectedPoints
  );
  const traceLocations = useSelector(
    (state) => state.traceReducer.traceLocations
  );
  const traceErrorMessage = useSelector(
    (state) => state.traceReducer.traceErrorMessage
  );
  const traceGraphicsLayer = useSelector(
    (state) => state.traceReducer.traceGraphicsLayer
  );
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(false);


  /**
   * Resets the trace input states and any ongoing point selection state.
   * Clears the graphics from trace graphics layer.
   */
  const handleReset = () => {
    // Reset Redux states
    dispatch(setTraceResultsElements(null));
    dispatch(clearTraceSelectedPoints());
    dispatch(setSelectedTraceTypes([]));
    // dispatch(setTraceErrorMessage(null));

    // Reset local states
    setIsSelectingPoint({ startingPoint: false, barrier: false });
    cleanupSelection();

    // Clear graphics from trace graphics layer
    if (traceGraphicsLayer) {
      traceGraphicsLayer.removeAll();
    }
  };

  /**
   * Cleans up the map selection state by resetting the cursor,
   * removing the active map click event listener, and clearing the
   * point selection flags.
   */
  const cleanupSelection = () => {
    // Reset cursor
    if (view) view.cursor = "default";
    // Remove map click listener
    if (mapClickHandlerRef.current) {
      mapClickHandlerRef.current.remove();
      mapClickHandlerRef.current = null;
    }
    // Reset selection state
    setIsSelectingPoint({ startingPoint: false, barrier: false });
  };

  /**
   * Removes a trace location point (either starting point or barrier) from the selected points list and the graphics layer.
   *
   * @param {string} type - The type of point to remove ("StartingPoints" or "Barriers").
   * @param {number} index - The index of the point in the selected points array.
   */
  const handleRemovePoint = (type, index) => {
    let globalId;

    // Get selected point to be removed global id
    if (type === "StartingPoints") {
      globalId = selectedPoints.StartingPoints[index]?.[1];
    } else if (type === "Barriers") {
      globalId = selectedPoints.Barriers[index]?.[1];
    }

    if (globalId) {
      // Remove the point
      dispatch(removeTracePoint(globalId));
      // Remove point graphic from map
      const graphicToRemove = traceGraphicsLayer.graphics.find(
        (g) => g.attributes?.id === globalId
      );
      if (graphicToRemove) {
        traceGraphicsLayer.graphics.remove(graphicToRemove);
      }
    }
  };

  /**
   * Initiates or cancels the selection of a trace location point from the map based on the specified type.
   * Updates the cursor style, attaches or removes the map click event handler, and manages the trace location state.
   *
   * @param {string} type - The type of point being selected ("startingPoint" or "barrier").
   */
  const handlePointSelection = (type) => {
    setIsSelectingPoint((prev) => {
      const newState = {
        startingPoint: type === "startingPoint" ? !prev.startingPoint : false,
        barrier: type === "barrier" ? !prev.barrier : false,
      };

      if (newState[type] && view) {
        // Change cursor
        view.cursor = "crosshair";

        // Attach the map click handler
        mapClickHandlerRef.current = view.on("click", async (event) => {
          try {
            const isTraceLocationSet = await setTraceLocation(
              type,
              view,
              event
            );

            if (isTraceLocationSet) {
              // Clear any previous error
              // dispatch(setTraceErrorMessage(null));
              // Clean up listeners and reset the cursor
              cleanupSelection();
            } else {
              console.warn("Failed to create trace location.");
            }
          } catch (error) {
            // dispatch(setTraceErrorMessage(error));
            showErrorToast(error);
            console.error("Error processing trace location:", error);
          }
        });
      } else {
        cleanupSelection();
      }

      return newState;
    });
  };

  /**
   * Identifies and sets a trace location on the map based on a user click event.
   * Performs a hit test to find intersecting features, extracts relevant attributes,
   * get additional attributes, and dispatches the selected trace point to trace.
   *
   * @param {string} type - The type of trace location ("startingPoint" or "barrier").
   * @param {Object} view - The ArcGIS map view instance.
   * @param {Object} mapEvent - The map click event containing geometry and screen coordinates.
   * @returns {Promise<boolean>} - Resolves to true if the trace location is successfully set; false otherwise.
   */
  const setTraceLocation = async (type, view, mapEvent) => {
    try {
      mapEvent.stopPropagation();
      // Check to see if any graphics in the view intersect the given screen x, y coordinates.
      const hitTestResult = await view.hitTest(mapEvent);

      if (!hitTestResult.results.length) {
        console.error("No hit test result.");
        // dispatch(setTraceErrorMessage("No hit test result."))
        showErrorToast("No hit test result.");
        return false;
      }

      const serverLayerIds = layersAndTablesData[0].layers.map(
        (layer) => layer.id
      );

      // Get the graphics that lies on utility network feature layers
      const featuresGraphics = hitTestResult.results.filter(
        (result) =>
          result.graphic.layer &&
          serverLayerIds.includes(result.graphic.layer.layerId)
      );

      if (!featuresGraphics.length) {
        console.error(
          "Cannot add point: The point must intersect with a feature on the map."
        );
        // dispatch(setTraceErrorMessage("Cannot add point: The point must intersect with a feature on the map."));
        showErrorToast(
          "Cannot add point: The point must intersect with a feature on the map."
        );
        return false;
      }

      const layerId = featuresGraphics[0].graphic.layer.layerId;
      const attributes = featuresGraphics[0].graphic.attributes;
      const globalId = getAttributeCaseInsensitive(attributes, "globalid");
      const assetGroup = getAttributeCaseInsensitive(attributes, "assetgroup");
      const assetType = getAttributeCaseInsensitive(attributes, "assettype");

      if (!assetGroup) {
        console.error(
          "Cannot add point: The selected point does not belong to any asset group."
        );
        // dispatch(setTraceErrorMessage("Cannot add point: The selected point does not belong to any asset group."));
        showErrorToast(
          "Cannot add point: The selected point does not belong to any asset group."
        );
        return false;
      }
      // Get terminal id for device/junction features
      const terminalId = getSelectedPointTerminalId(
        utilityNetwork,
        layerId,
        assetGroup,
        assetType
      );

      const pointGeometry = mapEvent.mapPoint;
      const feature = featuresGraphics[0].graphic.geometry;

      // Get percentAlong for line features
      const percentAlong = await getPercentAlong(pointGeometry, feature);

      const selectedTracePoint = new SelectedTracePoint(
        type,
        globalId,
        layerId,
        assetGroup,
        assetType,
        terminalId,
        percentAlong
      );

      addPointToTrace(
        utilityNetwork,
        selectedPoints,
        selectedTracePoint,
        pointGeometry,
        traceGraphicsLayer,
        dispatch
      );
      return true;
    } catch (error) {
      console.error("An error occurred while getting trace location:", error);
      showErrorToast(
        `An error occurred while getting trace location: ${error}`
      );
      return false;
    }
  };

  /**
   * Executes tracing operations for each selected starting point using the selected trace types.
   *
   * - Validates that at least one trace type and starting point are selected.
   * - Executes trace operations for each combination of starting point and selected trace type.
   * - Visualizes aggregated geometries returned by traces on map.
   * - Categorizes trace result elements by network source, asset group, and asset type.
   * - Dispatches trace results and highlights to Redux.
   * - Manages loading state and error handling.
   *
   * @returns {Promise<void>}
   */
  const handleTracing = async () => {
    let hasError = false;
    try {
      // Separate starting points and barriers from trace locations
      const startingPointsTraceLocations = traceLocations.filter(
        (loc) => loc.traceLocationType === "startingPoint"
      );
      const barriersTraceLocations = traceLocations.filter(
        (loc) => loc.traceLocationType === "barrier"
      );

      // To store trace result for each starting point
      const categorizedElementsByStartingPoint = {};

      // To store the graphic line colour of each trace configuration for each starting point
      const traceConfigHighlights = {};

      // Validate trace parameters are selected
      if (!selectedTraceTypes || selectedTraceTypes.length === 0) {
        // dispatch(setTraceErrorMessage("Please select a trace type."));
        showErrorToast("Please select a trace type.");
        hasError = true;
        return null;
      }
      if (startingPointsTraceLocations?.length === 0) {
        // dispatch(setTraceErrorMessage("Please select a starting point"));
        showErrorToast("Please select a starting point");
        hasError = true;
        return null;
      }

      // Show loading indicator
      setIsLoading(true);

      // Execute trace for each starting point
      for (const startingPoint of startingPointsTraceLocations) {
        const oneStartingPointTraceLocations = [
          startingPoint,
          ...barriersTraceLocations,
        ];
        // Execute all traces
        const tracePromises = selectedTraceTypes.map(async (configId) => {
          const traceParameters = await getTraceParameters(
            configId,
            oneStartingPointTraceLocations
          );
          const networkServiceUrl = utilityNetwork.networkServiceUrl;

          return {
            traceResult: await executeTrace(networkServiceUrl, traceParameters),
            configId: configId,
          };
        });

        const traceResults = await Promise.all(tracePromises);
        const categorizedElementsbyTraceType = {};

        // Clear previous error if validation passes
        // dispatch(setTraceErrorMessage(null));

        traceResults.forEach(({ traceResult, configId }) => {
          // Find starting point name
          const match = selectedPoints.StartingPoints.find(
            ([, id]) => id === startingPoint.globalId
          );
          const displayName = match ? match[0] : startingPoint.globalId;

          // Find the config object to get the title
          const traceConfig = traceConfigurations.find(
            (config) => config.globalId === configId
          );
          const traceTitle = traceConfig?.title || configId; // fallback if title not found

          // console.log(
          //   `Trace completed for ${traceTitle} with ID ${configId}-- TRACE RESULT`,
          //   traceResult
          // );

          // Add trace results geometry on map if found
          if (traceResult.aggregatedGeometry) {
            const graphicId = startingPoint.globalId + traceTitle;
            const spatialReference = utilityNetwork.spatialReference;

            visualiseTraceGraphics(
              traceResult,
              spatialReference,
              traceGraphicsLayer,
              traceConfigHighlights,
              graphicId
            );
          } else {
            console.warn("No Aggregated geometry returned", traceResult);
            showInfoToast(
              `No Aggregated geometry returned for ${traceTitle} by ${displayName}`
            );
          }

          if (!traceResult.elements) {
            // dispatch(setTraceErrorMessage(`No trace result elements returned for  ${traceTitle}.`));
            showErrorToast(
              `No trace result elements returned for  ${traceTitle}.`
            );
            return null;
          }

          if (traceResult.elements.length === 0) {
            showInfoToast(
              `No elements returned for ${traceTitle} by ${displayName}`
            );
          }

          // Categorize elements by network source, asset group, and asset type from the trace resultand store per trace type
          categorizedElementsbyTraceType[traceTitle] =
            categorizeTraceResult(traceResult);
        });

        categorizedElementsByStartingPoint[startingPoint.globalId] =
          categorizedElementsbyTraceType;

        if (
          categorizedElementsByStartingPoint &&
          Object.keys(categorizedElementsByStartingPoint).length > 0
        ) {
          hasError = false;
        }

        // Dispatch trace results and graphics highlights to Redux
        dispatch(setTraceResultsElements(categorizedElementsByStartingPoint));
        dispatch(setTraceConfigHighlights(traceConfigHighlights));
      }
    } catch (error) {
      console.error("Error during tracing:", error);
      // dispatch(setTraceErrorMessage(`Error Tracing: ${error.message}`));
      showErrorToast(`Error Tracing: ${error.message}`);
      hasError = true;
    } finally {
      // Hide the loading indicator
      setIsLoading(false);
      // const hasError = traceErrorMessage || !traceLocations.length;
      if (!hasError) {
        showSuccessToast("Trace run successfully");
        setActiveTab("result");
      }
    }
  };

  return (
    <div className="trace-input">
      <div className="trace-header">
        <h4>{t("Trace")}</h4>
        <img
          src={close}
          alt="close"
          className="cursor-pointer"
          onClick={() => setActiveButton("")}
        />
      </div>
      <div className="trace-body">
        {/* Dropdown */}
        <label>{t("Trace Type")} (3)</label>
        <Select
          className="trace-type-dropdown"
          options={traceConfigurations.map((config) => ({
            value: config.globalId,
            label: config.title,
          }))}
          isMulti
          // value={selectedTraceTypesInput}
          value={traceConfigurations
            .filter((config) => selectedTraceTypes.includes(config.globalId))
            .map((config) => ({
              value: config.globalId,
              label: config.title,
            }))}
          onChange={(selectedOptions) => {
            // setSelectedTraceTypesInput(selectedOptions);
            // console.log("Selected trace types:", selectedOptions);

            // Dispatch just the global IDs as an array
            const selectedGlobalIds = selectedOptions.map(
              (option) => option.value
            );
            // console.log("Selected trace config IDs:", selectedGlobalIds);
            dispatch(setSelectedTraceTypes(selectedGlobalIds));

            // dispatch(setTraceErrorMessage(null));
            // setSelectedTraceTypes(selectedGlobalIds);
          }}
          placeholder="Select"
          closeMenuOnSelect={false}
        />

        {/* Starting Point Section */}
        <div className="points-container">
          <div className="point-header">
            <span className="point-type">{t("Starting Points")}</span>
            <button
              onClick={() => handlePointSelection("startingPoint", view)}
              className="point-btn"
            >
              {isSelectingPoint.startingPoint ? "✖" : t("+ Add from map")}
            </button>
          </div>

          {/* Conditional rendering */}
          {selectedPoints.StartingPoints.length > 0 ? (
            <div className="selected-section">
              {selectedPoints.StartingPoints.map(([assetgroup], index) => {
                const [prefix, ...nameParts] = assetgroup.split(" ");
                const name = nameParts.join(" ");
                return (
                  <div key={index} className="selected-point">
                    <span>
                      {direction === 'rtl' ? (
                        <>
                          <strong title={name}>
                            {name.length > 20 ? `${name.slice(0, 20)}..` : name}
                          </strong>
                          {prefix}
                        </>
                      ) : (
                        <>
                          {prefix}
                          <strong title={name}>
                            {name.length > 20 ? `${name.slice(0, 20)}..` : name}
                          </strong>
                        </>
                      )}
                    </span>
                    <div className="select-btn">
                      {/* <img src={document} alt="document" />
            <img src={plus} alt="plus" /> */}
                      <button
                        className="remove-point-btn"
                        onClick={() =>
                          handleRemovePoint("StartingPoints", index)
                        }
                      >
                        <img src={trash} alt="trash" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="nodata-select">
              <span>{t("No Selection")}</span>
              <img src={selection} alt="select" />
            </div>
          )}
        </div>

        {/* Barrier Section */}
        <div className="points-container">
          <div className="point-header">
            <span className="point-type">{t("Barriers")}</span>
            <button
              onClick={() => handlePointSelection("barrier")}
              className="point-btn"
            >
              {isSelectingPoint.barrier ? "✖" :  t("+ Add from map")}
            </button>
          </div>

          {selectedPoints.Barriers.length > 0 ? (
            <div className="selected-section">
              {selectedPoints.Barriers.map(([assetgroup], index) => {
                const [prefix, ...nameParts] = assetgroup.split(" ");
                const name = nameParts.join(" ");
                return (
                  <div key={index} className="selected-point">
                    <span>
                      {direction === 'rtl' ? (
                        <>
                          <strong title={name}>
                            {name.length > 20 ? `${name.slice(0, 20)}..` : name}
                          </strong>
                          {prefix}
                        </>
                      ) : (
                        <>
                          {/* {assetgroup} */}
                          {prefix}
                          <strong title={name}>
                            {name.length > 20 ? `${name.slice(0, 20)}..` : name}
                          </strong>
                        </>
                      )}
                    </span>
                    <div className="select-btn">
                      {/* <img src={document} alt="document" />
            <img src={plus} alt="plus" /> */}
                      <button
                        className="remove-point-btn"
                        onClick={() => handleRemovePoint("Barriers", index)}
                      >
                        <img src={trash} alt="trash" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="nodata-select">
              <span>{t("No Selection")}</span>
              <img src={selection} alt="select" />
            </div>
          )}
        </div>

        {/* History Section */}
        <div className="btn-tracing">
          <img src={copy} alt="copy" />

          <h4>{t("Tracing History")}</h4>
        </div>
        {/* Validation Message */}
        {traceErrorMessage && (
          <div className="validation-message">{traceErrorMessage}</div>
        )}

        {/* Loader */}
        {isLoading && (
          <div className="trace-loader-container">
            <div className="trace-loader"></div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="action-btns">
        <button className="reset" onClick={handleReset}>
          <img src={reset} alt="reset" />
          {t("Reset")}
        </button>
        <button
          className="trace"
          onClick={() => handleTracing()}
          disabled={isLoading}
        >
          {isLoading ? t("Tracing...") : t("Run")}
        </button>
      </div>
    </div>
  );
}
