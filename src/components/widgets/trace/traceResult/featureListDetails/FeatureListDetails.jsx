import { useEffect, useState } from "react";
import {
  createFeatureLayer,
  createQueryFeatures,
  mergeNetworkLayersWithNetworkLayersCache,
  renderListDetailsAttributesToJSX,
  showErrorToast,
} from "../../../../../handlers/esriHandler";
import { useSelector } from "react-redux";

function FeatureListDetails({
  element,
  networkSource,
  networkService,
  utilityNetwork,
  getLayerBySourceId,
}) {
  const [jsx, setJsx] = useState(null);

  const layersAndTablesData = useSelector(
    (state) => state.mapViewReducer.layersAndTablesData
  );
  const networkLayersCache = useSelector(
    (state) => state.mapSettingReducer.networkLayersCache
  );

  useEffect(() => {
    const load = async () => {
      const layer = getLayerBySourceId(networkSource);
      const feature = await queryFeatureByObjectIdWithoutDomainValues(
        Number(layer.id),
        element.objectId
      );
      const jsxResult = renderListDetailsAttributesToJSX(
        feature,
        layer,
        mergeNetworkLayersWithNetworkLayersCache(
          networkService.networkLayers,
          networkLayersCache
        ),
        utilityNetwork
      );
      setJsx(jsxResult);
    };

    load();
  }, [element.id, networkSource, networkService, utilityNetwork]);

  const queryFeatureByObjectIdWithoutDomainValues = async (
    layerOrTableId,
    objectId
  ) => {
    try {
      const validLayersAndTables = [
        ...(layersAndTablesData?.[0]?.layers || []),
        ...(layersAndTablesData?.[0]?.tables || []),
      ].filter((item) => item && item.id !== undefined);

      const selectedLayerOrTable = validLayersAndTables.find(
        (layer) => layer.id === layerOrTableId
      );

      const selectedLayerOrTableUrl = `${utilityNetwork.featureServiceUrl}/${layerOrTableId}`;

      if (!selectedLayerOrTable) {
        console.error(`Layer with ID ${layerOrTableId} not found.`);
        showErrorToast(`Layer with ID ${layerOrTableId} not found.`);
        return null;
      }
      const results = await createQueryFeatures(
        selectedLayerOrTableUrl,
        `objectid = ${objectId}`,
        ["*"],
        true
      );

      const layer = await createFeatureLayer(selectedLayerOrTableUrl, {
        outFields: ["*"],
      });
      await layer.load();

      if (results.length > 0) {
        const geometry = results[0].geometry;
        const attributes = results[0].attributes;
        return {
          attributes: attributes,
          geometry: geometry,
        };
      }

      return null;
    } catch (error) {
      console.error("Error querying feature:", error);
      showErrorToast(`Error querying feature: ${error}`);
      return null;
    }
  };

  return jsx ?? <div>Loading...</div>;
}
export default FeatureListDetails;
