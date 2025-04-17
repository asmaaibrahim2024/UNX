export class SelectedTracePoint {
  constructor(type, globalId, layerId, assetGroupCode, assetTypeCode, terminalId, percentAlong) {
    this.traceLocationType = type;
    this.globalId = globalId;
    this.layerId = layerId;
    this.assetGroupCode = assetGroupCode;
    this.assetTypeCode = assetTypeCode;
    this.terminalId = terminalId;
    this.percentAlong = percentAlong;
  }
}




export class TraceLocation {
  constructor(type, globalId, terminalId, percentAlong) {
    this.traceLocationType = type;
    this.globalId = globalId;
    this.terminalId = terminalId;
    this.percentAlong = percentAlong;
  }
}

