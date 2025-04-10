import "./TraceInput.scss";
import Select from 'react-select';
import { React, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {TraceLocation } from './models';
import {getTraceParameters, addingPointHandler} from './traceHandlers';
import {
  removeTracePoint,
  setCategorizedElements,
  addTraceLocation,
  addTraceSelectedPoint,
  setSelectedTraceTypes,
  clearTraceErrorMessage,
  setTraceErrorMessage,
  clearTraceSelectedPoints,
  clearTraceGraphicsLayer,
  setTraceGraphicsLayer,
  setTraceConfigHighlights
} from "../../../../redux/widgets/trace/traceAction";
import {
  // getTraceParameters,
  createGraphic,
  createGraphicsLayer,
  executeTrace,
} from "../../../../handlers/esriHandler";


export default function TraceInput({isSelectingPoint,
  setIsSelectingPoint,
  mapClickHandlerRef}) {


  const viewSelector = useSelector((state) => state.mapViewReducer.intialView);
  const webMapSelector = useSelector((state) => state.mapViewReducer.intialWebMap);
  const traceConfigurations = useSelector((state) => state.traceReducer.traceConfigurations);
  const utilityNetworkServiceUrl = useSelector((state) => state.traceReducer.utilityNetworkServiceUrl);
  const selectedTraceTypes = useSelector((state) => state.traceReducer.selectedTraceTypes);
  const selectedPoints = useSelector((state) => state.traceReducer.selectedPoints);
  const traceLocations = useSelector((state) => state.traceReducer.traceLocations);
  const spatialReference = useSelector((state) => state.traceReducer.utilityNetworkSpatialReference);
  const traceErrorMessage = useSelector((state) => state.traceReducer.traceErrorMessage);
  const graphicsLayer = useSelector((state) => state.traceReducer.traceGraphicsLayer);
  const dispatch = useDispatch();

  let highlightHandle = null;
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Cleans up selection state, event listeners, and highlights.
   * @param {Object} view - The ArcGIS map view.
   */
  const cleanupSelection = (view) => {
    if (view) view.cursor = "default"; // Reset cursor
    // Remove map click listener
    if (mapClickHandlerRef.current) {
      mapClickHandlerRef.current.remove();
      mapClickHandlerRef.current = null;
    }

    // // Remove pointer move listener
    // if (pointerMoveHandlerRef.current) {
    //   pointerMoveHandlerRef.current.remove();
    //   pointerMoveHandlerRef.current = null;
    // }

    // // Remove highlight
    // if (highlightHandle) {
    //   highlightHandle.remove();
    //   highlightHandle = null;
    // }

    // Reset selection state
    setIsSelectingPoint({ startingPoint: false, barrier: false });
    dispatch(clearTraceErrorMessage());
  };


  /**
   * Handles pointer move events to highlight features on the map.
   * @param {Event} event - The pointer move event.
   */
  const handlePointerMove = async (event) => {
    if (!viewSelector) return;

    const response = await viewSelector.hitTest(event);
    if (response.results.length > 0) {
      const feature = response.results[0].graphic;

      if (feature && feature.layer && feature.layer.type === "feature") {
        // Get the layer view
        const layerView = await viewSelector.whenLayerView(feature.layer);

        if (layerView) {
          if (highlightHandle) {
            highlightHandle.remove(); // Remove previous highlight
          }

          // Highlight the feature
          highlightHandle = layerView.highlight(feature);
        }
      }
    } else {
      if (highlightHandle) {
        highlightHandle.remove();
        highlightHandle = null;
      }
    }
  };


  /**
   * Creates a trace location and dispatches it to Redux.
   * @param {string} type - The type of trace location (e.g., "startingPoint" or "barrier").
   * @param {Object} view - The ArcGIS map view.
   * @param {Object} mapEvent - The map click event.
   * @returns {Bool} - True if trace location was created.
   */
  const setTraceLocations = async (type, view, mapEvent) => {
    try {
      const params = { type, view, mapEvent };

      for (const [key, value] of Object.entries(params)) {
        if (!value) {
          console.error(`Missing parameter: ${key}`);
          return false;
        }
      }


      // Get the globalId and electricLinesLayer of the selected point
      const { selectedPointGlobalId, selectedPointAssetGroup, electricLinesLayer, error } =
        await getSelectedPoint(view, mapEvent);

      if (error || !selectedPointGlobalId || !selectedPointAssetGroup || !electricLinesLayer) {
        if (error) dispatch(setTraceErrorMessage(error));
        return false;
      }


      // Define percentage along line to place trace location.
      const myPercentageAlong = window.traceConfig.TraceSettings.percentageAlong;

      // Create a new TraceLocation instance
      const selectedPointTraceLocation = new TraceLocation(
        type,
        selectedPointGlobalId,
        myPercentageAlong
      );
      
      // Create the new point
      const newPoint = [selectedPointAssetGroup, selectedPointGlobalId];

      // Variable to store where the duplicate was found
      let duplicateType = null;
          
      // Check for duplicate and capture its type
      const isDuplicate = Object.entries(selectedPoints).some(
        ([pointType, pointsArray]) => {
          const found = pointsArray.some(
            ([, existingGlobalId]) => existingGlobalId === selectedPointGlobalId
          );
          if (found) {
            duplicateType = pointType;
            return true;
          }
          return false;
        }
      );

    if (isDuplicate) {
      console.log(`Duplicate point found in "${duplicateType}", skipping dispatch.`);
      dispatch(setTraceErrorMessage(`You already using this point in ${duplicateType}.`));
      return false;
    }

      // Clear previous error if validation passes
      dispatch(clearTraceErrorMessage());
      // Dispatch the trace location to Redux
      dispatch(addTraceLocation(selectedPointTraceLocation));
      // Dispatch the selected point to Redux
      dispatch(addTraceSelectedPoint(type, newPoint));

      return true;

    } catch (error) {
      console.error("An error occurred while getting trace locations:", error);
      return false;
    }
  };


  /**
   * Handles the selection of points (startingPoint or barrier) on the map.
   * @param {string} type - The type of point (startingPoint or barrier).
   * @param {Object} view - The ArcGIS map view.
   */
  const handlePointSelection = (type, view) => {
    setIsSelectingPoint((prev) => {
      const newState = {
        startingPoint: type === "startingPoint" ? !prev.startingPoint : false,
        barrier: type === "barrier" ? !prev.barrier : false,
      };

      if (newState[type] && view) {
        view.cursor = "crosshair";

        // Attach the map click handler
        mapClickHandlerRef.current = view.on("click", async (event) => {
          try {
            const { isTraceLocationSet } = await setTraceLocations(type, view, event);
      
            if (isTraceLocationSet) {
              // Reset the selection state after a point is added
              setIsSelectingPoint({ startingPoint: false, barrier: false });
      
              // Clean up listeners and reset the cursor
              cleanupSelection(view);
            } else {
              console.warn("Failed to create trace location.");
            }
          } catch (error) {
            dispatch(setTraceErrorMessage(error));
            console.error("Error processing trace location:", error);
          }
          
        });

        // // Attach the pointer move handler
        // pointerMoveHandlerRef.current = view.on(
        //   "pointer-move",
        //   handlePointerMove
        // );


        addingPointHandler(selectedPoints, traceLocations);
        console.log('khalast w geet');
      } else {
        cleanupSelection(view);
      }

      return newState;
    });
  };


  /**
   * Handles the removal of a selected point.
   * @param {string} type - The type of point (StartingPoints or Barriers).
   * @param {number} index - The index of the point to remove.
   */
  const handleRemovePoint = (type, index) => {
    let globalId;

    if (type === "StartingPoints") {
      globalId = selectedPoints.StartingPoints[index]?.[1];
    } else if (type === "Barriers") {
      globalId = selectedPoints.Barriers[index]?.[1];
    }

    if (globalId) {
      dispatch(removeTracePoint( globalId ));

    }
  };


  /**
   * Resets the trace input state and clears the map.
   */
  const handleReset = () => {
    // Reset Redux state
    dispatch(setCategorizedElements({}));
    dispatch(clearTraceSelectedPoints());
    dispatch(clearTraceErrorMessage());
    dispatch(setSelectedTraceTypes([])); 

    // Reset local states
    setIsSelectingPoint({ startingPoint: false, barrier: false });

    // Clear graphics layer from the map and Redux
    if (graphicsLayer && webMapSelector) {
      webMapSelector.remove(graphicsLayer);
      dispatch(clearTraceGraphicsLayer());
    }
  };


  // Function to pick a random color from the available colors in window.traceConfig
  const getRandomColor = () => {
    const colors = window.traceConfig.TraceGraphicColors;
    const colorKeys = Object.keys(colors);
    const randomKey = colorKeys[Math.floor(Math.random() * colorKeys.length)];
    return colors[randomKey]; 
  };



  /**
   * Executes the trace operation.
   */
  const handleTracing = async () => {
    try {
      if (!selectedTraceTypes || selectedTraceTypes.length === 0) {
        dispatch(setTraceErrorMessage("Please select a trace type."));
        return null;
      }

      // Clear previous graphics layer from the map
      if (graphicsLayer && webMapSelector) {
        webMapSelector.remove(graphicsLayer);
        dispatch(clearTraceGraphicsLayer());
      }

      // Show loading indicator
      setIsLoading(true);
      
      // Add new graphics layer for results
      const traceResultsGraphicsLayer = await createGraphicsLayer();      
      // traceResultsGraphicsLayer.when(()=>{
        
      viewSelector.map.add(traceResultsGraphicsLayer); // Add it to the WebMap
      dispatch(setTraceGraphicsLayer(traceResultsGraphicsLayer));

      
      // Execute all traces
      const tracePromises = selectedTraceTypes.map(async (configId) => {
          const traceParameters = await getTraceParameters(configId, traceLocations);
          
          console.log('Trace Locations List', traceLocations)
          console.log('Trace Parameters', traceParameters,utilityNetworkServiceUrl)
      
          return {
              traceResult: await executeTrace(
                  utilityNetworkServiceUrl,
                  traceParameters
                ),
              configId: configId
          };
      });
      const traceResults = await Promise.all(tracePromises);

      // Clear previous error if validation passes
      dispatch(clearTraceErrorMessage());

      const allCategorizedElements = {};
      const traceConfigHighlights = {};

      traceResults.forEach(({traceResult, configId}) => {
        console.log(`Trace completed for ${configId}:`, traceResult);

      
        // Find the config object to get the title
        const traceConfig = traceConfigurations.find(config => config.globalId === configId);
        const traceTitle = traceConfig?.title || configId; // fallback if title not found


        // Assign a random color for this configId if not already assigned
        if (!traceConfigHighlights[traceTitle]) {
          traceConfigHighlights[traceTitle] = getRandomColor(); // Assign a random color
        }

        visualiseTraceGraphics(traceResult, spatialReference, traceResultsGraphicsLayer, traceConfigHighlights[traceTitle], traceTitle);


        // Extract and categorize elements from the trace result
          const extractedElements = traceResult.elements.map(element => {
          const elementData = {};

          // Extract only enumerable properties
          for (let key in element) {
              elementData[key] = element[key];
          }

          return elementData;
          });

          const categorizedElements = {};

          extractedElements.forEach(element => {
            const networkSource = element.networkSourceId || "Unknown";
            const assetGroup = element.assetGroupCode || "Unknown";
            const assetType = element.assetTypeCode || "Unknown";

            // Initialize networkSource if not exists
            if (!categorizedElements[networkSource]) {
                categorizedElements[networkSource] = {};
            }

            // Initialize assetGroup inside networkSource if not exists
            if (!categorizedElements[networkSource][assetGroup]) {
                categorizedElements[networkSource][assetGroup] = {};
            }

            // Initialize assetType inside assetGroup if not exists
            if (!categorizedElements[networkSource][assetGroup][assetType]) {
                categorizedElements[networkSource][assetGroup][assetType] = [];
            }

            // Push the element to its respective category
            categorizedElements[networkSource][assetGroup][assetType].push(element);
          });

          // Dispatch categorized elements to Redux
          // dispatch(setCategorizedElements(categorizedElements));


          // Store categorized elements per configId
          allCategorizedElements[traceTitle] = categorizedElements;
      });
      // Dispatch categorized elements to Redux
      console.log("allCategorizedElements", allCategorizedElements);
      
      console.log("traceConfigHighlights",traceConfigHighlights);
      
      dispatch(setCategorizedElements(allCategorizedElements));
      dispatch(setTraceConfigHighlights(traceConfigHighlights));
    } catch (error) {
      console.error("Error during tracing:", error);
      dispatch(setTraceErrorMessage(`Error Tracing: ${error.message}`));
    } finally {
      // Hide the loading indicator
      setIsLoading(false);
    }
  };


/**
 * Visualizes the results of a trace operation on a map by adding appropriate graphics.
 * This function processes the trace results and creates either multipoint or polyline graphics
 * based on the geometry provided, and then adds them to a specified graphics layer.
 *
 * @param {Object} traceResult - The trace result containing the aggregated geometry to be visualized. 
 *                               It may include multipoint or polyline data.
 * @param {Object} spatialReference - The spatial reference of the map, used to ensure the graphics are placed correctly.
 * @param {Object} traceResultsGraphicsLayer - The graphics layer where the trace results will be added.
 * @param {string} lineColor - The color to be applied to the polyline graphic.
 * @param {string} traceTitle - The title or identifier for the trace, used for labeling or further reference.
 */
  const visualiseTraceGraphics = (
    traceResult,
    spatialReference,
    traceResultsGraphicsLayer,
    lineColor,
    traceTitle
  ) => {
    
    if (!traceResult || !spatialReference || !traceResultsGraphicsLayer) {
      console.error("Invalid parameters provided to addTraceGraphics.");
      return;
    }

    // Display the aggregated geometry results on the map
    if (traceResult.aggregatedGeometry) {
      // Display results on the map.
      if (traceResult.aggregatedGeometry.multipoint) {

        createGraphic(
          {
            type: "multipoint",
            points: traceResult.aggregatedGeometry.multipoint.points,
          },
          window.traceConfig.Symbols.multipointSymbol,
          spatialReference
        ).then((multipointGraphic) => {          
          traceResultsGraphicsLayer.graphics.add(multipointGraphic);
        });
      }

      if (traceResult.aggregatedGeometry.line) {
        createGraphic(
          {
            type: "polyline",
            paths: traceResult.aggregatedGeometry.line.paths,
          },
          {
            type: window.traceConfig.Symbols.polylineSymbol.type,
            color: lineColor,
            width: window.traceConfig.Symbols.polylineSymbol.width
          },
          // window.traceConfig.Symbols.polylineSymbol
          spatialReference, 
          traceTitle
        ).then((polylineGraphic) => {
          traceResultsGraphicsLayer.graphics.add(polylineGraphic);
        });
      }
    }
  };


  /**
   * Retrieves the globalId and graphics of the selected point from the map.
   * @param {Object} view - The ArcGIS map view.
   * @param {Object} mapEvent - The map click event.
   * @returns {Object} - An object containing the selected point's globalId and graphics.
   */
  const getSelectedPoint = async (view, mapEvent) => {
    let error = "";
    try {
      // Prevent the event bubbling up the event chain.
      mapEvent.stopPropagation();
      
      // Check to see if any graphics in the view intersect the given screen x, y coordinates.
      const hitTestResult = await view.hitTest(mapEvent);

      console.log(hitTestResult, "hitTestResult")

      if (!hitTestResult.results.length) {
        error = "No hit test result."
        console.warn("No hit test result.");
        // dispatch(setTraceErrorMessage("No features found at the clicked location."))
        return {
          selectedPointGlobalId: null,
          selectedPointAssetGroup: null,
          electricLinesLayer: null,
          error
        };
      }

      // Get Electric Distribution Line features only by using the Layer Id.
      const electricLinesLayer = hitTestResult.results.filter(
        (result) =>
          result.graphic.layer &&
          // result.graphic.layer.id === "6e075873ce1545a4aaa52cf39509e467"
          result.graphic.layer.layerId === 3
      );


      if (!electricLinesLayer.length) {
        error = "No valid Line feature found at the clicked location.";
        console.warn("No valid Line feature found at the clicked location.");
        // dispatch(setTraceErrorMessage("No valid Line feature found at the clicked location."))
        return {
          selectedPointGlobalId: null,
          selectedPointAssetGroup: null,
          electricLinesLayer: null,
          error
        };
      }

      // Query All the feature layer attributes of the graphics selected
      const featureLayer = electricLinesLayer[0].graphic.layer;
      const query = featureLayer.createQuery();
      query.where = `objectid = ${electricLinesLayer[0].graphic.attributes.objectid}`;
      query.returnGeometry = false;
      query.outFields = ["*"]; // Ensure all attributes are returned

      const queryResult = await featureLayer.queryFeatures(query);

      // Check if the query returned any features
      if (queryResult.features.length > 0) {
        return {
          selectedPointGlobalId: queryResult.features[0].attributes.globalid,
          selectedPointAssetGroup: queryResult.features[0].attributes.assetgroup,
          electricLinesLayer: electricLinesLayer,
          error: null
        };
      } else {
        error = "No feature found in query.";
        console.warn("No feature found in query.");
        return {
          selectedPointGlobalId: null,
          selectedPointAssetGroup: null,
          electricLinesLayer: null,
          error
        };
      }
    } catch (e) {
      // Handle any unexpected errors
      console.error("An error occurred while retrieving the selected point attributes:", e);
      return { selectedPointGlobalId: null, electricLinesLayer: null, error: e };
    }
  };


  return (
    <div className="trace-input">
      <h4>Enter Trace Parameters</h4>

      {/* Dropdown */}
      <label>Select Trace Type:</label>
      <Select
        className="trace-type-dropdown"
        options={traceConfigurations.map(config => ({
            value: config.globalId,
            label: config.title
        }))}
        isMulti
        // value={selectedTraceTypesInput}
        value={traceConfigurations.filter(config => selectedTraceTypes.includes(config.globalId)).map(config => ({
            value: config.globalId,
            label: config.title
        }))}
        
        onChange={(selectedOptions) => {
            // setSelectedTraceTypesInput(selectedOptions);
            // console.log("Selected trace types:", selectedOptions);
            
           // Dispatch just the global IDs as an array
            const selectedGlobalIds = selectedOptions.map(option => option.value);
            console.log("Selected trace config IDs:", selectedGlobalIds);
            dispatch(setSelectedTraceTypes(selectedGlobalIds));
            // setSelectedTraceTypes(selectedGlobalIds);
        }}
        placeholder="-- Select --"
        closeMenuOnSelect={false}
        />

      {/* Starting Point Section */}
      <div className="points-container">
        <div className="point-header">
          <span className="point-type">Starting Points</span>
          <button
            onClick={() => handlePointSelection("startingPoint", viewSelector)}
            className="point-btn"
          >
            {isSelectingPoint.startingPoint ? "✖" : "+"}
          </button>
        </div>

        {/* Display selected starting points */}
        {selectedPoints.StartingPoints.length > 0 ? (
          selectedPoints.StartingPoints.map(([assetgroup], index) => (
            <div key={index} className="selected-point">
              <span>
                <strong>assetgroup:</strong> {assetgroup}
              </span>
              <button
                className="remove-point-btn"
                onClick={() => handleRemovePoint("StartingPoints", index)}
              >
                ✖
              </button>
            </div>
          ))
        ) : (
          <></>
        )}
      </div>

      {/* Barrier Section */}
      <div className="points-container">
        <div className="point-header">
          <span className="point-type">Barriers</span>
          <button
            onClick={() => handlePointSelection("barrier", viewSelector)}
            className="point-btn"
          >
            {isSelectingPoint.barrier ? "✖" : "+"}
          </button>
        </div>

        {/* Display selected barriers */}
        {selectedPoints.Barriers.length > 0 ? (
          selectedPoints.Barriers.map(([assetgroup], index) => (
            <div key={index} className="selected-barrier">
              <span>
                <strong>assetgroup:</strong> {assetgroup}
              </span>
              <button
                className="remove-point-btn"
                onClick={() => handleRemovePoint("Barriers", index)}
              >
                ✖
              </button>
            </div>
          ))
        ) : (
          <></>
        )}
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

      {/* Action Buttons */}
      <div className="action-btns">
        <button
          className="trace"
          onClick={() => handleTracing()}
          disabled={isLoading}
        >
          {isLoading ? "Tracing..." : "Trace"}
        </button>
        <button className="reset" onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
