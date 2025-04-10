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



  
/**
 * Handles logging of selected points and trace locations for debugging purposes.
 * This function logs:
 * - Selected starting points
 * - Selected barriers
 * - All trace locations
 */
export const addingPointHandler = (selectedPoints, traceLocations) => {
  console.log("Trace Point and Location Information");
  
  // Log selected starting points
  console.log("Selected Starting Points:");
  if (selectedPoints.StartingPoints.length > 0) {
    console.log(selectedPoints.StartingPoints)
  } else {
    console.log("  No starting points selected");
  }
  
  // Log selected barriers
  console.log("Selected Barriers:");
  if (selectedPoints.Barriers.length > 0) {
      console.log(selectedPoints.Barriers)
  } else {
    console.log("  No barriers selected");
  }
  
  // Log trace locations
  console.log("Trace Locations:");
  if (traceLocations.length > 0) {
    traceLocations.forEach((location, index) => {
      console.log(`  ${index + 1}:`, {
        type: location.traceLocationType,
        globalId: location.globalId,
        percentAlong: location.percentAlong
      });
    });
  } else {
    console.log("  No trace locations created");
  }
  
  console.groupEnd();
};


