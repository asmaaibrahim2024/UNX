import { Layer } from "./Layer";

export class NetworkServiceConfig {
  constructor({
    id,
    serviceUrl,
    serviceNameEN,
    serviceNameAR,
    networkLayers = [],
  }) {
    this.id = id;
    this.serviceUrl = serviceUrl;
    this.serviceNameEN = serviceNameEN;
    this.serviceNameAR = serviceNameAR;
    this.networkLayers = networkLayers.map((layer) => new Layer(layer));
  }
}
