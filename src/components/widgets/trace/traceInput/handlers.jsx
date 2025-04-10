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