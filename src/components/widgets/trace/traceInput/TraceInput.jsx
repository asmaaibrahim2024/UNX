import "./TraceInput.scss";
import Select from 'react-select';
import { React, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
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
  getTraceParameters,
  createGraphic,
  createGraphicsLayer,
  executeTrace,
} from "../../../../handlers/esriHandler";

export default function TraceInput() {


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

  
  const mapClickHandlerRef = useRef(null);
  const pointerMoveHandlerRef = useRef(null);

  // const [selectedTraceTypeInput, setSelectedTraceTypeInput] = useState(
  //   selectedTraceTypes?.globalId || ""
  // );
  const [isSelectingPoint, setIsSelectingPoint] = useState({startingPoint: false, barrier: false});
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handles the selection of a trace type from the dropdown.
   * @param {Event} e - The change event from the dropdown.
   */
  // const handleTraceTypeSelectChange = (e) => {
  //   const selectedId = e.target.value;
  //   setSelectedTraceTypeInput(selectedId);

  //   // Find the selected configuration
  //   const selectedConfig = traceConfigurations.find(
  //     (config) => config.globalId === selectedId
  //   );

  //   // Dispatch the selected trace type to Redux
  //   if (selectedConfig) {
  //     dispatch(setSelectedTraceTypes(selectedConfig));
  //   }
  // };


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

    // Remove pointer move listener
    if (pointerMoveHandlerRef.current) {
      pointerMoveHandlerRef.current.remove();
      pointerMoveHandlerRef.current = null;
    }

    // Remove highlight
    if (highlightHandle) {
      highlightHandle.remove();
      highlightHandle = null;
    }

    // Reset selection state
    setIsSelectingPoint({ startingPoint: false, barrier: false });
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
   * Handles map click events to add trace locations.
   * @param {string} type - The type of point (startingPoint or barrier).
   * @param {Object} view - The ArcGIS map view.
   * @param {Event} event - The map click event.
   */
  const handleMapClick = async (type, view, event) => {
    try {
      const { selectedPointTraceLocation } = await getTraceLocations(
        type,
        view,
        event
      );

      if (selectedPointTraceLocation) {
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
  };


  /**
   * Creates a trace location and dispatches it to Redux.
   * @param {string} type - The type of trace location (e.g., "startingPoint" or "barrier").
   * @param {Object} view - The ArcGIS map view.
   * @param {Object} mapEvent - The map click event.
   * @param {Function} dispatch - The Redux dispatch function.
   * @returns {Object} - An object containing the created trace location.
   */
  const getTraceLocations = async (type, view, mapEvent) => {
    try {
      // Validate input parameters
      if (!type || !view || !mapEvent) {
        console.error("Invalid input parameters provided.");
        return { selectedPointTraceLocation: null };
      }

      // Get the globalId and electricLinesLayerGraphics of the selected point
      const { selectedPointGlobalId, electricLinesLayerGraphics } =
        await getSelectedPointGlobalId(view, mapEvent);

      // Check if valid globalId and graphics were returned
      if (!selectedPointGlobalId || !electricLinesLayerGraphics) {
        console.warn(
          "No valid globalId or graphics found for the selected point."
        );
        dispatch(
          setTraceErrorMessage(
            "No valid globalId or graphics found for the selected point."
          )
        );
        return { selectedPointTraceLocation: null };
      }

      // Clear previous error if validation passes
      dispatch(clearTraceErrorMessage());

      // Define percentage along line to place trace location.
      const myPercentageAlong = window.traceConfig.TraceSettings.percentageAlong;


      // Create trace location (starting point).
      let selectedPointTraceLocation = {
        traceLocationType: type,
        globalId: selectedPointGlobalId,
        percentAlong: myPercentageAlong,
      };

      // Dispatch the trace location to Redux
      dispatch(addTraceLocation(selectedPointTraceLocation));

      // Extract objectId from the selected graphic
      const objectId =
        electricLinesLayerGraphics[0].graphic.attributes.objectid;

      // Create the new point
      const newPoint = [objectId, selectedPointGlobalId];

      // Dispatch the selected point to Redux
      dispatch(addTraceSelectedPoint(type, newPoint));

      // Return the created trace location object
      return { selectedPointTraceLocation };
    } catch (error) {
      console.error("An error occurred while getting trace locations:", error);
      return { selectedPointTraceLocation: null };
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
        mapClickHandlerRef.current = view.on("click", (event) => {
          handleMapClick(type, view, event); // Call handleMapClick on actual map click
        });

        // Attach the pointer move handler
        pointerMoveHandlerRef.current = view.on(
          "pointer-move",
          handlePointerMove
        );
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
    // setSelectedTraceTypeInput("");
    setIsSelectingPoint({ startingPoint: false, barrier: false });

    // Clear graphics layer from the map and Redux
    if (graphicsLayer && webMapSelector) {
      webMapSelector.remove(graphicsLayer);
      dispatch(clearTraceGraphicsLayer());
    }
  };

  // // Function to pick a random color from the available colors
  // const getRandomColor = () => {
  //   const availableColors = [
  //     'rgba(0, 0, 255, 1)',    // Blue
  //     'rgba(0, 255, 0, 1)',    // Green
  //     'rgba(255, 255, 0, 1)',  // Yellow
  //     'rgba(255, 165, 0, 1)'   // Orange
  //   ];
  //   return availableColors[Math.floor(Math.random() * availableColors.length)];
  // };

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
    if (!selectedTraceTypes || selectedTraceTypes.length === 0) {
      dispatch(setTraceErrorMessage("Please select a trace type."));
      return null;
    }

    // const traceParameters =await getTraceParameters(
    //   selectedTraceTypes.globalId,
    //   traceLocations
    // );
    try {
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

  // Listen for when the GraphicsLayer is fully loaded in the view
// viewSelector.whenLayerView(traceResultsGraphicsLayer).then(() => {
//   visualiseTraceGraphics(traceResult, spatialReference, traceResultsGraphicsLayer);
// });
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
  const getSelectedPointGlobalId = async (view, mapEvent) => {
    try {
      // Prevent the event bubbling up the event chain.
      mapEvent.stopPropagation();
      
      // Check to see if any graphics in the view intersect the given screen x, y coordinates.
      const hitTestResult = await view.hitTest(mapEvent);

      if (!hitTestResult.results.length) {
        console.warn("No features found at the clicked location.");
        dispatch(setTraceErrorMessage("No features found at the clicked location."))
        return {
          selectedPointGlobalId: null,
          electricLinesLayerGraphics: null,
        };
      }

      // Get Electric Distribution Line features only by using the Layer Id.
      const electricLinesLayerGraphics = hitTestResult.results.filter(
        (result) =>
          result.graphic.layer &&
          result.graphic.layer.id === "6e075873ce1545a4aaa52cf39509e467"
      );

      if (!electricLinesLayerGraphics.length) {
        console.warn("No valid Line feature found at the clicked location.");
        return {
          selectedPointGlobalId: null,
          electricLinesLayerGraphics: null,
        };
      }

      // Query All the feature layer attributes of the graphics selected
      const featureLayer = electricLinesLayerGraphics[0].graphic.layer;
      const query = featureLayer.createQuery();
      query.where = `objectid = ${electricLinesLayerGraphics[0].graphic.attributes.objectid}`;
      query.returnGeometry = false;
      query.outFields = ["*"]; // Ensure all attributes are returned

      const queryResult = await featureLayer.queryFeatures(query);

      // Check if the query returned any features
      if (queryResult.features.length > 0) {
        return {
          selectedPointGlobalId: queryResult.features[0].attributes.globalid,
          electricLinesLayerGraphics: electricLinesLayerGraphics,
        };
      } else {
        console.warn("No feature found in query.");
        return {
          selectedPointGlobalId: null,
          electricLinesLayerGraphics: null,
        };
      }
    } catch (error) {
      // Handle any unexpected errors
      console.error(
        "An error occurred while retrieving the selected point Global ID:",
        error
      );
      return { selectedPointGlobalId: null, electricLinesLayerGraphics: null };
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
        }}
        placeholder="-- Select --"
        closeMenuOnSelect={false}
        />

      {/* Starting Point Section */}
      <div className="points-container">
        <div className="point-header">
          <span className="point-type">startingPoint</span>
          <button
            onClick={() => handlePointSelection("startingPoint", viewSelector)}
            className="point-btn"
          >
            {isSelectingPoint.startingPoint ? "✖" : "+"}
          </button>
        </div>

        {/* Display selected starting points */}
        {selectedPoints.StartingPoints.length > 0 ? (
          selectedPoints.StartingPoints.map(([objectId], index) => (
            <div key={index} className="selected-point">
              <span>
                <strong>Object ID:</strong> {objectId}
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
          <span className="point-type">barrier</span>
          <button
            onClick={() => handlePointSelection("barrier", viewSelector)}
            className="point-btn"
          >
            {isSelectingPoint.barrier ? "✖" : "+"}
          </button>
        </div>

        {/* Display selected barriers */}
        {selectedPoints.Barriers.length > 0 ? (
          selectedPoints.Barriers.map(([objectId], index) => (
            <div key={index} className="selected-barrier">
              <span>
                <strong>Object ID:</strong> {objectId}
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
