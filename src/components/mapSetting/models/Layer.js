import { Field } from "./Field";

export class Layer {
  constructor({
    id,
    layerUrl,
    layerNameEN,
    layerNameAR,
    networkServiceId,
    layerId,
    isLayerSearchable,
    layerFields = [],
  }) {
    this.id = id;
    this.layerUrl = layerUrl;
    this.layerNameEN = layerNameEN;
    this.layerNameAR = layerNameAR;
    this.networkServiceId = networkServiceId;
    this.layerId = layerId;
    this.isLayerSearchable = isLayerSearchable;
    this.layerFields = layerFields.map((field) => new Field(field));
  }
}
