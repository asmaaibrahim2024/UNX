import { loadModules, setDefaultOptions } from "esri-loader";

 
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




  //return the asset type 
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
  
  

  
