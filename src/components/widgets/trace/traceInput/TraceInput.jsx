import "./TraceInput.scss";
import Select from 'react-select';
import { React, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {SelectedTracePoint} from '../models';
import { getAttributeCaseInsensitive} from "../../../../handlers/esriHandler";
import { getTraceParameters, visualiseTraceGraphics, getSelectedPointTerminalId, getPercentAlong, executeTrace, addPointToTrace} from '../traceHandler';
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
   * Cleans up selection state, event listeners, and highlights.
   * @param {Object} view - The ArcGIS map view.
   */
  const cleanupSelection = () => {
    if (view) view.cursor = "default"; // Reset cursor
    // Remove map click listener
    if (mapClickHandlerRef.current) {
      mapClickHandlerRef.current.remove();
      mapClickHandlerRef.current = null;
    }
    // Reset selection state
    setIsSelectingPoint({ startingPoint: false, barrier: false });
  };


  /**
   * Creates a trace location and dispatches it to Redux.
   * @param {string} type - The type of trace location (e.g., "startingPoint" or "barrier").
   * @param {Object} view - The ArcGIS map view.
   * @param {Object} mapEvent - The map click event.
   * @returns {Bool} - True if trace location was created.
   */
  const setTraceLocation = async (type, view, mapEvent) => {
    try {
      mapEvent.stopPropagation();
      // Check to see if any graphics in the view intersect the given screen x, y coordinates.
      const hitTestResult = await view.hitTest(mapEvent);

      if (!hitTestResult.results.length) {
        console.warn("No hit test result.");
        dispatch(setTraceErrorMessage("No hit test result."))
        return false;
      }
  
      const serverLayerIds = layersAndTablesData[0].layers.map(layer => layer.id);
      
      const featuresGraphics = hitTestResult.results.filter(
        (result) =>
          result.graphic.layer &&
          serverLayerIds.includes(result.graphic.layer.layerId)
      );
      
      if (!featuresGraphics.length) {
        console.warn("Cannot add point: The point must intersect with a feature on the map.");
        dispatch(setTraceErrorMessage("Cannot add point: The point must intersect with a feature on the map."));
        return false;
      }

      const layerId = featuresGraphics[0].graphic.layer.layerId
      const attributes = featuresGraphics[0].graphic.attributes;
      const globalId = getAttributeCaseInsensitive(attributes, 'globalid');
      const assetGroup = getAttributeCaseInsensitive(attributes, 'assetgroup');
      const assetType = getAttributeCaseInsensitive(attributes, 'assettype');

      const terminalId = getSelectedPointTerminalId(utilityNetwork, layerId, assetGroup, assetType);
      
      const pointGeometry = mapEvent.mapPoint;
      const line = featuresGraphics[0].graphic.geometry;
      const percentAlong = await getPercentAlong(pointGeometry, line);

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

      // Point Projection on feature

      // const [geometryEngine, projection] = await loadModules([
      //   'esri/geometry/geometryEngine',
      //   'esri/geometry/projection'
      // ]);
      // const pointGeometry = mapEvent.mapPoint;
      // const featureGeometry = queryResult.features[0].geometry;
      // let projectedClick = pointGeometry;
      // if (pointGeometry.utilityNetwork.spatialReference?.wkid !== featureGeometry.utilityNetwork.spatialReference?.wkid) {
      //   const [SpatialReference] = await loadModules(['esri/geometry/SpatialReference']);

      //   projectedClick = projection.project(pointGeometry, new SpatialReference(featureGeometry.utilityNetwork.spatialReference.wkid));
      // }

      // const nearest = geometryEngine.nearestCoordinate(featureGeometry, projectedClick);
      // const nearestPoint = nearest.coordinate;

      // createGraphic(
      //   nearestPoint,
      //   {
      //     type: "simple-marker",
      //     style: "circle",
      //     color: [0, 255, 0, 0.8],
      //     size: 20,
      //     outline: {
      //       color: [0, 128, 0, 0.5],
      //       width: 1.5
      //     }
      //   },
      //   { type: "anyyyyyy" }
      // ).then((selectedPointGraphic) => {
      //   traceGraphicsLayer.graphics.add(selectedPointGraphic);
      // });

      

      return true;

    } catch (error) {
      console.error("An error occurred while getting trace location:", error);
      return false;
    }
  };


  /**
   * Handles the selection of points (startingPoint or barrier) on the map.
   * @param {string} type - The type of point (startingPoint or barrier).
   * @param {Object} view - The ArcGIS map view.
   */
  const handlePointSelection = (type) => {
    setIsSelectingPoint((prev) => {
      const newState = {
        startingPoint: type === "startingPoint" ? !prev.startingPoint : false,
        barrier: type === "barrier" ? !prev.barrier : false,
      };

      if (newState[type] && view) {
        view.cursor = "crosshair";  // Change cursor

        // Attach the map click handler
        mapClickHandlerRef.current = view.on("click", async (event) => {
          try {
            const isTraceLocationSet = await setTraceLocation(type, view, event);
      
            if (isTraceLocationSet) {
              // Reset the selection state after a point is added
              setIsSelectingPoint({ startingPoint: false, barrier: false });
              
              
              dispatch(setTraceErrorMessage(null));
              
              // Clean up listeners and reset the cursor
              cleanupSelection();
            } else {
              console.warn("Failed to create trace location.");
            }
          } catch (error) {
            dispatch(setTraceErrorMessage(error));
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
      const graphicToRemove = traceGraphicsLayer.graphics.find(g => g.attributes?.id === globalId);
      if (graphicToRemove) {
        traceGraphicsLayer.graphics.remove(graphicToRemove);
      }

    }
  };


  /**
   * Resets the trace input state and clears the map.
   */
  const handleReset = () => {
    // Reset Redux state
    dispatch(setTraceResultsElements(null));
    dispatch(clearTraceSelectedPoints());
    dispatch(setSelectedTraceTypes([])); 
    dispatch(setTraceErrorMessage(null));

    // Reset local states
    setIsSelectingPoint({ startingPoint: false, barrier: false });
    cleanupSelection();
    // Clear graphics layer from the map and Redux
    if (traceGraphicsLayer) {
      traceGraphicsLayer.removeAll();
    }
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

      // Show loading indicator
      setIsLoading(true);

      console.log('All Trace Locations List', traceLocations)


      // Execute trace for each starting point
      const startingPointsTraceLocations = traceLocations.filter(loc => loc.traceLocationType === "startingPoint");
      const barriersTraceLocations = traceLocations.filter(loc => loc.traceLocationType === "barrier");
      const categorizedElementsByStartingPoint = {};

      console.log(startingPointsTraceLocations, "startingPointsTraceLocations")

      if(startingPointsTraceLocations?.length === 0){
        dispatch(setTraceErrorMessage("Please select a starting point"));
        return null;
      }    

      
      const traceConfigHighlights = {};
      
      for (const startingPoint of startingPointsTraceLocations) {
        const oneStartingPointTraceLocations = [startingPoint, ...barriersTraceLocations];
        // console.log('Each SP Trace Locations List', oneStartingPointTraceLocations);



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

        // Clear previous error if validation passes
        dispatch(setTraceErrorMessage(null));

        const allCategorizedElements = {};

        traceResults.forEach(({traceResult, configId}) => {
          // Find the config object to get the title
          const traceConfig = traceConfigurations.find(config => config.globalId === configId);
          const traceTitle = traceConfig?.title || configId; // fallback if title not found
          
          console.log(`Trace completed for ${traceTitle} with ID ${configId}-- TRACE RESULT`, traceResult);

          if(traceResult.aggregatedGeometry){
            
            const graphicId = startingPoint.globalId + traceTitle;
            const spatialReference = utilityNetwork.spatialReference;

            visualiseTraceGraphics(traceResult, spatialReference, traceGraphicsLayer, traceConfigHighlights, graphicId);
          } else{
            dispatch(setTraceErrorMessage(`No aggregated geometry returned for  ${traceTitle}.`));
          }


          if(!traceResult.elements){
            dispatch(setTraceErrorMessage(`No trace result elements returned for  ${traceTitle}.`));
            return null;
          }

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

            // Store categorized elements per configId
            allCategorizedElements[traceTitle] = categorizedElements;
        
        
          });

        categorizedElementsByStartingPoint[startingPoint.globalId] = allCategorizedElements;


        // Dispatch categorized elements to Redux
        console.log("Categorized elements by starting points", categorizedElementsByStartingPoint);
        
        console.log("traceConfigHighlights",traceConfigHighlights);
        
        dispatch(setTraceResultsElements(categorizedElementsByStartingPoint));
        dispatch(setTraceConfigHighlights(traceConfigHighlights));

      };


    } catch (error) {
      console.error("Error during tracing:", error);
      dispatch(setTraceErrorMessage(`Error Tracing: ${error.message}`));
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
            console.log("Selected trace config IDs:", selectedGlobalIds);
            dispatch(setSelectedTraceTypes(selectedGlobalIds));
            
            dispatch(setTraceErrorMessage(null));
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
          {isLoading ? "Tracing..." : "Start Tracing"}
        </button>
     
      </div>
    </div>
  );
}
