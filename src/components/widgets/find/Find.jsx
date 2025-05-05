import { useEffect, useState } from "react";
import { MultiSelect } from "primereact/multiselect";
import "./Find.scss";
import { useDispatch, useSelector } from "react-redux";
import {
  getAttributeCaseInsensitive,
  createFeatureLayer,
} from "../../../handlers/esriHandler";

import {
  setDisplaySearchResults,
  setSearchResults
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

const { Option } = Select;

export default function Find({ isVisible, container }) {
  const { t, i18n } = useTranslation("Find");
  const dispatch = useDispatch();

  const [layers, setLayers] = useState(null);
  const [selectedLayerId, setSelectedLayerId] = useState(-1);
  const [features, setFeatures] = useState([]);
  const [searchClicked, setSearchClicked] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const view = useSelector((state) => state.mapViewReducer.intialView);

  const layersAndTablesData = useSelector(
    (state) => state.mapViewReducer.layersAndTablesData
  );

  const utilityNetwork = useSelector(
    (state) => state.traceReducer.utilityNetworkIntial
  );

  const networkService = useSelector(
    (state) => state.mapViewReducer.networkService
  );

  // const [showSidebar, setShowSidebar] = useState(false);

  const handleEnterSearch = async () => {
    if (!searchValue) return;

    // setShowSidebar(true); // Always show sidebar when pressing Enter
    dispatch(setDisplaySearchResults(true));
    OnSearchClicked();
    await searchFieldInLayers([1,2,3,6], "ASSETGROUP", searchValue);
  };

  // efect to load layers and to check if the view is loaded or not
  useEffect(() => {
    if (!view) return;
    if (view && layers == null) {
      view.when(() => loadLayers());
    }
  }, [view, layers]);

  //effect to move map elements
  useEffect(() => {
    if (features && searchClicked 
      // && showSidebar
    ) {
      document
        .getElementsByClassName("the_map")[0]
        .classList.add("customMoveMapElements");
    } else {
      document
        .getElementsByClassName("the_map")[0]
        .classList.remove("customMoveMapElements");
    }
  }, [searchValue, features, searchClicked
    // , showSidebar
  ]);

  const loadLayers = async () => {
    try {
      const featureLayers = layersAndTablesData[0].layers
        .filter((layer) => layer.type.toLowerCase() === "feature layer")
        .map((layer) => ({
          id: layer.id,
          title: layer.name,
          type: layer.type,
        }));

      setLayers(featureLayers);
    } catch (error) {
      console.error("Error loading layers:", error);
    }
  };

  const getLayerTitle = () => {
    if (selectedLayerId === -1) return "All Layers";
    return (
      layers.find((layer) => layer.id.toString() === selectedLayerId)?.title ||
      "Unknown Layer"
    );
  };

  const OnSearchClicked = async () => {
    if (!searchValue) {
      await getAllFeatures();
    } else {
      await getFilteredFeatures();
    }
    // setSearchClicked(true);
  };

  const getAllFeatures = async () => {
    if (!selectedLayerId && selectedLayerId !== 0) return;

    const featureLayer = await getFeatureLayer(selectedLayerId);

    try {
      await featureLayer.load();

      const queryFeaturesresult = await featureLayer.queryFeatures({
        where: "1=1",
        outFields: ["*"],
        returnGeometry: true,
      });

      setFeatures(queryFeaturesresult.features);
    } catch (error) {
      console.error("Error loading features:", error);
    }
  };

  const getFilteredFeatures = async () => {
    if (!selectedLayerId && selectedLayerId !== 0) return;

    try {
      if (selectedLayerId === -1) {
        const featuresResult = await getFilteredFeaturesFromAllLayers();

        setFeatures(featuresResult);
      } else {
        const queryFeaturesresult = await getFilteredFeaturesFromSingleLayer();

        setFeatures(queryFeaturesresult.features);
      }
    } catch (error) {
      console.error("Error loading features:", error);
    }
  };

  const getFilteredFeaturesFromAllLayers = async () => {
    const featureLayers = await Promise.all(
      layers.map((l) => getFeatureLayer(l.id))
    );
    const featuresResult = await Promise.all(
      featureLayers.map(async (l) => {
        const whereClause = await getFilteredFeaturesWhereClauseString(
          l.layerId
        );
        if (whereClause === "") return { layer: l, features: [] };

        const queryFeaturesResult = await l.queryFeatures({
          where: whereClause,
          outFields: ["*"],
          returnGeometry: true,
        });

        return { layer: l, features: queryFeaturesResult.features };
      })
    );

    return featuresResult;
  };

  const getFilteredFeaturesFromSingleLayer = async () => {
    const featureLayer = await getFeatureLayer(selectedLayerId);

    const whereClause = await getFilteredFeaturesWhereClauseString(
      selectedLayerId
    );

    if (whereClause === "") return [];

    const queryFeaturesresult = await featureLayer.queryFeatures({
      where: whereClause,
      outFields: ["*"],
      returnGeometry: true,
    });

    return queryFeaturesresult;
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

    const featureLayer = await getFeatureLayer(layerId);
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
          const assetGroup = source.assetGroups.find((group) =>
            group.assetGroupName.toLowerCase().includes(searchString)
          );

          if (assetGroup) {
            assetGroups.push(assetGroup);
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
      const assetType = assetGroup?.assetTypes?.find((type) =>
        type.assetTypeName.toLowerCase().includes(searchString)
      );
      if (assetType) assetTypes.push(assetType);
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
    const matchedDomain = esriField.domain.codedValues.find((cv) =>
      cv.name.toLowerCase().includes(searchString)
    );
    if (matchedDomain) {
      const code =
        typeof matchedDomain.code === "string"
          ? `'${matchedDomain.code}'`
          : matchedDomain.code;

      return `${fieldName} = ${code}`;
    }
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







  const [fieldName] = useState("ASSETGROUP");


  const getFeatureLayer = async (layerId) => {
    const layerData = layers.find((layer) => layer.id === layerId);

    if (!layerData) return;

    const utilityNetworkLayerUrl =
      window.mapConfig.portalUrls.utilityNetworkLayerUrl;
    const featureServerUrl = utilityNetworkLayerUrl
      .split("/")
      .slice(0, -1)
      .join("/");
    const featureLayerUrl = `${featureServerUrl}/${layerData.id}`;

    const featureLayer = await createFeatureLayer(featureLayerUrl, {
      outFields: ["*"],
    });

    await featureLayer.load();
    return featureLayer;
  };

  const getWhereClause = (searchValue, fieldName, esriField) => {
    if (!searchValue || !fieldName || !esriField) return "";
  
    const lowerFieldType = esriField.type.toLowerCase();
  
    // For string/text fields
    if (lowerFieldType.includes("string")) {
      return `${fieldName} LIKE '%${searchValue}%'`;
    }
  
    // For numeric fields
    if (lowerFieldType.includes("integer") || lowerFieldType.includes("double") || lowerFieldType.includes("number")) {
      const number = Number(searchValue);
      if (!isNaN(number)) {
        return `${fieldName} = ${number}`;
      }
    }
  
    // For date fields
    if (lowerFieldType.includes("date")) {
      const date = new Date(searchValue);
      if (!isNaN(date.getTime())) {
        const formatted = date.toISOString().split("T")[0]; // e.g., "2023-05-05"
        return `${fieldName} = DATE '${formatted}'`;
      }
    }
  
    // Fallback (e.g., unmatched type)
    return "";
  };
  

  const searchFieldInLayers = async (layerIds, fieldName, searchString) => {
    const results = [];
  
    for (const layerId of layerIds) {
      const featureLayer = await getFeatureLayer(layerId);
      if (!featureLayer) {
        console.warn(`Layer not found or failed to load: ${layerId}`);
        continue;
      }
  
      const layerFields = featureLayer.fields;
      const targetField = layerFields.find(f => f.name.toLowerCase() === fieldName.toLowerCase());
  
      if (!targetField) {
        console.warn(`Field "${fieldName}" not found in layer ${layerId}`);
        continue;
      }
  
      const whereClause = getWhereClause(searchString, fieldName, targetField);
  
      if (!whereClause) {
        console.warn(`No valid WHERE clause for search "${searchString}" in field "${fieldName}"`);
        continue;
      }
  
      console.log(`Querying layer ${layerId} with WHERE: ${whereClause}`);
  
      try {
        const query = featureLayer.createQuery();
        query.where = whereClause;
        query.outFields = ["*"];
        query.returnGeometry = true;
  
        const response = await featureLayer.queryFeatures(query);
  
        console.log(`Found ${response.features.length} features in layer ${layerId}`);
        results.push({
          layerId,
          features: response.features
        });
      } catch (err) {
        console.error(`Query failed for layer ${layerId}:`, err);
      }
    }
  
    console.log("Results", results);
    dispatch(setSearchResults(results));
    
    return results;
  };
  
  









  if (!isVisible) return null;

  const content = (
    <div className="test">
      <div className="layer-search-bar flex-shrink-0">
        <div className="layer-select">
          {selectedLayerId !== null ?
            <img src={layerActive} alt="Layers" className="layer-fixed-icon" />:
            <img src={layer} alt="Layers" className="layer-fixed-icon" />}
          <MultiSelect
            className="p_l_24 find_multi_select"
            value={selectedLayerId !== null ? [selectedLayerId] : []} // MultiSelect expects an array
            options={layerOptions}
            onChange={(e) => {
              const value = e.value.length > 0 ? e.value[0] : null; // Take the first selected value
              setSelectedLayerId(value);
              setSearchClicked(false);
            }}
            placeholder="All Layers"
            style={{ width: "160px" }}
            maxSelectedLabels={1} // Show only one label
            filter={false} // Disable filter if not needed
            pt={{
              panel: { className: 'find-layer-panel' },
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
                // setShowSidebar(false); // hide the sidebar
                dispatch(setDisplaySearchResults(false));
              }}
            />
          )}
        </div>
      </div>

      


      {/* <SearchResult 
        isVisible={showSidebar}
        // features={features}
        // layers={layers}
        // searchClicked={searchClicked}
        // selectedLayerId={selectedLayerId}
        // setShowSidebar={setShowSidebar}
      /> */}

    </div>
  );
  return container ? ReactDOM.createPortal(content, container) : content;
}
