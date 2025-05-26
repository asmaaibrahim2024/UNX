import React, { useCallback, useEffect, useState } from "react";
import "./ShowConnection.scss";
import close from "../../../style/images/x-close.svg";
import fullScreen from "../../../style/images/extent.svg";
import notFullscreen from "../../../style/images/collapseExtent.svg";
import collapse from "../../../style/images/collapse.svg";
import reset from "../../../style/images/refresh.svg";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import store from "../../../redux/store";
import { useI18n } from "../../../handlers/languageHandler";
import {
  setConnectionVisiblity,
  setConnectionFullScreen,
} from "../../../redux/commonComponents/showConnection/showConnectionAction";
import { OrganizationChart } from "primereact/organizationchart";
import {
  addTablesToNetworkLayers,
  buildWhereClauseForListOfGlobalIds,
  getAttributeCaseInsensitive,
  getConnectivityNodes,
  getDomainValues,
  getFeatureLayers,
  getLayerIdMappedByNetworkSourceId,
  mergeNetworkLayersWithNetworkLayersCache,
  QueryAssociationsForOneElement,
  QueryAssociationsForOneFeature,
  ZoomToFeature,
} from "../../../handlers/esriHandler";
import { getSelectedPointTerminalId } from "../../widgets/trace/traceHandler";

const ShowConnection = () => {
  const dispatch = useDispatch();
  const { t, direction, dirClass, i18nInstance } = useI18n("ShowConnection");

  // used to collapse all the tree nodes only as the component refuses to rerender based on data changes
  const [componentKey, setComponentKey] = useState(0);

  const [isCollapsed, setIsCollapsed] = useState(false);

  const isConnectionVisible = useSelector(
    (state) => state.showConnectionReducer.isConnectionVisible
  );

  const isConnectionFullScreen = useSelector(
    (state) => state.showConnectionReducer.isConnectionFullScreen
  );

  // const data = useSelector((state) => state.showConnectionReducer.data);
  const parentFeature = useSelector(
    (state) => state.showConnectionReducer.parentFeature
  );
  const utilityNetwork = useSelector(
    (state) => state.mapSettingReducer.utilityNetworkMapSetting
  );
  const networkService = useSelector(
    (state) => state.mapSettingReducer.networkServiceConfig
  );
  const networkLayersCache = useSelector(
    (state) => state.mapSettingReducer.networkLayersCache
  );
  const layersAndTablesData = useSelector(
    (state) => state.mapViewReducer.layersAndTablesData
  );
  const view = useSelector((state) => state.mapViewReducer.intialView);

  const [data, setData] = useState([]);

  // effect to load the data when the feature is changed
  useEffect(() => {
    const getConnectivityData = async () => {
      const networkLayers = mergeNetworkLayersWithNetworkLayersCache(
        networkService.networkLayers,
        networkLayersCache
      );

      const associationTypes = ["connectivity"];
      const ConnectivitiyData = await getConnectivityNodes(
        associationTypes,
        utilityNetwork,
        parentFeature,
        getSelectedPointTerminalId,
        networkLayers
      );

      setData(ConnectivitiyData);
    };

    getConnectivityData();
  }, [parentFeature]);

  const getConnectivityNodes = async (
    associationTypes,
    utilityNetwork,
    feature,
    getSelectedPointTerminalId,
    networkLayers
  ) => {
    const featureGlobalId = getAttributeCaseInsensitive(
      feature.attributes,
      "globalid"
    );

    const associations = await QueryAssociationsForOneFeature(
      associationTypes,
      utilityNetwork,
      feature,
      getSelectedPointTerminalId
    );

    const globalIdMap = {};
    const children = await buildTree(
      associations,
      associationTypes,
      utilityNetwork,
      globalIdMap,
      featureGlobalId
    );

    const globalIdToAssetGroupMap = await queryAssetGroupsForTree(
      globalIdMap,
      utilityNetwork,
      networkLayers
    );

    replaceLabelsWithAssetGroup(children, globalIdToAssetGroupMap);

    const rootAttributes = getDomainValues(
      utilityNetwork,
      feature.attributes,
      feature.layer,
      Number(feature.layer.layerId)
    ).rawKeyValues;

    return [
      {
        label: `#${getAttributeCaseInsensitive(
          rootAttributes,
          "objectid"
        )} ${getAttributeCaseInsensitive(rootAttributes, "assetgroup")}`,
        expanded: true,
        feature: feature,
        children,
      },
    ];
  };

  const buildTree = async (
    associations,
    associationTypes,
    utilityNetwork,
    globalIdMap,
    featureGlobalId
  ) => {
    const visited = new Set([featureGlobalId]); // ✅ One shared visited set
    return await Promise.all(
      associations.map((association) => {
        const nextElement =
          association.toNetworkElement.globalId === featureGlobalId
            ? association.fromNetworkElement
            : association.toNetworkElement;

        return buildNode(
          nextElement,
          associationTypes,
          utilityNetwork,
          globalIdMap,
          visited // ✅ Pass the shared Set
        );
      })
    );
  };

  const buildNode = async (
    element,
    associationTypes,
    utilityNetwork,
    globalIdMap,
    visited
  ) => {
    const nsId = element.networkSourceId;
    const gid = element.globalId;

    // Build globalIdMap for asset group labeling
    if (!globalIdMap[nsId]) globalIdMap[nsId] = [];
    if (!globalIdMap[nsId].includes(gid)) {
      globalIdMap[nsId].push(gid);
    }

    if (visited.has(gid)) {
      return {
        label: gid,
        expanded: false,
        children: [],
      }; // ✅ Skip creating any repeated node, even as a leaf
    }

    visited.add(gid); // ✅ Mark as visited

    const associations = await QueryAssociationsForOneElement(
      associationTypes,
      utilityNetwork,
      element
    );

    const children = await Promise.all(
      associations.map((association) => {
        const nextElement =
          association.toNetworkElement.globalId === gid
            ? association.fromNetworkElement
            : association.toNetworkElement;

        return buildNode(
          nextElement,
          associationTypes,
          utilityNetwork,
          globalIdMap,
          visited
        );
      })
    );

    return {
      label: gid,
      expanded: false,
      children,
    };
  };

  const queryAssetGroupsForTree = async (
    globalIdMap,
    utilityNetwork,
    networkLayers
  ) => {
    const globalIdToAssetGroupMap = new Map();
    const networkSourcesIdsToLayersIdsMap =
      await getLayerIdMappedByNetworkSourceId(utilityNetwork);

    const layersIds = Object.keys(globalIdMap).map(
      (id) => networkSourcesIdsToLayersIdsMap[id]
    );

    const featurelayers = await getFeatureLayers(layersIds, networkLayers, {
      outFields: ["assetgroup", "globalid", "objectid"],
    });

    for (const [networkSourceId, globalIds] of Object.entries(globalIdMap)) {
      const whereClause = await buildWhereClauseForListOfGlobalIds(globalIds);
      const layerId = networkSourcesIdsToLayersIdsMap[networkSourceId];
      const currentFeatureLayer = featurelayers.find(
        (fl) => fl.layerId === layerId
      );

      const queryResult = await currentFeatureLayer.queryFeatures({
        where: whereClause,
        outFields: ["globalid", "assetgroup", "objectid"],
        returnGeometry: true,
      });

      for (const f of queryResult.features) {
        const globalId = getAttributeCaseInsensitive(f.attributes, "globalid");

        const attributesWithDomainValues = getDomainValues(
          utilityNetwork,
          f.attributes,
          f.layer,
          Number(f.layer.layerId)
        ).rawKeyValues;

        const assetGroup = getAttributeCaseInsensitive(
          attributesWithDomainValues,
          "assetgroup"
        );

        const objectId = getAttributeCaseInsensitive(
          attributesWithDomainValues,
          "objectid"
        );
        const assetGroupAndObjectid = `#${objectId} ${assetGroup}`;

        globalIdToAssetGroupMap.set(globalId, {
          assetGroupAndObjectid: assetGroupAndObjectid,
          feature: f,
        });
      }
    }

    return globalIdToAssetGroupMap;
  };

  const replaceLabelsWithAssetGroup = (nodes, globalIdToAssetGroupMap) => {
    for (const node of nodes) {
      if (globalIdToAssetGroupMap.has(node.label)) {
        const data = globalIdToAssetGroupMap.get(node.label);
        node.label = data.assetGroupAndObjectid;
        node.feature = data.feature;
      }
      if (node.children?.length) {
        replaceLabelsWithAssetGroup(node.children, globalIdToAssetGroupMap);
      }
    }
  };

  const collapseAllNodes = (nodes) => {
    for (const node of nodes) {
      node.expanded = false;
      if (node.children && node.children.length > 0) {
        collapseAllNodes(node.children);
      }
    }
  };

  const expandAllNodes = (nodes) => {
    for (const node of nodes) {
      node.expanded = true;

      if (node.children && node.children.length > 0) {
        expandAllNodes(node.children);
      }
    }
  };

  const handleCollapseOrExpandAll = () => {
    // used to collapse all the tree nodes only as the component refuses to rerender based on data changes
    setComponentKey((prev) => prev + 1);

    const clonedData = JSON.parse(JSON.stringify(data)); // deep clone

    if (isCollapsed) {
      setIsCollapsed(false);

      expandAllNodes(clonedData);
      setData(clonedData);
    } else {
      setIsCollapsed(true);

      collapseAllNodes(clonedData);
      setData(clonedData);
    }
  };

  const nodeTemplate = (node) => {
    return (
      <div
        className={`p-organizationchart-node ${
          node.expanded ? "expanded-node" : ""
        }`}
      >
        <span>{node.label}</span>
      </div>
    );
  };

  const handleZoomToFeature = async (node) => {
    if (!view) return;
    console.log(node);

    const matchingFeature = node.feature;
    ZoomToFeature(matchingFeature, view);
  };

  return (
    <div
      className={`card card_connnection ${
        isConnectionFullScreen && "fullScreen"
      }`}
    >
      <div className="card-header bg-transparent d-flex justify-content-between align-items-center">
        <span>{t("connection")}</span>
        <div>
          <img
            src={isConnectionFullScreen ? notFullscreen : fullScreen}
            alt="extent"
            className="cursor-pointer m_r_8"
            height={isConnectionFullScreen ? "24" : "16"}
            onClick={() =>
              dispatch(setConnectionFullScreen(!isConnectionFullScreen))
            }
          />
          <img
            src={close}
            alt="close"
            className="cursor-pointer"
            onClick={() => {
              dispatch(setConnectionVisiblity(false));
              dispatch(setConnectionFullScreen(false));
            }}
          />
        </div>
      </div>
      <div className="card-body p_16 overflow-auto">
        <div className="d-flex flex-column h-100">
          <div className="flex-shrink-0 d-flex justify-content-end m_b_24">
            {/* <button className="btn_secondary flex-shrink-0 m_r_8">
              <img src={reset} alt="reset" height="16" />
              <span>{t("reset")}</span>
            </button> */}
            <button
              className="btn_primary flex-shrink-0"
              on
              onClick={handleCollapseOrExpandAll}
            >
              <img src={collapse} alt="collapse" height="16" />
              <span>{isCollapsed ? t("Expand all") : t("Collapse all")}</span>
            </button>
          </div>
          <div className="flex-fill overflow-auto">
            <div className="tree_diagram primereact-container">
              {data.length > 0 ? (
                <OrganizationChart
                  value={data}
                  nodeTemplate={nodeTemplate}
                  key={componentKey}
                  selectionMode="single"
                  // selection={selection}
                  onSelectionChange={(e) => {
                    handleZoomToFeature(e.data);
                  }}
                />
              ) : (
                <div
                  className="loader-container"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    marginTop: "40px",
                  }}
                >
                  <div className="loader"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowConnection;
