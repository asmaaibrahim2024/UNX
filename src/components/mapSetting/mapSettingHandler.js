

import {createFeatureLayer} from "../../handlers/esriHandler";
import { postRequest, showErrorToast, showSuccessToast } from "../../handlers/esriHandler";
import { Field } from "./models/Field";
import { Layer } from "./models/Layer";
import { NetworkServiceConfig } from "./models/NetworkServiceConfig";
import { interceptor } from '../../handlers/authHandlers/tokenInterceptorHandler';

export async function getLayerInfo(featureServiceUrl, selectedLayerId) {
    try {
        const selectedLayerUrl = `${featureServiceUrl}/${selectedLayerId}`; 
        const featureLayer = await createFeatureLayer(selectedLayerUrl, {
        outFields: ["*"],
        });
        await featureLayer.load();
        // console.log("Feature Layer:", featureLayer.fields);

        const simplifiedFields = featureLayer.fields.map(field => ({
          id: field.name,           // Using 'name' as a unique identifier
          name: field.name,
          alias: field.alias,
      }));

        return {
        layerId: featureLayer.layerId,
        layerName: featureLayer.title,
        layerFields: simplifiedFields,
        };
    } catch (error) {
        console.error("Error loading feature layer:", error);
        return null;
    }
};

export function createFieldConfig(fieldRest, layerId) {
  const isObjectId = fieldRest.name.toLowerCase() === "objectid";

  return new Field({
    id: 0,  // Default DB id
    fieldNameEN: fieldRest.alias,
    fieldNameAR: fieldRest.alias,
    dbFieldName: fieldRest.name,
    isSearchable: false,
    isListDetails: isObjectId,
    isIdentifiable: isObjectId,
    isShowProperties: isObjectId,
    layerId: 0, // Mapped to default DB id
  });
}

export function createLayerConfig(layerInfo, featureServiceUrl, layerFields) {
  // const layerFields = layerInfo.layerFields.map((field) => createFieldConfig(field, layerInfo.layerId));

  const layerObj = new Layer({
    id: 0,
    layerUrl: `${featureServiceUrl}/${layerInfo.layerId}`,
    layerNameEN: layerInfo.layerName,
    layerNameAR: layerInfo.layerName,
    networkServiceId: 0,
    layerId: layerInfo.layerId,
    isLayerSearchable: false,
    layerFields: layerFields,
  });
  return layerObj;
}

export async function createNetworkServiceConfig(featureLayersOnly, utilityNetwork) {
  const networkLayers = [];

  for (const layer of featureLayersOnly) { 
    const layerInfo = await getLayerInfo(utilityNetwork.featureServiceUrl, layer.id);
      if (layerInfo) {
        const layerFields = layerInfo.layerFields.map((field) => createFieldConfig(field, layerInfo.layerId));
        const layerConfig = createLayerConfig(layerInfo, utilityNetwork.featureServiceUrl, layerFields);
        networkLayers.push(layerConfig);
    }
  }

  const networkServiceData = new NetworkServiceConfig({
    id: 0,
    serviceUrl: utilityNetwork.layerUrl,
    serviceNameEN: utilityNetwork.title,
    serviceNameAR: utilityNetwork.title,
    networkLayers: networkLayers
  });

  return networkServiceData;

};



function setSelectedFieldsByFlag(config, flag) {
  const fieldFlag = flag?.toLowerCase();

  config.selectedFields = config.layerFields?.filter(field => {
    return field[fieldFlag] || field.dbFieldName?.toLowerCase() === "objectid";
  }).map(field => field.dbFieldName) || [];
}

function setObjectIdFlag(layerConfig, flag) {
  if (!Array.isArray(layerConfig?.layerFields)) return;

  const objectIdField = layerConfig.layerFields.find(
    field => field.dbFieldName?.toLowerCase() === "objectid"
  );

  if (objectIdField) {
    objectIdField[flag] = true;
  }
}


export async function addLayerToGrid(selectedLayer, featureServiceUrl, networkServiceConfig, setAddedLayers, setAdding, isLayerSearchable, flag, networkLayersCache) {
    if (selectedLayer === null) {
      showErrorToast("Please select a layer.");
      return;
    }
    try {
      setAdding(true);

      // Try to find in Redux cache first
    const cachedLayer = Object.values(networkLayersCache).find(
      layer => layer.layerId === selectedLayer
    );

    if (cachedLayer) {
      // Update cache object if necessary
      if (isLayerSearchable) {
        cachedLayer.isLayerSearchable = true;
      }
      setSelectedFieldsByFlag(cachedLayer, flag);
      setObjectIdFlag(cachedLayer, flag);
      setAddedLayers(prevLayers => {
        const exists = prevLayers.some(layer => layer.layerId === cachedLayer.layerId);
        if (exists) {
          showErrorToast("Cannot add layer. It's already added.");
          return prevLayers;
        }
        return [...prevLayers, cachedLayer];
      });

      return; //  Exit since we used the cache
    }

    // Otherwise proceed with fetching the layer info
      let addedLayerConfig;
      const result = await getLayerInfo(featureServiceUrl, selectedLayer);
      if (result) {

        const layerConfig = networkServiceConfig.networkLayers.find(l => l.layerId === result.layerId);
        if(layerConfig) { // CASE LAYER IN DB
          // Get existing field names from DB config
          const dbFields = layerConfig.layerFields || [];
          const dbFieldNames = dbFields.map(f => f.dbFieldName);

          // Find new fields in the result that aren't in the DB config
          const newFields = result.layerFields.filter(
            rf => !dbFieldNames.includes(rf.name)
          );

          // Create new config objects for each missing field
          const newFieldConfigs = newFields.map(field => createFieldConfig(field, result.layerId));
          
          const mergedFields = [...dbFields, ...newFieldConfigs];

          // Update the config with the merged fields
          layerConfig.layerFields = mergedFields;

          
          if (isLayerSearchable) {
          layerConfig.isLayerSearchable = true;
          
          // layerConfig.selectedFields = layerConfig.layerFields
          // ?.filter(field => field.isSearchable || field.dbFieldName.toLowerCase() === "objectid")
          // .map(field => field.dbFieldName) || [];
          }
          setSelectedFieldsByFlag(layerConfig, flag);
          setObjectIdFlag(layerConfig, flag);
          addedLayerConfig = layerConfig;
        } else { // CASE LAYER NOT IN DB
          const layerFields = result.layerFields.map((field) => createFieldConfig(field, result.layerId));
          const newLayerConfig = createLayerConfig(result, featureServiceUrl, layerFields);
          if (isLayerSearchable) {
            newLayerConfig.isLayerSearchable = true;
            // newLayerConfig.selectedFields = newLayerConfig.layerFields
            // ?.filter(field => field.isSearchable || field.dbFieldName.toLowerCase() === "objectid")
            // .map(field => field.dbFieldName) || [];
          }
          setSelectedFieldsByFlag(newLayerConfig, flag);
          setObjectIdFlag(newLayerConfig, flag);
          addedLayerConfig = newLayerConfig;
        }

        // layerConfig.selectedFields = layerConfig.layerFields
        // ?.filter(field => field.isSearchable || field.dbFieldName.toLowerCase() === "objectid")
        // .map(field => field.dbFieldName) || [];

        setAddedLayers(prevLayers => {
          const exists = prevLayers.some(layer => layer.layerId === addedLayerConfig.layerId);
      
          if (exists) {
            showErrorToast("Cannot add layer. It's already added.");
            return prevLayers; // prevent duplicate
          }
      
          return [...prevLayers, addedLayerConfig]; // add new layer
        });
      }
    } catch(error) {
      showErrorToast(`Failed to add. ${error}.`);
      console.error("Add error:", error);
    } finally {
      setAdding(false);
    }
    
};


export async function removeLayerFromGrid(rowData, setAddedLayers) {
      showSuccessToast("Layer deleted successfully.");
};



export function resetFlags(setAddedLayers, networkLayersCacheBackup) {
  

}



export function updateLayerConfig(oldLayerConfig, layerFields) {

  // Create a shallow copy to avoid mutating the original object
  const layerObj = { ...oldLayerConfig };

  // Replace the layerFields with the new ones
  layerObj.layerFields = layerFields;

  return layerObj;
}



export const showLatest = (networkServiceConfig, networkLayersCache, setAddedLayers, flag, setAddedLayersBackup) => {
  if (!networkServiceConfig?.networkLayers) return;

  const getValidLayers = (layers) => {
  return layers.filter(layer => {
    if (flag === "isSearchable") {
      return layer.isLayerSearchable === true;
    }

    // Check if any field in layerFields has the flag === true
    return Array.isArray(layer.layerFields) &&
      layer.layerFields.some(field => field?.[flag] === true);
  });
};


  const dbLayers = getValidLayers(networkServiceConfig.networkLayers);
  const cacheLayers = getValidLayers(Object.values(networkLayersCache || {}));

  const allLayersMap = new Map();

  // First add cache layers (priority)
  cacheLayers.forEach(layer => {
    const copiedLayer = { ...layer };
    const selectedFields = copiedLayer.layerFields
      ?.filter(field => field[flag] === true || field.dbFieldName?.toLowerCase() === "objectid")
      .map(field => field.dbFieldName) || [];
    copiedLayer.selectedFields = selectedFields;

    allLayersMap.set(layer.layerId, copiedLayer);
  });

  // Then add DB layers only if not already present in the map
  dbLayers.forEach(layer => {
    if (!allLayersMap.has(layer.layerId)) {
      const copiedLayer = { ...layer };
      const selectedFields = copiedLayer.layerFields
        ?.filter(field => field[flag] === true || field.dbFieldName?.toLowerCase() === "objectid")
        .map(field => field.dbFieldName) || [];
      copiedLayer.selectedFields = selectedFields;

      allLayersMap.set(layer.layerId, copiedLayer);
    }
  });

  setAddedLayers(Array.from(allLayersMap.values()));
  setAddedLayersBackup(Array.from(allLayersMap.values()));
};



export const saveFlags = async (flag, addedLayers, setAddedLayers, networkLayersCache, dispatch, setNetworkLayersCache, removeInfo, setRemoveInfo) => {
  // Check if removeInfo has isRemove as true
  if (removeInfo?.isRemove) {
    removeInfo.removedLayerConfigs.forEach(removedLayer => {
      // Check if the removed layer exists in addedLayers
      const existingLayer = addedLayers.find(layer => layer.layerId === removedLayer.layerId);

      if (!existingLayer) {
        // If not found in addedLayers, update the removed layer's flags to false
        const updatedRemovedLayer = {
          ...removedLayer,
          layerFields: removedLayer.layerFields.map(field => ({
            ...field,
            [flag]: false // Set the flag to false for removed layer
          }))
        };
        
        // Update the cache with the modified removed layer
        networkLayersCache[removedLayer.layerId] = updatedRemovedLayer;
        dispatch(setNetworkLayersCache({ ...networkLayersCache }));
        console.log("Updated removed layer's flags to false in cache", networkLayersCache);
      }
    });
    setRemoveInfo({
        isRemove: false,
        removedLayerConfigs: []
      });
  }

  // For each layer, check which fields the user has selected (from selectedFields).
   const updatedLayers = addedLayers.map(layer => {
    const selected = layer.selectedFields?.map(f => f.toLowerCase()) || [];
    // For those selected fields, set the given flags true and other false.
    const updatedFields = layer.layerFields.map(field => {
      const fieldName = field.dbFieldName?.toLowerCase();
      // if (selected.includes(fieldName)) {
        // return { ...field, [flag]: true };
        return { ...field, [flag]: selected.includes(fieldName)};
      // }
      // return field;
    });

    

    // Update in networkLayersCache
    //  if layerId exists
    if (networkLayersCache[layer.layerId]) {
      const cachedLayer = networkLayersCache[layer.layerId];

      cachedLayer.layerFields = cachedLayer.layerFields.map(field => {
        const fieldName = field.dbFieldName?.toLowerCase();
        // if (selected.includes(fieldName)) {
          // return { ...field, [flag]: true };
          return { ...field, [flag]: selected.includes(fieldName) };
        // }
        // return field;
      });
    } else {
      // If layerId is not found, add the entire layer object to the cache
      // Exclude selectedFields from the layer before adding it to the cache
      // Create the final updated layer (excluding selectedFields for cache)
      const { selectedFields, ...layerWithoutSelected } = layer;
      const updatedLayer = {
        ...layerWithoutSelected,
        layerFields: updatedFields
      };
      
      networkLayersCache[layer.layerId] = updatedLayer;
      dispatch(setNetworkLayersCache({ ...networkLayersCache }));
      // console.log("after cache update from the added layerssss", networkLayersCache);

    }
    
    return {
      ...layer,
      layerFields: updatedFields
    };
  });

  setAddedLayers(updatedLayers);

//  const layersToSend = updatedLayers.map(({ selectedFields, ...rest }) => rest);
const updatedNetworkLayers = Object.values(networkLayersCache);

if (updatedNetworkLayers.length > 0) {
   updateNetworkLayersData(updatedNetworkLayers);
  showSuccessToast("Saved successfully");
}


};

export const createNetworkService = async (networkServiceConfig) => {
  try {
    const baseUrl = window.mapConfig.ApiSettings.baseUrl;
    const networkServiceEndpoint = "api/UtilityNetwork/CreateNetworkService";
    const networkServiceUrl = `${baseUrl}${networkServiceEndpoint}`;
    const data = await interceptor.postRequest(networkServiceEndpoint, networkServiceConfig);
    if (!data) {
      throw new Error("No response data received from createNetworkService.");
    }
    console.log("Create requestt responseee", data);
    return data;
    
  } catch (error) {
    console.error("Failed to create network service configurations:", error);
    showErrorToast(`Failed to create network service configurations: ${error}`);
    throw error;
  }
};



export const updateNetworkLayersData = async (updatedLayersConfig) => {
  try {
    const baseUrl = window.mapConfig.ApiSettings.baseUrl;
    const networkServiceEndpoint = "api/UtilityNetwork/UpdateNetworkLayersData";
    const networkServiceUrl = `${baseUrl}${networkServiceEndpoint}`;
    const data = await interceptor.postRequest(networkServiceEndpoint, updatedLayersConfig);
    if (!data) {
      throw new Error("No response data received from updateNetworkLayersData.");
    }
    // console.log("Update requestt responseee", data);
    
  } catch (error) {
    console.error("Failed to update network layers' data:", error);
    showErrorToast(`Failed to update network layers' data: ${error}`);
    throw error;
  }
};
