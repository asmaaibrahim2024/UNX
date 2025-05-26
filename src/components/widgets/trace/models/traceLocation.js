export class TraceLocation {
  constructor(type, globalId, terminalId, percentAlong) {
    this.traceLocationType = type;
    this.globalId = globalId;
    this.terminalId = terminalId;
    this.percentAlong = percentAlong;
  }
}