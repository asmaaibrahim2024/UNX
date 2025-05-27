import { loadModules } from "esri-loader";
import { TraceLocation } from './models/traceLocation';
import { addTraceSelectedPoint} from "../../../redux/widgets/trace/traceAction";
import { createGraphic, showErrorToast, showInfoToast, getAttributeCaseInsensitive, queryAllLayerFeatures, showSuccessToast, queryByGlobalId} from "../../../handlers/esriHandler";
import { interceptor } from "../../../handlers/authHandlers/tokenInterceptorHandler";
import { TraceHistory } from "./models/traceHistory";
import { TraceResult } from "./models/traceResult";


/**
 * Generates and returns a random color in hexadecimal format (#RRGGBB).
 * The color is created by randomly selecting values for red, green, and blue.
 * 
 * @returns {string} A randomly generated color in hex format.
 */
function getRandomColor() {
  // const colors = window.traceConfig.TraceGraphicColors;
  // const colorKeys = Object.keys(colors);
  // const randomKey = colorKeys[Math.floor(Math.random() * colorKeys.length)];
  // return colors[randomKey]; 

  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b)
    .toString(16)
    .slice(1)}`;
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
 * Retrieves the title of a trace configuration by its global ID.
 *
 * @param {Array<{ globalId: string, title: string }>} traceConfigurations - Array of trace configuration objects.
 * @param {string} configId - The global ID of the trace configuration to search for.
 * @returns {string} The title of the matching trace configuration, or the configId if not found.
 */
export function getTraceTitleById(traceConfigurations, configId) {
  const config = traceConfigurations.find((c) => c.globalId === configId);
  return config?.title || configId;
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
export async function getPercentAlong(clickedPoint, line, t) {
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
        
        // console.log("This is a line")
        // console.log("Calculated percentAlong:", percentAlong);
        return percentAlong;
      }
    } catch(e) {
      console.error(e);
      showErrorToast(`${t("Cannot calculate percentAlong of the clicked line:")} ${e}`)
    }
}


  /**
 * Get the point at a given percentAlong (0 to 1) of a polyline manually.
 * @param {__esri.Polyline} line - The polyline geometry.
 * @param {number} percentAlong - The desired percentage (0 to 1).
 * @returns {__esri.Point} - The point at that percent.
 */
export function getPointAtPercentAlong(line, percentAlong) {
  const paths = line.paths;
  const sr = line.spatialReference;
  let totalLength = 0;

  // Step 1: Calculate total length
  const lengths = [];
  for (const path of paths) {
    for (let i = 0; i < path.length - 1; i++) {
      const [x1, y1] = path[i];
      const [x2, y2] = path[i + 1];
      const dx = x2 - x1;
      const dy = y2 - y1;
      const segmentLength = Math.sqrt(dx * dx + dy * dy);
      lengths.push(segmentLength);
      totalLength += segmentLength;
    }
  }

  // Step 2: Walk along the path to find the segment
  const targetLength = percentAlong * totalLength;
  let accumulated = 0;
  let segIndex = 0;
  let pathIndex = 0;
  let path = paths[0];

  for (let p = 0; p < paths.length; p++) {
    path = paths[p];
    for (let i = 0; i < path.length - 1; i++, segIndex++) {
      const segmentLength = lengths[segIndex];
      if (accumulated + segmentLength >= targetLength) {
        const remaining = targetLength - accumulated;
        const ratio = remaining / segmentLength;
        const [x1, y1] = path[i];
        const [x2, y2] = path[i + 1];
        const x = x1 + ratio * (x2 - x1);
        const y = y1 + ratio * (y2 - y1);
        return {
          type: "point",
          x,
          y,
          spatialReference: sr
        };
      }
      accumulated += segmentLength;
    }
  }

  // If somehow percentAlong is 1 exactly
  const last = path[path.length - 1];
  return {
    type: "point",
    x: last[0],
    y: last[1],
    spatialReference: sr
  };
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
export async function addPointToTrace(utilityNetwork, selectedPoints, selectedTracePoint, pointGeometry, traceGraphicsLayer, dispatch, t){
        
  // Create a new TraceLocation instance
  const selectedPointTraceLocation = new TraceLocation(
    selectedTracePoint.traceLocationType,
    selectedTracePoint.globalId,
    selectedTracePoint.terminalId,
    selectedTracePoint.percentAlong        
  );


  const assetGroupName = getAssetGroupName(utilityNetwork, selectedTracePoint.layerId, selectedTracePoint.assetGroupCode);
  
  // Create the new point
  // const newPoint = [assetGroupName, selectedTracePoint.globalId];

  // Get the correct array from selectedPoints for the current type
  const currentPointsArray = selectedPoints[selectedTracePoint.traceLocationType === "startingPoint" ? "StartingPoints" : "Barriers"];

  // Determine the label prefix
  const prefix = selectedTracePoint.traceLocationType === "startingPoint" ? "#sp" : "#bp";

  // Create a new label with index + 1
  // const label = `${prefix}${currentPointsArray.length + 1} ${assetGroupName}`;

  // Extract existing indices from labels like "#sp1 something"
  const usedIndices = currentPointsArray
  .map(([label]) => {
    const match = label.match(new RegExp(`^${prefix}(\\d+)`));
    return match ? parseInt(match[1], 10) : null;
  })
  .filter((num) => num !== null)
  .sort((a, b) => a - b);

  // Find the smallest missing index
  let nextIndex = 1;
  for (let i = 0; i < usedIndices.length; i++) {
  if (usedIndices[i] !== i + 1) {
    nextIndex = i + 1;
    break;
  }
  nextIndex = usedIndices.length + 1;
  }

  const label = `${prefix}${nextIndex} ${assetGroupName}`;

  // Now create the labeled point
  // const newPoint = [label, selectedTracePoint.globalId];
  // [asset group label, point's global id, percentAlong, layerId]
  const newPoint = [label, selectedTracePoint.globalId, selectedTracePoint.percentAlong, selectedTracePoint.layerId];

  // Variable to store where the duplicate was found
  let duplicateType = null;
      
  // Check for duplicate and capture its type
  const isDuplicate = Object.entries(selectedPoints).some(
    ([pointType, pointsArray]) => {
      const found = pointsArray.some(
        ([, existingGlobalId, existingPercentAlong]) => {
          if(existingGlobalId === selectedTracePoint.globalId) {
            // If point is a device or junction || If point is a line, check its position on the line
            if (selectedTracePoint.terminalId ||  Math.abs(existingPercentAlong - selectedTracePoint.percentAlong) <= 0.1 ) {
              duplicateType = pointType;
              return true;
            } else return false;
          }
          return false;
        }
      );
      
      // if (found) {
      //   duplicateType = pointType;
        
      //   return true;
      // }
      return found;
    }
  );

  if (isDuplicate) {
    // console.log(`Duplicate point found in ${duplicateType}, skipping dispatch.`);
    showInfoToast(`${t("Cannot add point: Duplicate point found in")} ${t(duplicateType)}`);
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
    { type: selectedTracePoint.traceLocationType, id: `${selectedTracePoint.globalId}-${selectedTracePoint.percentAlong}`}
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


export function assignGraphicColor(traceConfigHighlights, graphicId){
  if (!traceConfigHighlights[graphicId]) {
      const graphicColor = getRandomColor();  // Assign random color
      const graphicWidth = window.traceConfig.Symbols.polylineSymbol.width;
      traceConfigHighlights[graphicId] = {
        graphicColor: graphicColor,
        strokeSize: graphicWidth,
        baseColor: graphicColor,
        reset: {graphicColor: graphicColor, strokeSize: graphicWidth}
      };
    }
    const { graphicColor, strokeSize } = traceConfigHighlights[graphicId];
      
    return {
      graphicColor: graphicColor,
      strokeSize: strokeSize
    }
}


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
export function visualiseTraceGraphics( traceResult, spatialReference, traceGraphicsLayer, traceConfigHighlights, graphicId, t) {
  
  if (!traceResult || !spatialReference || !traceGraphicsLayer) {
    console.error("Invalid parameters provided to addTraceGraphics.");
    showErrorToast(t("Invalid parameters provided to visualise trace graphics."));
    return;
  }

  // Display the aggregated geometry results on the map
  if (traceResult.aggregatedGeometry) {
    // Assign a random color for this graphicId if not already assigned
    // if (!traceConfigHighlights[graphicId]) {
    //   const graphicColor = getRandomColor();  // Assign random color
    //   const graphicWidth = window.traceConfig.Symbols.polylineSymbol.width;
    //   traceConfigHighlights[graphicId] = {
    //     graphicColor: graphicColor,
    //     strokeSize: graphicWidth,
    //     baseColor: graphicColor,
    //     reset: {graphicColor: graphicColor, strokeSize: graphicWidth}
    //   };
    // }
    // const { graphicColor, strokeSize } = traceConfigHighlights[graphicId];
    const { graphicColor, strokeSize } =  assignGraphicColor(traceConfigHighlights, graphicId);

    // Display results on the map.
    if (traceResult.aggregatedGeometry.multipoint) {
      createGraphic(
        traceResult.aggregatedGeometry.multipoint,
        {
          type: window.traceConfig.Symbols.multipointSymbol.type,
          color: graphicColor, 
          size: window.traceConfig.Symbols.multipointSymbol.size,
          outline: {
              color: graphicColor, 
              width: window.traceConfig.Symbols.multipointSymbol.outline.width
          }
        },
        // window.traceConfig.Symbols.multipointSymbol,
        // {id: "multipoint"}
        {id: graphicId}
      ).then((multipointGraphic) => {          
        traceGraphicsLayer.graphics.add(multipointGraphic);
      });
    }

    if (traceResult.aggregatedGeometry.line) {
      createGraphic(
        traceResult.aggregatedGeometry.line,
        {
          type: window.traceConfig.Symbols.polylineSymbol.type,
          color: graphicColor,
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
        {
          type: window.traceConfig.Symbols.polygonSymbol.type,
          color: graphicColor,
          style: window.traceConfig.Symbols.polygonSymbol.style,
          outline: {
              color: graphicColor,
              width: window.traceConfig.Symbols.polygonSymbol.outline.width
          }
      },
        // window.traceConfig.Symbols.polygonSymbol,
        // {id: "polygon"}
        {id: graphicId}
      ).then((polygonGraphic) => {
        traceGraphicsLayer.graphics.add(polygonGraphic);
      });
    }
    
  }

};

export async function getElementsFeatures(traceResultElements, groupedGlobalIds, groupedObjectIds, perResultQueried, sourceToLayerMap, featureServiceUrl, queriedTraceResultFeaturesMap) {
  const groupedObjectIdsPerTraceResult = {};
  for (const element of traceResultElements) {
  const {globalId, objectId, networkSourceId } = element || {};
  if (networkSourceId != null) {
    if (globalId) {
      if (!groupedGlobalIds[networkSourceId]) {
        groupedGlobalIds[networkSourceId] = new Set();
      }
      groupedGlobalIds[networkSourceId].add(globalId);
    }

    if (objectId != null) {
      if (!groupedObjectIdsPerTraceResult[networkSourceId]) {
        groupedObjectIdsPerTraceResult[networkSourceId] = new Set();
      }
      groupedObjectIdsPerTraceResult[networkSourceId].add(objectId);
      
      if (!groupedObjectIds[networkSourceId]) {
          groupedObjectIds[networkSourceId] = new Set();
      }
      groupedObjectIds[networkSourceId].add(objectId);
    }
    
  }
  }

  // Convert sets to arrays before dispatching
  const groupedGlobalIdsObj = {};
  for (const [networkSourceId, gidSet] of Object.entries(groupedGlobalIds)) {
    groupedGlobalIdsObj[networkSourceId] = Array.from(gidSet);
  }

  const groupedObjectIdsObj = {};
  for (const [networkSourceId, oidSet] of Object.entries(groupedObjectIdsPerTraceResult)) {
    groupedObjectIdsObj[networkSourceId] = Array.from(oidSet);
  }
  
  // Query features by objectIds per trace result
  perResultQueried = await queryTraceElements(
    groupedObjectIdsPerTraceResult,
    sourceToLayerMap,
    featureServiceUrl
  );

  for (const [key, value] of Object.entries(perResultQueried)) {
    // Override if exists, or add if not
    queriedTraceResultFeaturesMap[key] = value;
  }

  return perResultQueried;
}



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

  // Remove duplicates and sort by objectId ascending
  for (const networkSource in categorizedElements) {
    for (const assetGroup in categorizedElements[networkSource]) {
      for (const assetType in categorizedElements[networkSource][assetGroup]) {
        const seen = new Set();
        const uniqueSorted = categorizedElements[networkSource][assetGroup][assetType]
          .filter(el => {
            if (seen.has(el.objectId)) return false;
            seen.add(el.objectId);
            return true;
          })
          .sort((a, b) => a.objectId - b.objectId);

        categorizedElements[networkSource][assetGroup][assetType] = uniqueSorted;
      }
    }
  }

  return categorizedElements;
}


/**
 * Queries and retrieves feature details for a list of object IDs across multiple network sources.
 *
 * @param {Object.<string, number[]>} allObjectIds - An object mapping `sourceId` to an array of `globalId`s.
 * @returns {Promise<Object[]>} A promise that resolves to a flat array of all retrieved features.
 */
export const queryTraceElements = async (allObjectIds, sourceToLayerMap, featureServiceUrl) => {
    const promises = Object.entries(allObjectIds).map(async ([sourceId, objectIdList]) => {
      const layerId = sourceToLayerMap[sourceId];
      if (layerId == null) {
        return [];
      }

      const layerUrl = `${featureServiceUrl}/${layerId}`;
      return await queryAllLayerFeatures(objectIdList, layerUrl);
    });

    const resultsPerLayer = await Promise.all(promises);
    const allFeatures = resultsPerLayer.flat().filter(Boolean);

    // Convert array to { [globalId]: feature }
    const featureMap = {};
    allFeatures.forEach((feature) => {
      // const globalId = feature.attributes?.GLOBALID;
      const globalId = getAttributeCaseInsensitive(feature.attributes, "globalid");
      if (globalId != null) {
        featureMap[globalId] = feature;
      }
    });

    // setQueriedTraceFeatures(featureMap);
    return featureMap;
  }


export async function visualiseTraceQueriedFeatures(traceGraphicsLayer, traceConfigHighlights, perResultQueried, graphicId) {
  const { graphicColor, strokeSize } =  assignGraphicColor(traceConfigHighlights, graphicId);

  for (const globalId in perResultQueried) {
    const feature = perResultQueried[globalId];
    const geometry = feature.geometry;

    let symbol;

    switch (geometry.type) {
      case "point":
      case "multipoint":
        symbol = {
          type: window.traceConfig.Symbols.multipointSymbol.type,
          style: "circle",
          color: graphicColor,
          size: window.traceConfig.Symbols.multipointSymbol.size,
          outline: {
            color: graphicColor,
            width: window.traceConfig.Symbols.multipointSymbol.outline.width,
          },
        };
        break;

      case "polyline":
        symbol = {
          type: window.traceConfig.Symbols.polylineSymbol.type,
          color: graphicColor,
          width: strokeSize,
        };
        break;

      case "polygon":
        symbol = {
          type: window.traceConfig.Symbols.polygonSymbol.type,
          color: graphicColor,
          outline: {
            color: graphicColor,
            width: window.traceConfig.Symbols.polygonSymbol.outline.width,
          },
        };
        break;

      default:
        console.warn("Unknown geometry type:", geometry.type);
        continue;
    }

    const graphic = await createGraphic(geometry, symbol, {id: graphicId});
    traceGraphicsLayer.graphics.add(graphic);
  }

}





export const fetchTraceHistory = async () => {
  try {
    const baseUrl = window.mapConfig.ApiSettings.baseUrl;
    const traceHistoryEndpoint = "api/TraceHistory/GetTraceHistoryByUserId";
    const traceHistoryUrl = `${baseUrl}${traceHistoryEndpoint}`;
    const data = await interceptor.getRequest(traceHistoryEndpoint);
    if (!data) {
      throw new Error("No response data received from fetching trace history.");
    }
    const traceHistory = data;
    return traceHistory;
  } catch (error) {
    console.error("Failed to fetch trace history:", error);
    showErrorToast(`Failed to fetch trace history: ${error}`);
    // throw error;
  }
};


export const fetchTraceResultHistoryById = async (traceResultId) => {
  try {
    const baseUrl = window.mapConfig.ApiSettings.baseUrl;
    const traceResultJsonByIdEndpoint = "api/TraceHistory/GetTraceResultJsonById";
    const traceResultJsonByIdUrl = `${baseUrl}${traceResultJsonByIdEndpoint}`;
    const body = { id: traceResultId };
    const data = await interceptor.postRequest(traceResultJsonByIdEndpoint, body);
    if (!data) {
      throw new Error("No response data received from fetching trace result json.");
    }
    const traceResultJson = data;
    return traceResultJson;
  } catch (error) {
    console.error("Failed to fetch trace result json:", error);
    showErrorToast(`Failed to fetch trace result json: ${error}`);
    // throw error;
  }

}


export const addTraceHistory = async (traceResultObj) => {
  try {
    
    // Convert trace result to string
    // const categorizeTraceResultString = JSON.stringify(traceResultObj);

    // Serialize safely (handling Set)
    const categorizeTraceResultString = JSON.stringify(traceResultObj, (key, value) => {
      if (value instanceof Set) return Array.from(value);
      return value;
    });


    const traceResult = new TraceHistory({
        traceResultJson: categorizeTraceResultString,
        traceDate: new Date().toISOString()
      });

    const baseUrl = window.mapConfig.ApiSettings.baseUrl;
    const addTraceHistoryEndpoint = "api/TraceHistory/AddTraceHistory";
    const addTraceHistoryUrl = `${baseUrl}${addTraceHistoryEndpoint}`;
    const data = await interceptor.postRequest(addTraceHistoryEndpoint, traceResult);
    if (!data) {
      throw new Error("No response received from add trace history.");
    }
    // console.log("add trace history response", data);
    return data;
    
  } catch (error) {
    console.error("Failed to add to trace history:", error);
    showErrorToast(`Failed to add to trace history: ${error}`);
    // throw error;
  }
};


export const deleteTraceHistoryById = async (traceResultId) => {
  try {
    const baseUrl = window.mapConfig.ApiSettings.baseUrl;
    const deleteTraceHistoryByIdEndpoint = `api/TraceHistory/DeleteTraceHistoryById`;
    const traceHistoryUrl = `${baseUrl}${deleteTraceHistoryByIdEndpoint}`;
    const body = { id: traceResultId };
    const data = await interceptor.deleteRequest(deleteTraceHistoryByIdEndpoint, body);
    if (!data) {
      throw new Error("Failed to delete trace result.");
    }
    const deletionStatus = data;
    
    return deletionStatus;
  } catch (error) {
    console.error("Failed to delete trace result.:", error);
    showErrorToast(`Failed to delete trace result ${error}`);
    // throw error;
  }
};

export const deleteAllTraceHistory = async () => {
  try {
    const baseUrl = window.mapConfig.ApiSettings.baseUrl;
    const deleteAllTraceHistoryEndpoint = `api/TraceHistory/DeleteAllTraceHistory`;
    const traceHistoryUrl = `${baseUrl}${deleteAllTraceHistoryEndpoint}`;
    const data = await interceptor.deleteRequest(deleteAllTraceHistoryEndpoint);
    if (!data) {
      throw new Error("Failed to delete trace history.");
    }
    const deletionStatus = data;
    
    return deletionStatus;
  } catch (error) {
    console.error("Failed to delete trace history.:", error);
    showErrorToast(`Failed to delete trace history ${error}`);
    // throw error;
  }
};


export const performTrace = async (
  startTracingFromHistory,
  t, utilityNetwork,
  setIsLoading,
  goToResultFrom,
  traceLocations, selectedTraceTypes, traceGraphicsLayer, traceConfigHighlights, setTraceResultsElements, dispatch, selectedPoints, traceConfigurations, sourceToLayerMap,
  setTraceConfigHighlights,
  setQueriedTraceResultFeaturesMap,
  setGroupedTraceResultGlobalIds

) => {
    // To store trace result for all starting points
    const categorizedElementsByStartingPoint = {};

    const rawTraceResults = {}

    // To save globalIds for all traces
    const groupedGlobalIds = {};

    // To save objectIds for all traces
    const groupedObjectIds = {};

    const queriedTraceResultFeaturesMap = {};


    // const elementsObjAndGlobalIds = {};
    // const seenTracker = {}; // Track unique combinations per networkSourceId

    // // To store the graphic line colour of each trace configuration for each starting point
    // let traceConfigHighlights = {};

    
    
    try {
      // Separate starting points and barriers from trace locations
      const startingPointsTraceLocations = traceLocations.filter(
        (loc) => loc.traceLocationType === "startingPoint"
      );
      const barriersTraceLocations = traceLocations.filter(
        (loc) => loc.traceLocationType === "barrier"
      );

      // Validate trace parameters are selected
      if (!selectedTraceTypes || selectedTraceTypes.length === 0) {
        // dispatch(setTraceErrorMessage("Please select a trace type."));
        showErrorToast(t("Please select a trace type."));
        return null;
      }
      if (startingPointsTraceLocations?.length === 0) {
        // dispatch(setTraceErrorMessage("Please select a starting point"));
        showErrorToast(t("Please select a starting point"));
        return null;
      }

      // Show loading indicator
      // if(!startTracingFromHistory) {
        setIsLoading(true);
      // }

      // Remove old trace results
      const selectedPointsGlobalIdsWithPercentAlong = traceLocations.map(
        (loc) => `${loc.globalId}-${loc.percentAlong}`
      );
      // Make a copy of the graphics array
      const graphicsToCheck = [...traceGraphicsLayer.graphics];
      graphicsToCheck.forEach((graphic) => {
        const graphicId = graphic.attributes?.id;
        // Remove if the id is not exactly one of the selected globalIds
        if (!selectedPointsGlobalIdsWithPercentAlong.includes(graphicId)) {
          traceGraphicsLayer.graphics.remove(graphic);
        }
      });

      dispatch(setTraceResultsElements(null));

      // Execute trace for each starting point
      for (const startingPoint of startingPointsTraceLocations) {
        // Find starting point name
        const match = selectedPoints.StartingPoints.find(
          ([, id]) => id === startingPoint.globalId
        );
        const displayName = match ? match[0] : startingPoint.globalId;

        try {
          const oneStartingPointTraceLocations = [
            startingPoint,
            ...barriersTraceLocations,
          ];

          // Execute all traces
          const tracePromises = selectedTraceTypes.map(async (configId) => {
            // Find the config title
            const traceTitle = getTraceTitleById(traceConfigurations, configId);

            try {
              const traceParameters = await getTraceParameters(
                configId,
                oneStartingPointTraceLocations
              );
              const networkServiceUrl = utilityNetwork.networkServiceUrl;
              const traceResult = await executeTrace(
                networkServiceUrl,
                traceParameters
              );
              return {
                traceResult: traceResult,
                configId: configId,
              };
            } catch (error) {
              if(!startTracingFromHistory) {
                console.error(
                `Trace failed for ${traceTitle} and point ${startingPoint.globalId}:`,
                error
              );
              showErrorToast(
                `${t("Trace failed for")} ${traceTitle} ${t(
                  "by"
                )} ${displayName} : ${error.message}`
              );
              }
              return null; // Skip this failed trace type
            }
          });

          // const traceResults = await Promise.all(tracePromises);
          const traceResults = (await Promise.all(tracePromises)).filter(
            Boolean
          );
          const categorizedElementsbyTraceType = {};

          // Clear previous error if validation passes
          // dispatch(setTraceErrorMessage(null));

          // traceResults.forEach(async ({ traceResult, configId }) => {
          for (const { traceResult, configId } of traceResults) {
            let perResultQueried = {};
            // Find the config title
            const traceTitle = getTraceTitleById(traceConfigurations, configId);
            const graphicId = startingPoint.globalId + traceTitle;
            const spatialReference = utilityNetwork.spatialReference;

            rawTraceResults[graphicId] = traceResult;


            if (!traceResult.elements) {
              if(!startTracingFromHistory) {
              showErrorToast(
                `${t(
                  "No trace result elements returned for"
                )} ${traceTitle} ${t("by")} ${displayName}`
              );
              return null;
            }
          }

            if (traceResult.elements.length === 0) {
              if(!startTracingFromHistory) {
                  showInfoToast(
                  `${t("No elements returned for")} ${traceTitle} ${t(
                    "by"
                  )} ${displayName}`
                );
              }
            } else {
              perResultQueried = await getElementsFeatures(
                traceResult.elements,
                groupedGlobalIds,
                groupedObjectIds,
                perResultQueried,
                sourceToLayerMap,
                utilityNetwork.featureServiceUrl,
                queriedTraceResultFeaturesMap
              );
            
            }

            if(startTracingFromHistory) {
              traceLocations.forEach(async (point) => {
                      let geometryToUse = queriedTraceResultFeaturesMap[point.globalId]?.geometry;
                      if(!geometryToUse) {
                        const allPoints = [
                          ...(selectedPoints.Barriers || []),
                          ...(selectedPoints.StartingPoints || [])
                        ];
              
                        for (const item of allPoints) {
                          if (item[1] === point.globalId) {
                            // item[3] = point's layerId
                            const pointQuery = await queryByGlobalId(point.globalId, item[3], utilityNetwork.featureServiceUrl);
                            geometryToUse = pointQuery[0]?.geometry;
                          }
                        }
                        
                      }
                      if(geometryToUse?.type === "polyline"){
                        geometryToUse = getPointAtPercentAlong(geometryToUse, point[3])
                      }
                      createGraphic(
                        geometryToUse,
                        {
                          type: "simple-marker",
                          style: "circle",
                          color: point.traceLocationType === "startingPoint" ? [0, 255, 0, 0.8] : [255, 0, 0, 0.8],
                          size: 20,
                          outline: {
                            width: 0
                          }
                        },
                        { type: point.traceLocationType, id: `${point.globalId}-${point.percentAlong}`}
                      ).then((selectedPointGraphic) => {
                        traceGraphicsLayer.graphics.add(selectedPointGraphic);
                      });
                    });
            }

            // Add trace results geometry on map if found
            if (traceResult.aggregatedGeometry) {
              // const graphicId = startingPoint.globalId + traceTitle;
              // const spatialReference = utilityNetwork.spatialReference;
              
                          
              visualiseTraceGraphics(
                traceResult,
                spatialReference,
                traceGraphicsLayer,
                traceConfigHighlights,
                graphicId,
                t
              );
            } else if (
              !traceResult.aggregatedGeometry &&
              traceResult.elements.length !== 0
            ) {
              
              



              await visualiseTraceQueriedFeatures(
                traceGraphicsLayer,
                traceConfigHighlights,
                perResultQueried,
                graphicId
              );
              
            }

            // Categorize elements by network source, asset group, and asset type from the trace resultand store per trace type
            categorizedElementsbyTraceType[traceTitle] =
              categorizeTraceResult(traceResult);

            if(!startTracingFromHistory) {
            showSuccessToast(
              `${t("Trace run successfully for")} ${traceTitle} ${t(
                "by"
              )} ${displayName}`
            );
          }
          }

          categorizedElementsByStartingPoint[startingPoint.globalId] =
            categorizedElementsbyTraceType;

          // const queriedTraceResultFeaturesMap = await queryTraceElements(groupedObjectIds, sourceToLayerMap, utilityNetwork.featureServiceUrl);

          // Dispatch trace results and graphics highlights to Redux
          dispatch(setTraceResultsElements(categorizedElementsByStartingPoint));
          if(!startTracingFromHistory) {
            dispatch(setTraceConfigHighlights(traceConfigHighlights));
          }
          // Dispatch result global ids
          dispatch(setGroupedTraceResultGlobalIds(groupedGlobalIds));
          // Dispatch query results
          dispatch(
            setQueriedTraceResultFeaturesMap(queriedTraceResultFeaturesMap)
          );
        } catch (startingPointError) {
          if(!startTracingFromHistory) {
          console.error(
            `Trace error for starting ${displayName}:`,
            startingPointError
          );
          showErrorToast(
            `${t("Trace failed for")} ${displayName}:  ${
              startingPointError.message
            }`
          );
        }
          continue;
        
        }
      }
    } catch (error) {
      if(!startTracingFromHistory) {
        console.error("Error during tracing:", error);
        showErrorToast(`${t("Error during tracing:")} ${error.message}`);
      }
    } finally {
      // Hide the loading indicator
      setIsLoading(false);

      if (
        categorizedElementsByStartingPoint &&
        Object.values(categorizedElementsByStartingPoint).some(
          (value) => value && Object.keys(value).length > 0
        )
      ) {

        // Add Trace Result to Trace History in database
        try {
          if(!startTracingFromHistory) {
            // Add trace result to database
            const traceResultHistory = new TraceResult({
              // traceResultsElements: categorizedElementsByStartingPoint,
              traceConfigHighlights: traceConfigHighlights,
              // savedTraceGeometries: savedTraceGeometries,
              // groupedTraceResultGlobalIds: groupedGlobalIds,
              // groupedObjectIds: groupedObjectIds,
              selectedTraceTypes: selectedTraceTypes,
              traceLocations: traceLocations,
              selectedPoints: selectedPoints
            });
            
            addTraceHistory(traceResultHistory);
            // setActiveTab("result");
            goToResultFrom("input");
        } else {
          goToResultFrom("history");
        }
        } catch {
          console.error("Could not add this trace result to trace history");
        }
      }
    }
  };