export class TraceHistory {
  constructor({
    id,
    name,
    traceResultJson,
    traceDate,
  }) {
    this.id = id;
    this.name = name;
    this.traceResultJson = traceResultJson;
    this.traceDate = traceDate;
  }
}
