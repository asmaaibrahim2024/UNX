import {
  createFeatureLayer,
  createUtilityNetwork,
  makeEsriRequest,
} from "../../handlers/esriHandler";
import {
  postRequest,
  showErrorToast,
  showSuccessToast,
} from "../../handlers/esriHandler";
import { Field } from "./models/Field";
import { Layer } from "./models/Layer";
import { NetworkServiceConfig } from "./models/NetworkServiceConfig";
import { interceptor } from "../../handlers/authHandlers/tokenInterceptorHandler";
import SweetAlert from "../../shared/uiControls/swalHelper/SwalHelper";
import { deleteAllTraceHistory } from "../widgets/trace/traceHandler";
import {
  setTraceResultsElements,
  setSelectedTraceTypes,
  clearTraceSelectedPoints,
  setTraceConfigHighlights,
  setGroupedTraceResultGlobalIds,
  setQueriedTraceResultFeaturesMap,
} from "../../redux/widgets/trace/traceAction";
import {
  setExpandedGroups,
  setExpandedObjects,
  setExpandedTypes,
  setSelectedFeatures,
} from "../../redux/widgets/selection/selectionAction";
import {
  setAttachmentParentFeature,
  setAttachmentVisiblity,
} from "../../redux/commonComponents/showAttachment/showAttachmentAction";
import { setShowPropertiesFeature } from "../../redux/commonComponents/showProperties/showPropertiesAction";
import {
  setConnectionFullScreen,
  setConnectionParentFeature,
  setConnectionVisiblity,
} from "../../redux/commonComponents/showConnection/showConnectionAction";
import {
  setContainmentParentFeature,
  setContainmentVisiblity,
} from "../../redux/commonComponents/showContainment/showContainmentAction";

export async function getLayerInfo(featureServiceUrl, selectedLayerId) {
  try {
    const selectedLayerUrl = `${featureServiceUrl}/${selectedLayerId}`;
    const featureLayer = await createFeatureLayer(selectedLayerUrl, {
      outFields: ["*"],
    });
    await featureLayer.load();
    // console.log("Feature Layer:", featureLayer.fields);

    const simplifiedFields = featureLayer.fields.map((field) => ({
      id: field.name, // Using 'name' as a unique identifier
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
}

export function createFieldConfig(fieldRest, layerId) {
  const isObjectId = fieldRest.name.toLowerCase() === "objectid";

  return new Field({
    id: 0, // Default DB id
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

export async function createNetworkServiceConfig(
  allFeatureServiceLayers,
  utilityNetwork
) {
  const networkLayers = [];

  for (const layer of allFeatureServiceLayers) {
    const layerInfo = await getLayerInfo(
      utilityNetwork.featureServiceUrl,
      layer.id
    );
    if (layerInfo) {
      const layerFields = layerInfo.layerFields.map((field) =>
        createFieldConfig(field, layerInfo.layerId)
      );
      const layerConfig = createLayerConfig(
        layerInfo,
        utilityNetwork.featureServiceUrl,
        layerFields
      );
      networkLayers.push(layerConfig);
    }
  }

  const networkServiceData = new NetworkServiceConfig({
    id: 0,
    serviceUrl: utilityNetwork.layerUrl,
    serviceNameEN: utilityNetwork.title,
    serviceNameAR: utilityNetwork.title,
    networkLayers: networkLayers,
  });

  return networkServiceData;
}

export const resetPreviousData = async (dispatch) => {
  // Trace
  dispatch(setTraceResultsElements(null));
  dispatch(clearTraceSelectedPoints());
  dispatch(setSelectedTraceTypes([]));
  dispatch(setGroupedTraceResultGlobalIds({}));
  dispatch(setQueriedTraceResultFeaturesMap({}));

  // selection
  dispatch(setSelectedFeatures([]));
  dispatch(setExpandedGroups([]));
  dispatch(setExpandedTypes([]));
  dispatch(setExpandedObjects([]));

  // show properties
  dispatch(setShowPropertiesFeature(null));

  // attachment
  dispatch(setAttachmentParentFeature(null));
  dispatch(setAttachmentVisiblity(false));

  // connectivity
  dispatch(setConnectionParentFeature(null));
  dispatch(setConnectionVisiblity(false));
  dispatch(setConnectionFullScreen(false));

  // containment
  dispatch(setContainmentParentFeature(null));
  dispatch(setContainmentVisiblity(null));

  // find
  // for the find it has a useEffect to clean it

  try {
    await deleteAllTraceHistory();
  } catch (e) {
    console.error("Could not delete trace history");
  }
};

// Connecting to a new utility network and saving its default configurations in DB
export const connectNetwork = async (
  t,
  isValidUrl,
  utilityNetworkServiceUrl,
  Swal,
  utilityNetwork,
  setUtilityNetworkMapSetting,
  dispatch,
  setConnecting,
  setNetworkLayersCache,
  setNetworkServiceConfig,
  setFeatureServiceLayers
) => {
  if (!isValidUrl(utilityNetworkServiceUrl)) {
    showErrorToast(
      t(
        "Please enter a valid Utility Network Service URL. (https://yourserver/FeatureServer/networkLayerId)"
      )
    );
    return;
  }

  // Sweet Alert
  let confirm;
  // const confirm = await Swal.fire({
  //   title: t("Confirm Network Change"),
  //   text: t(
  //     "You are about to connect to a new Utility Network. The current configuration will be removed. Do you want to continue?"
  //   ),
  //   icon: "warning",
  //   showCancelButton: true,
  //   confirmButtonText: t("Connect"),
  //   cancelButtonText: t("Cancel"),
  //   width: "420px",
  //   customClass: {
  //     popup: "swal2-popup-custom",
  //     title: "swal2-title-custom",
  //     confirmButton: "swal2-confirm-custom",
  //     cancelButton: "swal2-cancel-custom",
  //   },
  // });

  const htmlContentConnect = `<div class="htmlContent">
                                <div class="icon_container icon_container_image nx_scale">
                                    <span class="bookmark_icon_edit img"></span>
                                </div>
                                <h2 class="title_main">${t("Connect")}</h2>
                                <h2 class="title">${t(
                                  "You are about to connect to a new Utility Network. The current configuration will be removed. Do you want to continue?"
                                )}</h2>
                            </div>`;

  SweetAlert(
    "30rem", // Width
    "", // Title
    "", // Title class
    htmlContentConnect, // HTML text
    true, // Show confirm button
    `${t("Connect")}`, // Confirm button text
    "btn btn-primary", // Confirm button class
    true, // Show cancel button
    `${t("Cancel")}`, // Cancel button text
    "btn btn-outline-secondary", // Cancel button class
    false, // Show close button
    "", // Close button class
    "", // Additional text
    "", // Icon
    "", // Container class
    "", // Popup class
    "", // Header class
    "", // Icon class
    "", // Image class
    "", // HTML container class
    "", // Input class
    "", // Input label class
    "", // Validation message class
    "", // Actions class
    "", // Deny button class
    "", // Loader class
    "", // Footer class
    "", // Timer progress bar class
    "",
    false,
    async () => {
      // Confirm callback
      // Backup old network
      const backupUtilityNetwork = utilityNetwork;
      // Disable everything untill connect
      dispatch(setUtilityNetworkMapSetting(null));

      try {
        setConnecting(true);
        // console.log("Connecting to: ", utilityNetworkServiceUrl);
        const newUtilityNetwork = await createUtilityNetwork(
          utilityNetworkServiceUrl
        );

        await newUtilityNetwork.load();
        if (newUtilityNetwork) {
          const featureServiceUrl = newUtilityNetwork.featureServiceUrl;
          const featureService = await makeEsriRequest(featureServiceUrl);
          // Filter only Feature Layers
          const featureLayersOnly = featureService.layers.filter(
            (layer) => layer.type === "Feature Layer"
          );

          const featureTables = featureService.tables;

          const allFeatureServiceLayers = [
            ...featureLayersOnly,
            ...featureTables,
          ];

          // Create the network service configss in DB by default valuesss - POST REQUEST
          const networkServiceConfigData = await createNetworkServiceConfig(
            allFeatureServiceLayers,
            newUtilityNetwork
          );

          // If response failed or error showww error toast not sucesss
          try {
            const networkServiceConfigDataDB = await createNetworkService(
              networkServiceConfigData,
              t
            );

            dispatch(setNetworkLayersCache({}));
            dispatch(setNetworkServiceConfig(networkServiceConfigDataDB));
            dispatch(setUtilityNetworkMapSetting(newUtilityNetwork));
            dispatch(setFeatureServiceLayers(allFeatureServiceLayers));
          } catch (error) {
            console.log(error);
            showErrorToast(t("Couldn't connect to this network service."));
            // Restore backup network
            if (backupUtilityNetwork) {
              dispatch(setUtilityNetworkMapSetting(backupUtilityNetwork));
            }
            return;
          }

          showSuccessToast(t("Connected to the utility network sucessfully"));
          resetPreviousData(dispatch);
        }
      } catch (error) {
        showErrorToast(
          t("Failed to connect. Please check the URL or network.")
        );
        console.error("Connection error:", error);
        // Restore backup network
        if (backupUtilityNetwork) {
          dispatch(setUtilityNetworkMapSetting(backupUtilityNetwork));
        }
      } finally {
        setConnecting(false);
      }
    },
    () => {
      // Cancel callback
      return;
    }
  );

  // if (!confirm.isConfirmed) {
  //   return;
  // }

  // // Backup old network
  // const backupUtilityNetwork = utilityNetwork;
  // // Disable everything untill connect
  // dispatch(setUtilityNetworkMapSetting(null));

  // try {
  //   setConnecting(true);
  //   // console.log("Connecting to: ", utilityNetworkServiceUrl);
  //   const newUtilityNetwork = await createUtilityNetwork(
  //     utilityNetworkServiceUrl
  //   );

  //   await newUtilityNetwork.load();
  //   if (newUtilityNetwork) {
  //     const featureServiceUrl = newUtilityNetwork.featureServiceUrl;
  //     const featureService = await makeEsriRequest(featureServiceUrl);
  //     // Filter only Feature Layers
  //     const featureLayersOnly = featureService.layers.filter(
  //       (layer) => layer.type === "Feature Layer"
  //     );

  //     const featureTables = featureService.tables;

  //     const allFeatureServiceLayers = [
  //       ...featureLayersOnly,
  //       ...featureTables,
  //     ];

  //     // Create the network service configss in DB by default valuesss - POST REQUEST
  //     const networkServiceConfigData = await createNetworkServiceConfig(
  //       allFeatureServiceLayers,
  //       newUtilityNetwork
  //     );

  //     // If response failed or error showww error toast not sucesss
  //     try {
  //       const networkServiceConfigDataDB = await createNetworkService(
  //         networkServiceConfigData,
  //         t
  //       );

  //       dispatch(setNetworkLayersCache({}));
  //       dispatch(setNetworkServiceConfig(networkServiceConfigDataDB));
  //       dispatch(setUtilityNetworkMapSetting(newUtilityNetwork));
  //       dispatch(setFeatureServiceLayers(allFeatureServiceLayers));
  //     } catch (error) {
  //       console.log(error);
  //       showErrorToast(t("Couldn't connect to this network service."));
  //       // Restore backup network
  //       if (backupUtilityNetwork) {
  //         dispatch(setUtilityNetworkMapSetting(backupUtilityNetwork));
  //       }
  //       return;
  //     }

  //     showSuccessToast(t("Connected to the utility network sucessfully"));
  //     resetPreviousData();
  //   }
  // } catch (error) {
  //   showErrorToast(t("Failed to connect. Please check the URL or network."));
  //   console.error("Connection error:", error);
  //   // Restore backup network
  //   if (backupUtilityNetwork) {
  //     dispatch(setUtilityNetworkMapSetting(backupUtilityNetwork));
  //   }
  // } finally {
  //   setConnecting(false);
  // }
};

export const updateAliasesCache = (
  layerId,
  updatedFields,
  selectedLayerOldConfig,
  networkLayersCache,
  setNetworkLayersCache,
  dispatch
) => {
  const newLayerConfig = updateLayerConfig(
    selectedLayerOldConfig,
    updatedFields
  );

  dispatch(
    setNetworkLayersCache({
      ...networkLayersCache,
      [layerId]: newLayerConfig,
    })
  );
};

export const saveAliases = (
  layerId,
  fields,
  setSaveToDb,
  selectedLayerOldConfig,
  networkLayersCache,
  setNetworkLayersCache,
  dispatch
) => {
  setSaveToDb(true);
  updateAliasesCache(
    layerId,
    fields,
    selectedLayerOldConfig,
    networkLayersCache,
    setNetworkLayersCache,
    dispatch
  );
};

function setSelectedFieldsByFlag(config, flag) {
  const fieldFlag = flag?.toLowerCase();

  config.selectedFields =
    config.layerFields
      ?.filter((field) => {
        return (
          field[fieldFlag] || field.dbFieldName?.toLowerCase() === "objectid"
        );
      })
      .map((field) => field.dbFieldName) || [];
}

function setObjectIdFlag(layerConfig, flag) {
  if (!Array.isArray(layerConfig?.layerFields)) return;

  const objectIdField = layerConfig.layerFields.find(
    (field) => field.dbFieldName?.toLowerCase() === "objectid"
  );

  if (objectIdField) {
    objectIdField[flag] = true;
  }
}

export async function addLayerToGrid(
  selectedLayer,
  featureServiceUrl,
  networkServiceConfig,
  setAddedLayers,
  setAdding,
  isLayerSearchable,
  flag,
  networkLayersCache
) {
  if (selectedLayer === null) {
    showErrorToast("Please select a layer.");
    return;
  }
  try {
    setAdding(true);

    // Try to find in Redux cache first
    const cachedLayer = Object.values(networkLayersCache).find(
      (layer) => layer.layerId === selectedLayer
    );

    if (cachedLayer) {
      // Update cache object if necessary
      if (isLayerSearchable) {
        cachedLayer.isLayerSearchable = true;
      }
      setSelectedFieldsByFlag(cachedLayer, flag);
      setObjectIdFlag(cachedLayer, flag);
      setAddedLayers((prevLayers) => {
        const exists = prevLayers.some(
          (layer) => layer.layerId === cachedLayer.layerId
        );
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
      const networkServiceLayerConfig = networkServiceConfig.networkLayers.find(
        (l) => l.layerId === result.layerId
      );
      // To avoid editing in networkServiceConfig itself...clone its layerconfig
      const layerConfig = { ...networkServiceLayerConfig };

      if (layerConfig) {
        // CASE LAYER IN DB
        // Get existing field names from DB config
        const dbFields = layerConfig.layerFields || [];
        const dbFieldNames = dbFields.map((f) => f.dbFieldName);

        // Find new fields in the result that aren't in the DB config
        const newFields = result.layerFields.filter(
          (rf) => !dbFieldNames.includes(rf.name)
        );

        // Create new config objects for each missing field
        const newFieldConfigs = newFields.map((field) =>
          createFieldConfig(field, result.layerId)
        );

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
      } else {
        // CASE LAYER NOT IN DB
        const layerFields = result.layerFields.map((field) =>
          createFieldConfig(field, result.layerId)
        );
        const newLayerConfig = createLayerConfig(
          result,
          featureServiceUrl,
          layerFields
        );
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

      setAddedLayers((prevLayers) => {
        const exists = prevLayers.some(
          (layer) => layer.layerId === addedLayerConfig.layerId
        );

        if (exists) {
          showErrorToast("Cannot add layer. It's already added.");
          return prevLayers; // prevent duplicate
        }

        return [...prevLayers, addedLayerConfig]; // add new layer
      });
    }
  } catch (error) {
    showErrorToast(`Failed to add. ${error}.`);
    console.error("Add error:", error);
  } finally {
    setAdding(false);
  }
}

export async function removeLayerFromGrid(rowData, setAddedLayers) {
  showSuccessToast("Layer deleted successfully.");
}

export function resetFlags(setAddedLayers, networkLayersCacheBackup) {}

export function updateLayerConfig(oldLayerConfig, layerFields) {
  // Create a shallow copy to avoid mutating the original object
  const layerObj = { ...oldLayerConfig };

  // Replace the layerFields with the new ones
  layerObj.layerFields = layerFields;

  return layerObj;
}

// export const showLatest = (networkServiceConfig, networkLayersCache, setAddedLayers, flag, setAddedLayersBackup) => {
//   if (!networkServiceConfig?.networkLayers) return;

//   const getValidLayers = (layers) => {
//   return layers.filter(layer => {
//     if (flag === "isSearchable") {
//       return layer.isLayerSearchable === true;
//     }

//     // Check if any field in layerFields has the flag === true
//     return Array.isArray(layer.layerFields) &&
//       layer.layerFields.some(field => field?.[flag] === true);
//   });
// };

//   const dbLayers = getValidLayers(networkServiceConfig.networkLayers);
//   const cacheLayers = getValidLayers(Object.values(networkLayersCache || {}));

//   console.log("cacheeee validddd layerss",cacheLayers);

//   console.log("networkkk service validddd layerss",dbLayers);

//   const allLayersMap = new Map();

//   // First add cache layers (priority)
//   cacheLayers.forEach(layer => {
//     const copiedLayer = { ...layer };
//     const selectedFields = copiedLayer.layerFields
//       ?.filter(field => field[flag] === true || field.dbFieldName?.toLowerCase() === "objectid")
//       .map(field => field.dbFieldName) || [];
//     copiedLayer.selectedFields = selectedFields;

//     allLayersMap.set(layer.layerId, copiedLayer);
//   });

//   // Then add DB layers only if not already present in the map
//   dbLayers.forEach(layer => {
//     if (!allLayersMap.has(layer.layerId)) {
//       const copiedLayer = { ...layer };
//       const selectedFields = copiedLayer.layerFields
//         ?.filter(field => field[flag] === true || field.dbFieldName?.toLowerCase() === "objectid")
//         .map(field => field.dbFieldName) || [];
//       copiedLayer.selectedFields = selectedFields;

//       allLayersMap.set(layer.layerId, copiedLayer);
//     }
//   });

//   setAddedLayers(Array.from(allLayersMap.values()));
//   setAddedLayersBackup(Array.from(allLayersMap.values()));
// };

export function getAllLayersConfigurationsUpToDate(
  networkServiceConfig,
  networkLayersCache
) {
  if (!networkServiceConfig?.networkLayers) return;

  const cacheLayersRaw = Object.values(networkLayersCache || {});
  const dbLayersRaw = networkServiceConfig.networkLayers;

  const allLayersMap = new Map();

  // Add all cache layers first (priority)
  cacheLayersRaw.forEach((layer) => {
    allLayersMap.set(layer.layerId, { ...layer });
  });

  // Add DB layers only if not already present
  dbLayersRaw.forEach((layer) => {
    if (!allLayersMap.has(layer.layerId)) {
      allLayersMap.set(layer.layerId, { ...layer });
    }
  });

  const allLayers = Array.from(allLayersMap.values());

  return allLayers;
}

export const showLatest = (
  networkServiceConfig,
  networkLayersCache,
  setAddedLayers,
  flag,
  setAddedLayersBackup
) => {
  if (!networkServiceConfig?.networkLayers) return;

  const cacheLayersRaw = Object.values(networkLayersCache || {});
  const dbLayersRaw = networkServiceConfig.networkLayers;

  const allLayersMap = new Map();

  // Add all cache layers first (priority)
  cacheLayersRaw.forEach((layer) => {
    allLayersMap.set(layer.layerId, { ...layer });
  });

  // Add DB layers only if not already present
  dbLayersRaw.forEach((layer) => {
    if (!allLayersMap.has(layer.layerId)) {
      allLayersMap.set(layer.layerId, { ...layer });
    }
  });

  const allLayers = Array.from(allLayersMap.values());

  // Filter valid layers based on flag
  const filteredLayers = allLayers.filter((layer) => {
    if (flag === "isSearchable") {
      return layer.isLayerSearchable === true;
    }

    return (
      Array.isArray(layer.layerFields) &&
      layer.layerFields.some((field) => field?.[flag] === true)
    );
  });

  // Add selectedFields for each filtered layer
  filteredLayers.forEach((layer) => {
    const selectedFields =
      layer.layerFields
        ?.filter(
          (field) =>
            field[flag] === true ||
            field.dbFieldName?.toLowerCase() === "objectid"
        )
        .map((field) => field.dbFieldName) || [];
    layer.selectedFields = selectedFields;
  });

  setAddedLayers(filteredLayers);
  setAddedLayersBackup(filteredLayers);
};

export const saveFlags = async (
  flag,
  addedLayers,
  setAddedLayers,
  networkLayersCache,
  dispatch,
  setNetworkLayersCache,
  removeInfo,
  setRemoveInfo,
  setAddedLayersBackup
) => {
  // Check if removeInfo has isRemove as true
  if (removeInfo?.isRemove) {
    removeInfo.removedLayerConfigs.forEach((removedLayer) => {
      // Check if the removed layer exists in addedLayers
      const existingLayer = addedLayers.find(
        (layer) => layer.layerId === removedLayer.layerId
      );

      if (!existingLayer) {
        // If not found in addedLayers, update the removed layer's flags to false
        const updatedRemovedLayer = {
          ...removedLayer,
          ...(flag === "isSearchable" ? { isLayerSearchable: false } : {}),
          layerFields: removedLayer.layerFields.map((field) => ({
            ...field,
            [flag]: false, // Set the flag to false for removed layer
          })),
        };

        // Update the cache with the modified removed layer
        networkLayersCache[removedLayer.layerId] = updatedRemovedLayer;
        dispatch(setNetworkLayersCache({ ...networkLayersCache }));
      }
    });
    setRemoveInfo({
      isRemove: false,
      removedLayerConfigs: [],
    });
  }

  // For each layer, check which fields the user has selected (from selectedFields).
  const updatedLayers = addedLayers.map((layer) => {
    const selected = layer.selectedFields?.map((f) => f.toLowerCase()) || [];
    // For those selected fields, set the given flags true and other false.
    const updatedFields = layer.layerFields.map((field) => {
      const fieldName = field.dbFieldName?.toLowerCase();
      // if (selected.includes(fieldName)) {
      // return { ...field, [flag]: true };
      return { ...field, [flag]: selected.includes(fieldName) };
      // }
      // return field;
    });

    // Update in networkLayersCache
    //  if layerId exists
    if (networkLayersCache[layer.layerId]) {
      const cachedLayer = networkLayersCache[layer.layerId];

      cachedLayer.layerFields = cachedLayer.layerFields.map((field) => {
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
        layerFields: updatedFields,
      };

      networkLayersCache[layer.layerId] = updatedLayer;
      // dispatch(setNetworkLayersCache({ ...networkLayersCache }));
    }

    return {
      ...layer,
      layerFields: updatedFields,
    };
  });

  setAddedLayers(updatedLayers);

  //  const layersToSend = updatedLayers.map(({ selectedFields, ...rest }) => rest);
  const updatedNetworkLayers = Object.values(networkLayersCache);
  try {
    if (updatedNetworkLayers.length > 0) {
      updateNetworkLayersData(updatedNetworkLayers);
      showSuccessToast("Saved successfully");
      setAddedLayersBackup(updatedLayers);
    }
  } catch (e) {
    console.error("Couldn't save changes to database", e);
  }
};

export const createNetworkService = async (networkServiceConfig) => {
  try {
    const baseUrl = window.mapConfig.ApiSettings.baseUrl;
    const networkServiceEndpoint = "api/UtilityNetwork/CreateNetworkService";
    const networkServiceUrl = `${baseUrl}${networkServiceEndpoint}`;
    const data = await interceptor.postRequest(
      networkServiceEndpoint,
      networkServiceConfig
    );
    if (!data) {
      throw new Error("No response data received from createNetworkService.");
    }
    // console.log("Create requestt responseee", data);
    return data;
  } catch (error) {
    console.error("Failed to create network service configurations:", error);
    showErrorToast(`Failed to create network service configurations: ${error}`);
    // throw error;
  }
};

export const updateNetworkLayersData = async (updatedLayersConfig) => {
  try {
    const baseUrl = window.mapConfig.ApiSettings.baseUrl;
    const networkServiceEndpoint = "api/UtilityNetwork/UpdateNetworkLayersData";
    const networkServiceUrl = `${baseUrl}${networkServiceEndpoint}`;
    const data = await interceptor.postRequest(
      networkServiceEndpoint,
      updatedLayersConfig
    );
    if (!data) {
      throw new Error(
        "No response data received from updateNetworkLayersData."
      );
    }
    // console.log("Update requestt responseee", data);
  } catch (error) {
    console.error("Failed to update network layers' data:", error);
    showErrorToast(`Failed to update network layers' data: ${error}`);
    // throw error;
  }
};
