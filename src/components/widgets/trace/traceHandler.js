import { loadModules, setDefaultOptions } from "esri-loader";
import {TraceLocation } from './models';
import {
  addTraceLocation,
  addTraceSelectedPoint,
  setTraceErrorMessage,
  clearTraceErrorMessage
} from "../../../redux/widgets/trace/traceAction";
 
// Set ArcGIS JS API version to 4.28
setDefaultOptions({
  version: "4.28"
});


// export const getAttributeCaseInsensitive = (attributes, key) => {
//   const lowerKey = key.toLowerCase();
//   for (const attr in attributes) {
//     if (attr.toLowerCase() === lowerKey) {
//       return attributes[attr];
//     }
//   }
//   return null; // or throw error if it's required
// }


 
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

  
export const addPointToTrace = async (type, selectedPointGlobalId, selectedPointAssetGroup, terminalId, selectedPoints, dispatch) => {
        

        // Define percentage along line to place trace location.
        const myPercentageAlong = window.traceConfig.TraceSettings.percentageAlong;
  
        // Create a new TraceLocation instance
        const selectedPointTraceLocation = new TraceLocation(
          type,
          selectedPointGlobalId,
          terminalId,
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
          return
        }
        // Dispatch the trace location to Redux
        dispatch(addTraceLocation(selectedPointTraceLocation));
        // Dispatch the selected point to Redux
        dispatch(addTraceSelectedPoint(type, newPoint));

}
