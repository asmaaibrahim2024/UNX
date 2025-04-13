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


