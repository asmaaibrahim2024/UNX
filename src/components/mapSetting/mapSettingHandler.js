

import {createFeatureLayer} from "../../handlers/esriHandler";
import { showErrorToast, showSuccessToast } from "../../handlers/esriHandler";

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

export async function addLayerToGrid(selectedLayer, featureServiceUrl, featureServiceLayers, setAddedLayers) {
    if (selectedLayer === null) {
          showErrorToast("Please select a layer.");
          return;
        }
        const layerObj = featureServiceLayers.find(layer => layer.id === selectedLayer);
      if (!layerObj) {
        showErrorToast("Selected layer not found.");
        return;
      }
          const result = await getLayerInfo(featureServiceUrl, selectedLayer);
          if (result) {
            // Find the OBJECTID field (case-insensitive)
            const objectIdField = result.layerFields.find(f => f.name.toLowerCase() === "objectid");

            const newLayerEntry = {
              layerId: result.layerId,
              layerName: result.layerName,
              layerFields: result.layerFields,
              selectedFields: objectIdField ? [objectIdField.id] : [] // pre-select OBJECTID if it exists
            };
            setAddedLayers(prevLayers => {
              const exists = prevLayers.some(layer => layer.layerId === newLayerEntry.layerId);
          
              if (exists) {
                showErrorToast("Cannot add layer. It's already added.");
                return prevLayers; // prevent duplicate
              }
          
              return [...prevLayers, newLayerEntry]; // add new layer
            });
          }
    
};


export async function removeLayerFromGrid(rowData, setAddedLayers) {
      showSuccessToast("Layer deleted successfully.");
};