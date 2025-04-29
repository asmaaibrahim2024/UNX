import "./TraceInput.scss";
import Select from 'react-select';
import { React, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {SelectedTracePoint} from '../models';
import { getAttributeCaseInsensitive, showErrorToast, showInfoToast, showSuccessToast } from "../../../../handlers/esriHandler";
import { getTraceParameters, visualiseTraceGraphics, getSelectedPointTerminalId, getPercentAlong, executeTrace, addPointToTrace, categorizeTraceResult} from '../traceHandler';
import { removeTracePoint, setTraceResultsElements, setSelectedTraceTypes, setTraceErrorMessage, clearTraceSelectedPoints, setTraceConfigHighlights} from "../../../../redux/widgets/trace/traceAction";

import close from '../../../../style/images/x-close.svg';
import selection from '../../../../style/images/selection-start.svg';
import copy from '../../../../style/images/copy.svg';
import reset from '../../../../style/images/refresh.svg';
import document from '../../../../style/images/document-text.svg';
import plus from '../../../../style/images/plus-circle.svg';



export default function TraceInput({ isSelectingPoint, setIsSelectingPoint, setActiveButton, setActiveTab, mapClickHandlerRef}) {

  const view = useSelector((state) => state.mapViewReducer.intialView);
  const layersAndTablesData = useSelector((state) => state.mapViewReducer.layersAndTablesData);
  const utilityNetwork = useSelector((state) => state.traceReducer.utilityNetworkIntial);
  const traceConfigurations = useSelector((state) => state.traceReducer.traceConfigurations);
  const selectedTraceTypes = useSelector((state) => state.traceReducer.selectedTraceTypes);
  const selectedPoints = useSelector((state) => state.traceReducer.selectedPoints);
  const traceLocations = useSelector((state) => state.traceReducer.traceLocations);
  const traceErrorMessage = useSelector((state) => state.traceReducer.traceErrorMessage);
  const traceGraphicsLayer = useSelector((state) => state.traceReducer.traceGraphicsLayer);
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
      dispatch(removeTracePoint( globalId ));
      // Remove point graphic from map
      const graphicToRemove = traceGraphicsLayer.graphics.find(g => g.attributes?.id === globalId);
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
            const isTraceLocationSet = await setTraceLocation(type, view, event);
      
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
  
      const serverLayerIds = layersAndTablesData[0].layers.map(layer => layer.id);
      
      // Get the graphics that lies on utility network feature layers
      const featuresGraphics = hitTestResult.results.filter(
        (result) =>
          result.graphic.layer &&
          serverLayerIds.includes(result.graphic.layer.layerId)
      );
      
      if (!featuresGraphics.length) {
        console.error("Cannot add point: The point must intersect with a feature on the map.");
        // dispatch(setTraceErrorMessage("Cannot add point: The point must intersect with a feature on the map."));
        showErrorToast("Cannot add point: The point must intersect with a feature on the map.");
        return false;
      }

      const layerId = featuresGraphics[0].graphic.layer.layerId
      const attributes = featuresGraphics[0].graphic.attributes;
      const globalId = getAttributeCaseInsensitive(attributes, 'globalid');
      const assetGroup = getAttributeCaseInsensitive(attributes, 'assetgroup');
      const assetType = getAttributeCaseInsensitive(attributes, 'assettype');

      if (!assetGroup) {
        console.error("Cannot add point: The selected point does not belong to any asset group.");
        // dispatch(setTraceErrorMessage("Cannot add point: The selected point does not belong to any asset group."));
        showErrorToast("Cannot add point: The selected point does not belong to any asset group.");
        return false;
      }
      // Get terminal id for device/junction features
      const terminalId = getSelectedPointTerminalId(utilityNetwork, layerId, assetGroup, assetType);
      
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
      )
      
      addPointToTrace(utilityNetwork, selectedPoints, selectedTracePoint, pointGeometry, traceGraphicsLayer, dispatch);
      return true;

    } catch (error) {
      console.error("An error occurred while getting trace location:", error);
      showErrorToast(`An error occurred while getting trace location: ${error}`);
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
    try {
      // Separate starting points and barriers from trace locations
      const startingPointsTraceLocations = traceLocations.filter(loc => loc.traceLocationType === "startingPoint");
      const barriersTraceLocations = traceLocations.filter(loc => loc.traceLocationType === "barrier");
      

      // To store trace result for each starting point
      const categorizedElementsByStartingPoint = {};

      // To store the graphic line colour of each trace configuration for each starting point
      const traceConfigHighlights = {};

      // Validate trace parameters are selected
      if (!selectedTraceTypes || selectedTraceTypes.length === 0) {
        // dispatch(setTraceErrorMessage("Please select a trace type."));
        showErrorToast("Please select a trace type.");
        return null;
      }
      if(startingPointsTraceLocations?.length === 0){
        // dispatch(setTraceErrorMessage("Please select a starting point"));
        showErrorToast("Please select a starting point");
        return null;
      } 

      // Show loading indicator
      setIsLoading(true);

      
      // Execute trace for each starting point
      for (const startingPoint of startingPointsTraceLocations) {
        const oneStartingPointTraceLocations = [startingPoint, ...barriersTraceLocations];
        // Execute all traces
        const tracePromises = selectedTraceTypes.map(async (configId) => {
            const traceParameters = await getTraceParameters(configId, oneStartingPointTraceLocations);
            const networkServiceUrl = utilityNetwork.networkServiceUrl;
              
              return {
                  traceResult: await executeTrace(
                      networkServiceUrl,
                      traceParameters
                    ),
                  configId: configId
              };
        });
    
        const traceResults = await Promise.all(tracePromises);
        const categorizedElementsbyTraceType = {};
        
        // Clear previous error if validation passes
        // dispatch(setTraceErrorMessage(null));


        traceResults.forEach(({traceResult, configId}) => {

          // Find the config object to get the title
          const traceConfig = traceConfigurations.find(config => config.globalId === configId);
          const traceTitle = traceConfig?.title || configId; // fallback if title not found
          
          // console.log(`Trace completed for ${traceTitle} with ID ${configId}-- TRACE RESULT`, traceResult);

          // Add trace results geometry on map if found 
          if(traceResult.aggregatedGeometry){
            
            const graphicId = startingPoint.globalId + traceTitle;
            const spatialReference = utilityNetwork.spatialReference;

            visualiseTraceGraphics(traceResult, spatialReference, traceGraphicsLayer, traceConfigHighlights, graphicId);
          } else {
            const match = selectedPoints.StartingPoints.find(
              ([, id]) => id === startingPoint.globalId
            );
            const displayName = match ? match[0] : startingPoint.globalId;
            console.warn("No Aggregated geometry returned", traceResult);
            showInfoToast(`No Aggregated geometry returned for ${traceTitle} from ${displayName}`);
            // toast.custom(
            //   <div style={{
            //     display: "flex",
            //     alignItems: "center",
            //     gap: "10px",
            //     backgroundColor: "#f0f7ff",
            //     border: "1px solid #3b82f6",
            //     color: "#1e40af",
            //     padding: "16px",
            //     borderRadius: "0.5rem",
            //     fontWeight: "100",
            //     fontSize: '0.85rem',
            //     boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
            //   }}>
            //     <FiInfo size={20} color="#3b82f6" />
            //     <span>{`No Aggregated geometry returned for ${traceTitle} from ${displayName}`}</span>
            //   </div>,
            //   { duration: 5000 }
            // );
            
          }

          if(!traceResult.elements){
            // dispatch(setTraceErrorMessage(`No trace result elements returned for  ${traceTitle}.`));
            showErrorToast(`No trace result elements returned for  ${traceTitle}.`);
            return null;
          }

          
          // Categorize elements by network source, asset group, and asset type from the trace resultand store per trace type
          categorizedElementsbyTraceType[traceTitle] = categorizeTraceResult(traceResult);
          

        });

        categorizedElementsByStartingPoint[startingPoint.globalId] = categorizedElementsbyTraceType;
        
        if(categorizedElementsByStartingPoint) showSuccessToast("Trace run successfully");

        // Dispatch trace results and graphics highlights to Redux
        dispatch(setTraceResultsElements(categorizedElementsByStartingPoint));
        dispatch(setTraceConfigHighlights(traceConfigHighlights));

      };


    } catch (error) {
      console.error("Error during tracing:", error);
      // dispatch(setTraceErrorMessage(`Error Tracing: ${error.message}`));
      showErrorToast(`Error Tracing: ${error.message}`);
    } finally {
      // Hide the loading indicator
      setIsLoading(false);
      const hasError = traceErrorMessage || !traceLocations.length;
      if (!hasError) {
        setActiveTab("result");
      }
    }
  };




  return (
    <div className="trace-input">

      <div className="trace-header">
      <h4>Trace</h4>
      <img src={close} alt="close" className="cursor-pointer"    onClick={() => setActiveButton("")}/>
      </div>
      <div className="trace-body">
        {/* Dropdown */}
      <label>Trace Type</label>
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
    <span className="point-type">Starting Points</span>
    <button
      onClick={() => handlePointSelection("startingPoint", view)}
      className="point-btn"
    >
      {isSelectingPoint.startingPoint ? "✖" : "+ Add from map"}
    </button>
  </div>

  {/* Conditional rendering */}
  {selectedPoints.StartingPoints.length > 0 ? (
    <div className="selected-section">
      {selectedPoints.StartingPoints.map(([assetgroup], index) => (
        <div key={index} className="selected-point">
          <span>
            #{assetgroup} <strong>asset group</strong>
          </span>
          <div className="select-btn">
            <img src={document} alt="document" />
            <img src={plus} alt="plus" />
            <button
              className="remove-point-btn"
              onClick={() => handleRemovePoint("StartingPoints", index)}
            >
              ✖
            </button>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="nodata-select">
      <span>No Selection</span>
      <img src={selection} alt="select" />
    </div>
  )}
</div>


     {/* Barrier Section */}
<div className="points-container">
  <div className="point-header">
    <span className="point-type">Barriers</span>
    <button
      onClick={() => handlePointSelection("barrier")}
      className="point-btn"
    >
      {isSelectingPoint.barrier ? "✖" : "+ Add from map"}
    </button>
  </div>

  {selectedPoints.Barriers.length > 0 ? (
    <div className="selected-section">
      {selectedPoints.Barriers.map(([assetgroup], index) => (
        <div key={index} className="selected-point">
          <span>
            #{assetgroup} <strong>asset group</strong>
          </span>
          <div className="select-btn">
            <img src={document} alt="document" />
            <img src={plus} alt="plus" />
            <button
              className="remove-point-btn"
              onClick={() => handleRemovePoint("Barriers", index)}
            >
              ✖
            </button>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="nodata-select">
      <span>No Selection</span>
      <img src={selection} alt="select" />
    </div>
  )}
</div>

 {/* History Section */}
 <div className="btn-tracing">
 <img src={copy} alt="copy" />

        <h4>Tracing History</h4>
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
          Reset
        </button>
        <button
          className="trace"
          onClick={() => handleTracing()}
          disabled={isLoading}
        >
          {isLoading ? "Tracing..." : "Run"}
        </button>
     
      </div>
    </div>
  );
}
