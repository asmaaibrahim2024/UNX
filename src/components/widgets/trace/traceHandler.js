import { loadModules } from "esri-loader";
import { TraceLocation } from './models';
import { addTraceSelectedPoint} from "../../../redux/widgets/trace/traceAction";
import { createGraphic} from "../../../handlers/esriHandler";
 


/**
 * Returns a random color from the available trace graphic colors defined in the configuration.
 *
 * @returns {string} A random color in the form of a CSS-compatible color string.
 */
function getRandomColor() {
  const colors = window.traceConfig.TraceGraphicColors;
  const colorKeys = Object.keys(colors);
  const randomKey = colorKeys[Math.floor(Math.random() * colorKeys.length)];
  return colors[randomKey]; 
};



/**
 * Finds the asset group from the utility network based on the given layer ID and asset group code.
 *
 * @param {Object} utilityNetwork - The utility network object containing domain networks.
 * @param {number} layerId - The ID of the layer to search within.
 * @param {number} assetGroupCode - The code of the asset group to find.
 * @returns {Object|null} - The matching asset group object, or null if not found.
 */
function findAssetGroup(utilityNetwork, layerId, assetGroupCode){
  if (!utilityNetwork?.dataElement?.domainNetworks) return null;

  for (const domainNetwork of utilityNetwork.dataElement.domainNetworks) {
    const sources = [...(domainNetwork.edgeSources || []), ...(domainNetwork.junctionSources || [])];
    
    for (const source of sources) {
    
      if (source.layerId === layerId && source.assetGroups) {
        const assetGroup = source.assetGroups.find(group => group.assetGroupCode === assetGroupCode);
    
        if (assetGroup) return assetGroup;
      }
    }
  }

  return null;
};



/**
 * Retrieves an asset type object from the utility network.
 *
 * @param {Object} utilityNetwork - The utility network object.
 * @param {number} layerId - The layer ID to search within.
 * @param {number} assetGroupCode - The code of the asset group containing the asset type.
 * @param {number} assetTypeCode - The code of the asset type to retrieve.
 * @returns {Object|null} - The asset type object, or null if not found.
 */
export function getAssetType(utilityNetwork, layerId, assetGroupCode, assetTypeCode) {
  const assetGroup = findAssetGroup(utilityNetwork, layerId, assetGroupCode);
  return assetGroup?.assetTypes?.find(type => type.assetTypeCode === assetTypeCode) || null;
};



/**
 * Retrieves the name of an asset group from the utility network.
 *
 * @param {Object} utilityNetwork - The utility network object.
 * @param {number} layerId - The layer ID to search in.
 * @param {number} assetGroupCode - The asset group code to look up.
 * @returns {string|null} - The name of the asset group, or null if not found.
 */
export function getAssetGroupName(utilityNetwork, layerId, assetGroupCode) {
  const assetGroup = findAssetGroup(utilityNetwork, layerId, assetGroupCode);
  return assetGroup?.assetGroupName || null;
};



/**
 * Retrieves the name of an asset type from the utility network.
 *
 * @param {Object} utilityNetwork - The utility network object.
 * @param {number} layerId - The layer ID where the asset type is located.
 * @param {number} assetGroupCode - The code of the asset group.
 * @param {number} assetTypeCode - The code of the asset type.
 * @returns {string|null} - The name of the asset type, or null if not found.
 */
export function getAssetTypeName(utilityNetwork, layerId, assetGroupCode, assetTypeCode) {
  const assetTypeObject = getAssetType(utilityNetwork, layerId, assetGroupCode, assetTypeCode);
  if(assetTypeObject) return assetTypeObject.assetTypeName;
  return null; // Return null if not found
};



/**
 * Retrieves the terminal configuration object from the utility network by ID.
 *
 * @param {Object} utilityNetwork - The utility network object.
 * @param {number} terminalConfigurationId - The ID of the terminal configuration to retrieve.
 * @returns {Object|undefined} - The terminal configuration object if found, otherwise undefined.
 */
export function getTerminalConfiguration(utilityNetwork, terminalConfigurationId) {
    return utilityNetwork.dataElement.terminalConfigurations.find(tc => tc.terminalConfigurationId === terminalConfigurationId);
}



/**
 * Retrieves the terminal ID for a selected point based on layer ID, asset group, and asset type.
 *
 * @param {Object} utilityNetwork - The utility network object.
 * @param {number} layerId - The ID of the layer containing the feature.
 * @param {number} assetGroup - The code for the asset group.
 * @param {number} assetType - The code for the asset type.
 * @returns {number|undefined} - The terminal ID if available, otherwise undefined.
 */
export function getSelectedPointTerminalId(utilityNetwork, layerId, assetGroup, assetType) {

  let terminalId

  // const assetGroupName = getAssetGroupName(utilityNetwork, layerId, assetGroup);
  const assetTypeObj = getAssetType(utilityNetwork, layerId, assetGroup, assetType);
  if (!assetTypeObj) return;

  
  if (assetTypeObj.isTerminalConfigurationSupported) {
    const terminalConfigId = assetTypeObj.terminalConfigurationId;

    // get terminal configuration
    const terminalConfig = getTerminalConfiguration(utilityNetwork, terminalConfigId);
    terminalId = terminalConfig.terminals[0].terminalId

    // console.log("This feature supports terminals:", terminalConfig);
    
    // console.log("This feature is a junc/dev with layerid", layerId);

    // terminalConfig.terminals.forEach(terminal => {
    //     console.log(`- Terminal Name: ${terminal.terminalName}, ID: ${terminal.terminalId}`);
    // });
  
  }

  return terminalId;
}

  

/**
 * Calculates the relative position (as a percentage) along a polyline where a point was clicked.
 *
 * @param {__esri.Point} clickedPoint - The point clicked by the user.
 * @param {__esri.Polyline} line - The polyline geometry along which the percent will be calculated.
 * @returns {Promise<number|undefined>} - The percent along the polyline (0 to 1) if successful, otherwise undefined.
 */
export async function getPercentAlong(clickedPoint, line) {
    try {
      const [geometryEngine] = await loadModules(['esri/geometry/geometryEngine']);
    
      let percentAlong;
      if (line.type === "polyline") {
        const snappedPoint = geometryEngine.nearestCoordinate(line, clickedPoint).coordinate;
        const paths = line.paths;

        let totalLength = 0;
        let lengthToSnapped = 0;
        let found = false;
        
        for (let p = 0; p < paths.length; p++) {
          const path = paths[p];
        
          for (let i = 0; i < path.length - 1; i++) {
            const from = { type: "point", x: path[i][0], y: path[i][1], spatialReference: line.spatialReference };
            const to   = { type: "point", x: path[i + 1][0], y: path[i + 1][1], spatialReference: line.spatialReference };
        
            const segmentLength = geometryEngine.geodesicLength({ type: "polyline", paths: [[[from.x, from.y], [to.x, to.y]]], spatialReference: line.spatialReference }, "meters");
            
            if (!found) {
              // Check if snappedPoint is on this segment
              const nearest = geometryEngine.nearestCoordinate({ type: "polyline", paths: [[[from.x, from.y], [to.x, to.y]]], spatialReference: line.spatialReference }, snappedPoint).coordinate;
              
              const distToSnapped = geometryEngine.distance(nearest, snappedPoint, "meters");
              
              // If the snapped point is very close to this segment, assume it's on it
              if (distToSnapped < 0.01) {
                const partialLength = geometryEngine.geodesicLength({ type: "polyline", paths: [[[from.x, from.y], [snappedPoint.x, snappedPoint.y]]], spatialReference: line.spatialReference }, "meters");
                lengthToSnapped += partialLength;
                found = true;
              } else {
                lengthToSnapped += segmentLength;
              }
            }
        
            totalLength += segmentLength;
          }
        }
        
        percentAlong = lengthToSnapped / totalLength;
        
        console.log("This is a line")
        console.log("Calculated percentAlong:", percentAlong);
        return percentAlong;
      }
    } catch(e) {
      console.error(e);
    }
}



/**
 * Adds a selected point to the trace input if it is not a duplicate.
 * It dispatches the point to the Redux store and adds a graphic to the trace graphics layer.
 *
 * @param {Object} utilityNetwork - The utility network JSON used to resolve asset names.
 * @param {Object} selectedPoints - Object containing categorized selected points by traceLocationType.
 * @param {Object} selectedTracePoint - Object containing trace point metadata (e.g., traceLocationType, globalId, terminalId, etc.).
 * @param {__esri.Geometry} pointGeometry - The geometry of the selected point to be added.
 * @param {__esri.GraphicsLayer} traceGraphicsLayer - The graphics layer where the trace point will be drawn.
 * @param {Function} dispatch - Redux dispatch function to update the store.
 * @returns {Promise<void>} - A promise that resolves after adding the point or skips if it's a duplicate.
 */
export async function addPointToTrace(utilityNetwork, selectedPoints, selectedTracePoint, pointGeometry, traceGraphicsLayer, dispatch){
        
  // Create a new TraceLocation instance
  const selectedPointTraceLocation = new TraceLocation(
    selectedTracePoint.traceLocationType,
    selectedTracePoint.globalId,
    selectedTracePoint.terminalId,
    selectedTracePoint.percentAlong        
  );


  const assetGroupName = getAssetGroupName(utilityNetwork, selectedTracePoint.layerId, selectedTracePoint.assetGroupCode);
  // Create the new point
  const newPoint = [assetGroupName, selectedTracePoint.globalId];

  // Variable to store where the duplicate was found
  let duplicateType = null;
      
  // Check for duplicate and capture its type
  const isDuplicate = Object.entries(selectedPoints).some(
    ([pointType, pointsArray]) => {
      const found = pointsArray.some(
        ([, existingGlobalId]) => existingGlobalId === selectedTracePoint.globalId
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
    return
  }
  // Dispatch the selected point to Redux
  dispatch(addTraceSelectedPoint(selectedTracePoint.traceLocationType, newPoint, selectedPointTraceLocation));

  let geometryToUse = pointGeometry;

  

  createGraphic(
    geometryToUse,
    {
      type: "simple-marker",
      style: "circle",
      color: selectedTracePoint.traceLocationType === "startingPoint" ? [0, 255, 0, 0.8] : [255, 0, 0, 0.8],
      size: 20,
      outline: {
        width: 0
      }
    },
    { type: selectedTracePoint.traceLocationType, id: selectedTracePoint.globalId }
  ).then((selectedPointGraphic) => {
    traceGraphicsLayer.graphics.add(selectedPointGraphic);
  });

}



/**
 * Creates trace parameters for the trace operation.
 * @param {string} selectedTraceType - The globalId of the selected trace configuration.
 * @param {Array} traceLocations - The list of trace locations.
 * @returns {Object} - The trace parameters object.
 */
export async function getTraceParameters(selectedTraceType, traceLocations) {
  return loadModules(["esri/rest/networks/support/TraceParameters"], {
    css: true,
  }).then(
      ([TraceParameters]) => {
      
          const traceParameters = TraceParameters.fromJSON({
              traceConfigurationGlobalId: selectedTraceType,
              traceLocations: traceLocations
          });
          return traceParameters;
      }
  );
};



/**
 * Executes a Utility Network trace using the specified service URL and parameters.
 *
 * @param {string} utilityNetworkServiceUrl - The URL of the Utility Network service.
 * @param {Object} traceParameters - Parameters for the trace operation.
 * @returns {Promise<Object>} - The result of the trace operation.
 */
export async function executeTrace( utilityNetworkServiceUrl, traceParameters) {
  const [trace] = await loadModules(["esri/rest/networks/trace"], {
    css: true,
  });

  return await trace.trace(utilityNetworkServiceUrl, traceParameters);
};



/**
 * Visualizes trace results by creating and adding graphic elements (multipoint, line, polygon) to the provided graphics layer.
 * Each graphic is styled based on the configuration and a random color is assigned to the line if not already provided.
 *
 * @param {Object} traceResult - The result of the trace operation, containing the aggregated geometry (multipoint, line, polygon).
 * @param {Object} spatialReference - The spatial reference to use when creating graphics.
 * @param {Object} traceGraphicsLayer - The graphics layer to which the graphics will be added.
 * @param {Object} traceConfigHighlights - An object mapping graphic IDs to their respective colors for highlighting.
 * @param {string} graphicId - The ID to uniquely identify the trace graphic for color highlighting.
 */
export function visualiseTraceGraphics( traceResult, spatialReference, traceGraphicsLayer, traceConfigHighlights, graphicId ) {
  
  if (!traceResult || !spatialReference || !traceGraphicsLayer) {
    console.error("Invalid parameters provided to addTraceGraphics.");
    return;
  }

  // Display the aggregated geometry results on the map
  if (traceResult.aggregatedGeometry) {
    // Display results on the map.
    if (traceResult.aggregatedGeometry.multipoint) {
      createGraphic(
        traceResult.aggregatedGeometry.multipoint,
        window.traceConfig.Symbols.multipointSymbol,
        {id: "multipoint"}
      ).then((multipointGraphic) => {          
        traceGraphicsLayer.graphics.add(multipointGraphic);
      });
    }

    if (traceResult.aggregatedGeometry.line) {
      // Assign a random color for this graphicId if not already assigned
      if (!traceConfigHighlights[graphicId]) {
        // traceConfigHighlights[graphicId] = getRandomColor(); // Assign a random color
        const graphicColor = getRandomColor();  // Assign random color
        const graphicWidth = window.traceConfig.Symbols.polylineSymbol.width;
        traceConfigHighlights[graphicId] = {
          lineColor: graphicColor,
          strokeSize: graphicWidth,
          baseColor: graphicColor,
          reset: {lineColor: graphicColor, strokeSize: graphicWidth}
        };
      }
      // const lineColor  = traceConfigHighlights[graphicId];
      const { lineColor, strokeSize } = traceConfigHighlights[graphicId];
      

      createGraphic(
        traceResult.aggregatedGeometry.line,
        {
          type: window.traceConfig.Symbols.polylineSymbol.type,
          color: lineColor,
          width: strokeSize
        },
        // window.traceConfig.Symbols.polylineSymbol,
        {id: graphicId}
      ).then((polylineGraphic) => {
        traceGraphicsLayer.graphics.add(polylineGraphic);
      });
    }

    if (traceResult.aggregatedGeometry.polygon) {
      createGraphic(
        traceResult.aggregatedGeometry.polygon,
        window.traceConfig.Symbols.polygonSymbol,
        {id: "polygon"}
      ).then((polygonGraphic) => {
        traceGraphicsLayer.graphics.add(polygonGraphic);
      });
    }
    
  } else {
    console.log("NOO GEOMETRYYYY BACKKK");
  }

};



/**
 * Categorizes elements from a trace result into a nested object based on network source, asset group, and asset type.
 * Each element is placed into its respective category, creating a structure of networkSource -> assetGroup -> assetType.
 *
 * @param {Object} traceResult - The trace result containing an array of elements.
 * @param {Array} traceResult.elements - The elements in the trace result, each containing networkSourceId, assetGroupCode, and assetTypeCode.
 * @returns {Object} categorizedElements - A nested object categorizing elements by network source, asset group, and asset type.
 */
export function categorizeTraceResult(traceResult) {
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

  return categorizedElements;
}