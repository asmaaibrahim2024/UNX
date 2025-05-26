export class TraceResult {
  constructor({
    traceResultsElements,
    traceConfigHighlights,
    savedTraceGeometries,
    groupedTraceResultGlobalIds,
    groupedObjectIds,
    selectedTraceTypes,
    traceLocations,
    selectedPoints
  }) {
    this.traceResultsElements = traceResultsElements;
    this.traceConfigHighlights = traceConfigHighlights;
    this.savedTraceGeometries = savedTraceGeometries;
    this.groupedTraceResultGlobalIds = groupedTraceResultGlobalIds;
    this.groupedObjectIds = groupedObjectIds;
    this.selectedTraceTypes = selectedTraceTypes;
    this.traceLocations = traceLocations;
    this.selectedPoints = selectedPoints;
  }
}
