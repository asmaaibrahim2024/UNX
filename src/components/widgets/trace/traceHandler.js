import { loadModules, setDefaultOptions } from "esri-loader";
import {TraceLocation } from './models';
import {
  addTraceLocation,
  addTraceSelectedPoint,
  setTraceErrorMessage,
  clearTraceErrorMessage
} from "../../../redux/widgets/trace/traceAction";
import {
  createGraphic
} from "../../../handlers/esriHandler";
 
// Set ArcGIS JS API version to 4.28
setDefaultOptions({
  version: "4.28"
});

 
/**
 * Creates trace parameters for the trace operation.
 * @param {string} selectedTraceType - The globalId of the selected trace configuration.
 * @param {Array} traceLocations - The list of trace locations.
 * @returns {Object} - The trace parameters object.
 */
export const getTraceParameters = async (selectedTraceType, traceLocations) => {
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


export const executeTrace = async (
  utilityNetworkServiceUrl,
  traceParameters
) => {
  const [trace] = await loadModules(["esri/rest/networks/trace"], {
    css: true,
  });

  return await trace.trace(utilityNetworkServiceUrl, traceParameters);
};

  
// Return the asset group name
export const getAssetGroupName = (utilityNetwork, layerId, assetGroupCode) => {
  if (!utilityNetwork?.dataElement?.domainNetworks) return null;

  // Search through all domain networks
  for (const domainNetwork of utilityNetwork.dataElement.domainNetworks) {
    // Check both edge and junction sources
    const sources = [...(domainNetwork.edgeSources || []), ...(domainNetwork.junctionSources || [])];

    for (const source of sources) {
      if (source.layerId === layerId && source.assetGroups) {
        // Find the matching asset group
        const assetGroup = source.assetGroups.find(group => group.assetGroupCode === assetGroupCode);
        if (assetGroup) {
          return assetGroup.assetGroupName;
        }
      }
    }
  }

  return null; // Return null if not found
};


//return the asset type name
export const getAssetTypeName = (utilityNetwork, layerId, assetGroupCode, assetTypeCode) => {
  const assetTypeObject = getAssetType(utilityNetwork, layerId, assetGroupCode, assetTypeCode);
  if(assetTypeObject) return assetTypeObject.assetTypeName;
  return null; // Return null if not found
};



//return the asset type object
export const getAssetType = (utilityNetwork, layerId, assetGroupCode, assetTypeCode) => {
  if (!utilityNetwork?.dataElement?.domainNetworks) return null;

  // Search through all domain networks
  for (const domainNetwork of utilityNetwork.dataElement.domainNetworks) {
    // Check both edge and junction sources
    const sources = [...(domainNetwork.edgeSources || []), ...(domainNetwork.junctionSources || [])];
    
    for (const source of sources) {
      if (source.layerId === layerId && source.assetGroups) {
        // Find the matching asset group
        const assetGroup = source.assetGroups.find(group => group.assetGroupCode === assetGroupCode);
        if (assetGroup && assetGroup.assetTypes) {
          // Find the matching asset type
          const assetType = assetGroup.assetTypes.find(type => type.assetTypeCode === assetTypeCode);
          if (assetType) {
            return assetType;
          }
        }
      }
    }
  }
  
  return null; // Return null if not found
};


export const getTerminalConfiguration = (utilityNetwork, terminalConfigurationId) => {
    return utilityNetwork.dataElement.terminalConfigurations.find(tc => tc.terminalConfigurationId === terminalConfigurationId);
}

export const getSelectedPointTerminalId = (utilityNetwork, layerId, assetGroup, assetType) => {

  let terminalId

  // const assetGroupName = getAssetGroupName(utilityNetwork, layerId, assetGroup);
  const assetTypeObj = getAssetType(utilityNetwork, layerId, assetGroup, assetType);
  if (!assetTypeObj) return;

  
  if (assetTypeObj.isTerminalConfigurationSupported) {
    const terminalConfigId = assetTypeObj.terminalConfigurationId;

    // get terminal configuration
    const terminalConfig = getTerminalConfiguration(utilityNetwork, terminalConfigId);
    terminalId = terminalConfig.terminals[0].terminalId

    console.log("This feature supports terminals:", terminalConfig);
    
    console.log("This feature is a junc/dev with layerid", layerId);

    terminalConfig.terminals.forEach(terminal => {
        console.log(`- Terminal Name: ${terminal.terminalName}, ID: ${terminal.terminalId}`);
    });
  
  }

  return terminalId;
}

  
export const getPercentAlong = async (clickedPoint, line) => {
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


export const addPointToTrace = async (type, selectedPointGlobalId, selectedPointAssetGroup, terminalId, selectedPoints, calculatedPercentageAlong, dispatch) => {
        
  // Create a new TraceLocation instance
  const selectedPointTraceLocation = new TraceLocation(
    type,
    selectedPointGlobalId,
    terminalId,
    calculatedPercentageAlong        
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
    return
  }
  // Dispatch the trace location to Redux
  dispatch(addTraceLocation(selectedPointTraceLocation));
  // Dispatch the selected point to Redux
  dispatch(addTraceSelectedPoint(type, newPoint));

}

 // Function to pick a random color from the available colors in window.traceConfig
 export const getRandomColor = () => {
  const colors = window.traceConfig.TraceGraphicColors;
  const colorKeys = Object.keys(colors);
  const randomKey = colorKeys[Math.floor(Math.random() * colorKeys.length)];
  return colors[randomKey]; 
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
export const visualiseTraceGraphics = (
  traceResult,
  spatialReference,
  traceGraphicsLayer,
  lineColor,
  traceTitle
) => {
  
  if (!traceResult || !spatialReference || !traceGraphicsLayer) {
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
        traceGraphicsLayer.graphics.add(multipointGraphic);
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
        traceGraphicsLayer.graphics.add(polylineGraphic);
      });
    }

    if (traceResult.aggregatedGeometry.polygon) {
      createGraphic(
        {
          type: "polygon",
          rings: traceResult.aggregatedGeometry.polygon.rings,
        },
        window.traceConfig.Symbols.polygonSymbol,
        spatialReference
      ).then((polygonGraphic) => {
        traceGraphicsLayer.graphics.add(polygonGraphic);
      });
    }
    
  } else {
    console.log("NOO GEOMETRYYYY BACKKK");
  }

};
