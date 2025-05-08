import { useEffect, useState } from "react";
import { MultiSelect } from "primereact/multiselect";
import "./Find.scss";
import { useDispatch, useSelector } from "react-redux";
import {
  getAttributeCaseInsensitive,
  createFeatureLayer,
  closeFindPanel,
} from "../../../handlers/esriHandler";

import {
  setDisplaySearchResults,
  setSearchResults,
  setShowSidebar,
} from "../../../redux/widgets/find/findAction";

import React from "react";
import { useTranslation } from "react-i18next";
import * as ReactDOM from "react-dom";
import { Select, Input } from "antd";

import layer from "../../../style/images/layers.svg";
import layerActive from "../../../style/images/layers_active.svg";
import search from "../../../style/images/search.svg";
import close from "../../../style/images/x-close.svg";
import FeatureItem from "./featureItem/FeatureItem";
import SearchResult from "./searchResult/SearchResult";
import { dir } from "i18next";
import { setActiveButton } from "../../../redux/sidebar/sidebarAction";

const { Option } = Select;

export default function Find({ isVisible, container }) {
  const { t, i18n } = useTranslation("Find");
  const dispatch = useDispatch();

  const [popupFeature, setPopupFeature] = useState(null);
  const [layers, setLayers] = useState([]);
  const [selectedLayersIds, setSelectedLayersIds] = useState([]);
  const [selectedLayerOptions, setSelectedLayerOptions] = useState([]);
  const [features, setFeatures] = useState([]);
  const [searchClicked, setSearchClicked] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const view = useSelector((state) => state.mapViewReducer.intialView);

  const layersAndTablesData = useSelector(
    (state) => state.mapViewReducer.layersAndTablesData
  );

  const utilityNetwork = useSelector(
    (state) => state.mapViewReducer.utilityNetworkIntial
  );

  const networkService = useSelector(
    (state) => state.mapViewReducer.networkService
  );
  const showSidebar = useSelector((state) => state.findReducer.showSidebar);

  // const [showSidebar, setShowSidebar] = useState(false);

  const handleEnterSearch = async () => {
    if (!searchValue) return;

    dispatch(setActiveButton(null)); // close any opened panel when searching

    dispatch(setShowSidebar(true)); // Always show sidebar when pressing Enter
    dispatch(setDisplaySearchResults(true));
    OnSearchClicked();
    // await searchFieldInLayers([1, 2, 3, 6], "ASSETGROUP", searchValue);
  };

  const handleLayerSelectionChange = (e) => {
    const selectedValues = e.value;

    // the all layers is currentrly selected and the user clicked it
    if (!selectedValues.includes(-1) && selectedLayerOptions.includes(-1)) {
      setSelectedLayerOptions([]);
      setSelectedLayersIds([]);
    }
    //  the all layers is currentrly selected and the user clicked on any checkbox but not all layers
    else if (selectedValues.includes(-1) && selectedLayerOptions.includes(-1)) {
      const selectedValuesWithoutAllLayers = selectedValues.filter(
        (value) => value != -1
      );

      setSelectedLayerOptions(selectedValuesWithoutAllLayers);
      setSelectedLayersIds(selectedValuesWithoutAllLayers);
    }
    // the all layers is currenrly not selected and the user clicked it
    else if (selectedValues.includes(-1)) {
      const allLayerIds = layers.map((layer) => layer.id);
      setSelectedLayerOptions([...allLayerIds, -1]);
      setSelectedLayersIds(allLayerIds);
    }
    // the user is clicking any checkbox but not all layers
    else {
      setSelectedLayerOptions(selectedValues);
      setSelectedLayersIds(selectedValues);
    }

    setSearchClicked(false);
  };

  useEffect(() => {
    if (!view) return;
    if (view && layers.length === 0) {
      view.when(() => loadLayers());
    }
  }, [view, layers]);

  //effect to move map elements
  useEffect(() => {
    if (features && searchClicked && showSidebar) {
      document
        .getElementsByClassName("the_map")[0]
        .classList.add("customMoveMapElements");
    } else {
      document
        .getElementsByClassName("the_map")[0]
        .classList.remove("customMoveMapElements");
    }
  }, [searchValue, features, searchClicked, showSidebar]);

  const loadLayers = async () => {
    try {
      const networkLayers = networkService.networkLayers;
      const validLayerIds = networkLayers.map((nl) => nl.layerId);

      const featureLayers = layersAndTablesData[0].layers
        .filter(
          (layer) =>
            layer.type.toLowerCase() === "feature layer" &&
            validLayerIds.includes(layer.id)
        )
        .map((layer) => ({
          id: layer.id,
          title: layer.name,
          type: layer.type,
        }));

      console.log(networkService);

      setLayers(featureLayers);
    } catch (error) {
      console.error("Error loading layers:", error);
    }
  };

  const OnSearchClicked = async () => {
    // if (!searchValue) {
    // await getAllFeatures();
    // } else {
    await getFilteredFeatures();
    // }
    setSearchClicked(true);
  };

  // const getAllFeatures = async () => {
  //   if (selectedLayersIds.length === 0) return;

  //   try {
  //     const featureLayers = await getFeatureLayers(selectedLayersIds);
  //     const allFeatures = [];

  //     for (const featureLayer of featureLayers) {
  //       await featureLayer.load();

  //       const queryFeaturesResult = await featureLayer.queryFeatures({
  //         where: "1=1",
  //         outFields: ["*"],
  //         returnGeometry: true,
  //       });

  //       allFeatures.push({
  //         layer: queryFeaturesResult.features[0].layer,
  //         features: queryFeaturesResult.features,
  //       });
  //     }

  //     setFeatures(allFeatures);
  //   } catch (error) {
  //     console.error("Error loading features:", error);
  //   }
  // };

  const getFilteredFeatures = async () => {
    if (selectedLayersIds.length === 0) return;

    try {
      const featuresResult = await getFilteredFeaturesFromSelectedLayers();

      const nonEmptyFeaturesResult = featuresResult.filter(
        (fr) => fr.features.length > 0
      );

      setFeatures(nonEmptyFeaturesResult);
    } catch (error) {
      console.error("Error loading features:", error);
    }
  };

  const getFilteredFeaturesFromSelectedLayers = async () => {
    const featureLayers = await Promise.all(
      selectedLayersIds.map((id) => getFeatureLayers([id]))
    );
    const featuresResult = await Promise.all(
      featureLayers.map(async (l) => {
        l = l[0];
        const whereClause = await getFilteredFeaturesWhereClauseString(
          l.layerId
        );

        if (whereClause === "") return { layer: l, features: [] };

        const queryFeaturesResult = await l.queryFeatures({
          where: whereClause,
          outFields: ["*"],
          returnGeometry: true,
          num: window.findConfig.Configurations.maxReturnedFeaturesCount,
        });

        return { layer: l, features: queryFeaturesResult.features };
      })
    );

    return featuresResult;
  };

  const getFilteredFeaturesWhereClauseString = async (layerId) => {
    const searchString = searchValue.replace(/'/g, "''").toLowerCase();

    const SelectedNetworklayer = networkService.networkLayers.find(
      (nl) => nl.layerId == Number(layerId)
    );

    if (!SelectedNetworklayer) return "";

    const searchableFields = SelectedNetworklayer.layerFields.filter(
      (lf) => lf.isSearchable === true
    );

    const featureLayerList = await getFeatureLayers([layerId]);
    const featureLayer = featureLayerList[0];
    const fieldsWithDomain = featureLayer.fields;

    const whereClauses = await buildWhereClausesFromSearchableFields(
      searchString,
      layerId,
      searchableFields,
      fieldsWithDomain
    );

    return whereClauses.join(" OR ");
  };

  const buildWhereClausesFromSearchableFields = async (
    searchString,
    layerId,
    searchableFields,
    fieldsWithDomain
  ) => {
    const whereClauses = [];

    for (const field of searchableFields) {
      const fieldName = field.dbFieldName;

      const esriField = fieldsWithDomain.find((f) => f.name === fieldName);
      const dataType = esriField?.type?.toLowerCase();

      const clause = await getWhereClausesBasedOnDataType(
        searchString,
        layerId,
        fieldName,
        esriField,
        dataType
      );
      if (clause) whereClauses.push(clause);
    }

    return whereClauses;
  };

  const getAssetGroups = async (searchString, layerId) => {
    const assetGroups = [];
    for (const domainNetwork of utilityNetwork.dataElement.domainNetworks) {
      const sources = [
        ...(domainNetwork.edgeSources || []),
        ...(domainNetwork.junctionSources || []),
      ];

      for (const source of sources) {
        if (source.layerId === layerId && source.assetGroups) {
          const assetGroup = source.assetGroups.filter((group) =>
            group.assetGroupName.toLowerCase().includes(searchString)
          );
          if (assetGroup) {
            assetGroups.push(...assetGroup);
          }
        }
      }
    }
    return assetGroups;
  };

  const getAssetGroupWhereClauseString = async (
    searchString,
    layerId,
    fieldName
  ) => {
    const whereClauses = [];

    const assetGroups = await getAssetGroups(searchString, layerId);

    assetGroups.map((assetGroup) => {
      whereClauses.push(`${fieldName} = ${assetGroup.assetGroupCode}`);
    });
    return whereClauses.join(" OR ");
  };

  const getAssetTypes = async (searchString, layerId) => {
    const assetTypes = [];

    const assetGroups = await getAssetGroups(searchString, layerId);

    assetGroups.map((assetGroup) => {
      const filteredAssetType = assetGroup?.assetTypes?.filter((type) =>
        type.assetTypeName.toLowerCase().includes(searchString)
      );
      if (filteredAssetType.length > 0) assetTypes.push(...filteredAssetType);
    });
    return assetTypes;
  };

  const getAssetTypeWhereClauseString = async (
    searchString,
    layerId,
    fieldName
  ) => {
    const whereClauses = [];

    const assetTypes = await getAssetTypes(searchString, layerId);

    assetTypes.map((assetType) => {
      whereClauses.push(`${fieldName} = ${assetType.assetTypeCode}`);
    });

    return whereClauses.join(" OR ");
  };

  const getDomainWhereClauseString = async (
    searchString,
    esriField,
    fieldName
  ) => {
    const matchedDomains = esriField.domain.codedValues.filter((cv) =>
      cv.name.toLowerCase().includes(searchString)
    );

    if (matchedDomains.length === 0) {
      return;
    }

    const codes = matchedDomains.map((cv) =>
      typeof cv.code === "string" ? `'${cv.code}'` : cv.code
    );

    if (codes.length === 1) {
      return `${fieldName} = ${codes[0]}`;
    } else {
      return `${fieldName} IN (${codes.join(", ")})`;
    }
    // if (matchedDomain) {
    //   const code =
    //     typeof matchedDomain.code === "string"
    //       ? `'${matchedDomain.code}'`
    //       : matchedDomain.code;

    //   return `${fieldName} = ${code}`;
    // }
  };

  const getWhereClausesBasedOnDataType = async (
    searchString,
    layerId,
    fieldName,
    esriField,
    dataType
  ) => {
    let whereClauses = "";

    // special case for assetgroup
    if (fieldName.toLowerCase() == "assetgroup") {
      const assetGroupWhereClauseString = await getAssetGroupWhereClauseString(
        searchString,
        layerId,
        fieldName
      );

      whereClauses = assetGroupWhereClauseString;
    }
    // special case for assettype
    else if (fieldName.toLowerCase() == "assettype") {
      const assetTypeWhereClauseString = await getAssetTypeWhereClauseString(
        searchString,
        layerId,
        fieldName
      );

      whereClauses = assetTypeWhereClauseString;
    }
    // Domain field
    else if (esriField?.domain?.codedValues?.length) {
      const domainWhereClauseString = await getDomainWhereClauseString(
        searchString,
        esriField,
        fieldName
      );
      whereClauses = domainWhereClauseString;
    }
    // string
    else if (dataType?.includes("string")) {
      whereClauses = `${fieldName} LIKE '%${searchString}%'`;
    }
    // number
    else if (dataType?.includes("number")) {
      whereClauses = `${fieldName} = ${searchString}`;
    }
    return whereClauses;
  };

  // Format options for MultiSelect
  const layerOptions = [
    { label: "All Layers", value: -1 },
    ...(layers?.map((layer) => ({
      label: layer.title,
      value: layer.id,
    })) || []),
  ];

  // ////////////////////////////////////

  const getFeatureLayers = async (layerIds) => {
    const utilityNetworkLayerUrl = networkService.serviceUrl;
    const featureServerUrl = utilityNetworkLayerUrl
      .split("/")
      .slice(0, -1)
      .join("/");

    const featureLayers = [];

    for (const id of layerIds) {
      const layerData = layers.find((layer) => layer.id === id);
      if (!layerData) continue;

      const featureLayerUrl = `${featureServerUrl}/${layerData.id}`;
      const featureLayer = await createFeatureLayer(featureLayerUrl, {
        outFields: ["*"],
      });

      await featureLayer.load();

      featureLayers.push(featureLayer);
    }

    return featureLayers;
  };

  // const getWhereClause = (searchValue, fieldName, esriField) => {
  //   if (!searchValue || !fieldName || !esriField) return "";

  //   const lowerFieldType = esriField.type.toLowerCase();

  //   // For string/text fields
  //   if (lowerFieldType.includes("string")) {
  //     return `${fieldName} LIKE '%${searchValue}%'`;
  //   }

  //   // For numeric fields
  //   if (
  //     lowerFieldType.includes("integer") ||
  //     lowerFieldType.includes("double") ||
  //     lowerFieldType.includes("number")
  //   ) {
  //     const number = Number(searchValue);
  //     if (!isNaN(number)) {
  //       return `${fieldName} = ${number}`;
  //     }
  //   }

  //   // For date fields
  //   if (lowerFieldType.includes("date")) {
  //     const date = new Date(searchValue);
  //     if (!isNaN(date.getTime())) {
  //       const formatted = date.toISOString().split("T")[0]; // e.g., "2023-05-05"
  //       return `${fieldName} = DATE '${formatted}'`;
  //     }
  //   }

  //   // Fallback (e.g., unmatched type)
  //   return "";
  // };

  // const searchFieldInLayers = async (layerIds, fieldName, searchString) => {
  //   const results = [];

  //   for (const layerId of layerIds) {
  //     const featureLayer = await getFeatureLayer(layerId);
  //     if (!featureLayer) {
  //       console.warn(`Layer not found or failed to load: ${layerId}`);
  //       continue;
  //     }

  //     const layerFields = featureLayer.fields;
  //     const targetField = layerFields.find(
  //       (f) => f.name.toLowerCase() === fieldName.toLowerCase()
  //     );

  //     if (!targetField) {
  //       console.warn(`Field "${fieldName}" not found in layer ${layerId}`);
  //       continue;
  //     }

  //     const whereClause = getWhereClause(searchString, fieldName, targetField);

  //     if (!whereClause) {
  //       console.warn(
  //         `No valid WHERE clause for search "${searchString}" in field "${fieldName}"`
  //       );
  //       continue;
  //     }

  //     console.log(`Querying layer ${layerId} with WHERE: ${whereClause}`);

  //     try {
  //       const query = featureLayer.createQuery();
  //       query.where = whereClause;
  //       query.outFields = ["*"];
  //       query.returnGeometry = true;

  //       const response = await featureLayer.queryFeatures(query);

  //       console.log(
  //         `Found ${response.features.length} features in layer ${layerId}`
  //       );
  //       results.push({
  //         layerId,
  //         features: response.features,
  //       });
  //     } catch (err) {
  //       console.error(`Query failed for layer ${layerId}:`, err);
  //     }
  //   }

  //   console.log("Results", results);
  //   dispatch(setSearchResults(results));

  //   return results;
  // };

  // ////////////////////////////////////

  if (!isVisible) return null;

  const content = (
    <div className="find_container h-100">
      <div className="layer-search-bar flex-shrink-0">
        <div className="layer-select">
          {selectedLayersIds.length !== 0 ? (
            <img src={layerActive} alt="Layers" className="layer-fixed-icon" />
          ) : (
            <img src={layer} alt="Layers" className="layer-fixed-icon" />
          )}
          <MultiSelect
            className="p_l_24 find_multi_select"
            value={selectedLayerOptions}
            options={layerOptions}
            onChange={handleLayerSelectionChange}
            placeholder="All Layers"
            style={{ width: "160px" }}
            maxSelectedLabels={1} // Show only one label
            filter={false} // Disable filter if not needed
            pt={{
              panel: { className: "find-layer-panel" },
            }}
          />
        </div>
        <div className="search-input-wrapper">
          <img src={search} alt="Search" className="search-icon" />
          <Input
            type="text"
            placeholder="Quick Search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            style={{ flex: 1, border: "none", background: "transparent" }}
            bordered={false}
            onPressEnter={() => handleEnterSearch()}
          />
          {searchValue && (
            <img
              src={close}
              alt="Close"
              className="close-icon"
              onClick={() => {
                setSearchValue(""); // clear the input

                closeFindPanel(
                  dispatch,
                  setShowSidebar,
                  setDisplaySearchResults
                );
              }}
            />
          )}
        </div>
      </div>

      <SearchResult
        features={features}
        layers={layers}
        searchClicked={searchClicked}
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        popupFeature={popupFeature}
        setPopupFeature={setPopupFeature}
      />
    </div>
  );
  return container ? ReactDOM.createPortal(content, container) : content;
}
