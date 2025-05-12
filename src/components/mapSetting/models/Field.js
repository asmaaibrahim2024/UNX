
export class Field {
    constructor({
      id,
      fieldNameEN,
      fieldNameAR,
      dbFieldName,
      isSearchable,
      isListDetails,
      isIdentifiable,
      isShowProperties,
      layerId,
    }) {
      this.id = id;
      this.fieldNameEN = fieldNameEN;
      this.fieldNameAR = fieldNameAR;
      this.dbFieldName = dbFieldName;
      this.isSearchable = isSearchable;
      this.isListDetails = isListDetails;
      this.isIdentifiable = isIdentifiable;
      this.isShowProperties = isShowProperties;
      this.layerId = layerId;
    }
  }

  

  