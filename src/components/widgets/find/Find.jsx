import { useEffect, useState } from "react";
import { MultiSelect } from "primereact/multiselect";
import { Checkbox } from "primereact/checkbox"; // Add this import
import "./Find.scss";
import { useDispatch, useSelector } from "react-redux";
import {
  getAttributeCaseInsensitive,
  createFeatureLayer,
  closeFindPanel,
  showErrorToast,
  mergeNetworkLayersWithNetworkLayersCache,
  removeMultipleFeatureFromSelection,
  removeMultipleTraceStartPoint,
  isValidDate,
  removeMultipleTracePoint,
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
import reset from "../../../style/images/refresh.svg";
import FeatureItem from "./featureItem/FeatureItem";
import SearchResult from "./searchResult/SearchResult";
import { dir } from "i18next";
import { setActiveButton } from "../../../redux/sidebar/sidebarAction";
import { setSelectedFeatures } from "../../../redux/widgets/selection/selectionAction";
import {
  clearTraceSelectedPoints,
  removeTracePoint,
} from "../../../redux/widgets/trace/traceAction";
import { setShowPropertiesFeature } from "../../../redux/commonComponents/showProperties/showPropertiesAction";

const { Option } = Select;

export default function Find({ isVisible, container }) {
  const { t, i18n } = useTranslation("Find");
    const direction = i18n.dir(i18n.language);
  const dispatch = useDispatch();

  const [layers, setLayers] = useState([]);
  const [selectedLayersIds, setSelectedLayersIds] = useState([]);
  const [selectedLayerOptions, setSelectedLayerOptions] = useState([]);
  const [features, setFeatures] = useState([]);
  const [searchClicked, setSearchClicked] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [
    selectedObjectIdsByFindGroupedByLayerTitle,
    setSelectedObjectIdsByFindGroupedByLayerTitle,
  ] = useState({});
  const [startingPointsGlobalIds, setStartingPointsGlobalIds] = useState([]);
  const [barrierPointsGlobalIds, setBarrierPointsGlobalIds] = useState([]);

  const view = useSelector((state) => state.mapViewReducer.intialView);

  const layersAndTablesData = useSelector(
    (state) => state.mapViewReducer.layersAndTablesData
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
  const currentSelectedFeatures = useSelector(
    (state) => state.selectionReducer.selectedFeatures
  );
  const traceGraphicsLayer = useSelector(
    (state) => state.traceReducer.traceGraphicsLayer
  );

  const showSidebar = useSelector((state) => state.findReducer.showSidebar);

  // const [showSidebar, setShowSidebar] = useState(false);

  // use effect to reset the find if the network service is changed
  useEffect(() => {
    handleReset();
    setSelectedLayerOptions([]);
    setSelectedLayersIds([]);
  }, [networkService]);

  const handleEnterSearch = async () => {
    if (!searchValue) {
      showErrorToast(t("Please enter a valid search value"));
      return;
    }

    if (selectedLayersIds.length === 0) {
      showErrorToast(t("Please select a layer"));
      return;
    }

    dispatch(setActiveButton(null)); // close any opened panel when searching

    dispatch(setShowSidebar(true)); // Always show sidebar when pressing Enter
    dispatch(setDisplaySearchResults(true));
    OnSearchClicked();
    // await searchFieldInLayers([1, 2, 3, 6], "ASSETGROUP", searchValue);
  };

  const handleLayerSelectionChange = (e) => {
    const selectedValues = e.value;

    // // the all layers is currentrly selected and the user clicked it
    // if (!selectedValues.includes(-1) && selectedLayerOptions.includes(-1)) {
    //   setSelectedLayerOptions([]);
    //   setSelectedLayersIds([]);
    // }
    // //  the all layers is currentrly selected and the user clicked on any checkbox but not all layers
    // else if (selectedValues.includes(-1) && selectedLayerOptions.includes(-1)) {
    //   const selectedValuesWithoutAllLayers = selectedValues.filter(
    //     (value) => value != -1
    //   );

    //   setSelectedLayerOptions(selectedValuesWithoutAllLayers);
    //   setSelectedLayersIds(selectedValuesWithoutAllLayers);
    // }
    // // the all layers is currenrly not selected and the user clicked it
    // else if (selectedValues.includes(-1)) {
    //   const allLayerIds = layers.map((layer) => layer.id);
    //   setSelectedLayerOptions([...allLayerIds, -1]);
    //   setSelectedLayersIds(allLayerIds);
    // }
    // // the user is clicking any checkbox but not all layers
    // else {
    setSelectedLayerOptions(selectedValues);
    setSelectedLayersIds(selectedValues);
    // }

    setSearchClicked(false);
  };

  useEffect(() => {
    if (!view) return;

    view.when(() => loadLayers());
  }, [view, networkLayersCache]);

  // close the panel if the search value is empty
  useEffect(() => {
    if (searchValue === "")
      closeFindPanel(dispatch, setShowSidebar, setDisplaySearchResults);
  }, [searchValue]);

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
      const networkLayers = mergeNetworkLayersWithNetworkLayersCache(
        networkService.networkLayers,
        networkLayersCache
      );

      const searchableLayerIds = networkLayers
        .filter((nl) => nl.isLayerSearchable === true)
        .map((nl) => nl.layerId);

      const featureLayers = layersAndTablesData[0].layers
        .filter(
          (layer) =>
            layer.type.toLowerCase() === "feature layer" &&
            searchableLayerIds.includes(layer.id)
        )
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

  const OnSearchClicked = async () => {
    await getFilteredFeatures();
    setSearchClicked(true);
  };
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

    const networkLayers = mergeNetworkLayersWithNetworkLayersCache(
      networkService.networkLayers,
      networkLayersCache
    );

    const SelectedNetworklayer = networkLayers.find(
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
    if (!utilityNetwork?.dataElement?.domainNetworks) return [];
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
    else if (
      Number(searchString) &&
      (dataType?.includes("number") ||
        dataType?.includes("integer") ||
        dataType?.includes("double") ||
        dataType?.includes("small-integer"))
    ) {
      whereClauses = `${fieldName} = ${searchString}`;
    }
    // object id
    else if (dataType?.includes("oid") && Number(searchString)) {
      whereClauses = `${fieldName} = ${searchString}`;
    }
    //date
    else if (dataType?.includes("date") && isValidDate(searchString)) {
      const parsed = new Date(searchString);
      const formatted = parsed.toISOString().split("T")[0]; // YYYY-MM-DD
      whereClauses = `${fieldName} = DATE '${formatted}'`;
    }
    // global id
    else if (dataType?.includes("global-id")) {
      whereClauses = `${fieldName} = '${searchString}'`;
    }
    return whereClauses;
  };

  // Format options for MultiSelect
  const layerOptions = [
    // { label: "All Layers", value: -1 },
    ...(layers?.map((layer) => ({
      label: layer.title,
      value: layer.id,
    })) || []),
  ];

  // ////////////////////////////////////

  const getFeatureLayers = async (layerIds) => {
    const networkLayers = mergeNetworkLayersWithNetworkLayersCache(
      networkService.networkLayers,
      networkLayersCache
    );

    const promises = layerIds.map(async (id) => {
      const layerData = layers.find((layer) => layer.id === id);
      if (!layerData) return null;

      const featureServerUrl = networkLayers.find(
        (l) => l.layerId === id
      )?.layerUrl;
      if (!featureServerUrl) return null;

      const featureLayerUrl = `${featureServerUrl}/${layerData.id}`;
      const featureLayer = await createFeatureLayer(featureLayerUrl, {
        outFields: ["*"],
      });

      await featureLayer.load();
      return featureLayer;
    });

    const featureLayers = (await Promise.all(promises)).filter(Boolean); // remove nulls
    return featureLayers;
  };

  const handleReset = () => {
    setSearchValue(""); // clear the input

    dispatch(setShowPropertiesFeature(null));

    closeFindPanel(dispatch, setShowSidebar, setDisplaySearchResults);

    resetSelections();

    resetTraceStartPoints();

    resetTraceBarrierPoints();
  };

  const resetSelections = async () => {
    // removing all selection that were selected by find
    Object.entries(selectedObjectIdsByFindGroupedByLayerTitle).forEach(
      ([key, value]) => {
        removeMultipleFeatureFromSelection(
          currentSelectedFeatures,
          key,
          value,
          dispatch,
          setSelectedFeatures,
          view
        );
      }
    );
    setSelectedObjectIdsByFindGroupedByLayerTitle([]);
  };

  const resetTraceStartPoints = async () => {
    removeMultipleTracePoint(
      startingPointsGlobalIds,
      traceGraphicsLayer,
      dispatch,
      removeTracePoint
    );
    setStartingPointsGlobalIds([]);
  };

  const resetTraceBarrierPoints = async () => {
    removeMultipleTracePoint(
      barrierPointsGlobalIds,
      traceGraphicsLayer,
      dispatch,
      removeTracePoint
    );
    setBarrierPointsGlobalIds([]);
  };

  // ////////////////////////////////////

  // Custom item template with tooltip
  const itemTemplate = (option) => {
    return (
      <div title={option.label} className={`text-truncate w-100 d-block ${ direction === "rtl" && 'item_rtl' }`}>
        <span>{option.label}</span>
      </div>
    );
  };

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
            placeholder={t("select a layer")}
            style={{ width: "170px" }}
            maxSelectedLabels={1} // Show only one label
            filter={false} // Disable filter if not needed
            panelClassName="find_multi_select_panel"
            itemTemplate={itemTemplate}
            panelHeaderTemplate={(options) => (
              <div
                className="flex align-items-center gap-2 p-2"
                onClick={options.onClick}
              >
                <Checkbox
                  inputId="selectAll"
                  checked={
                    selectedLayerOptions?.length === layerOptions?.length
                  }
                  onChange={(e) => {
                    e.checked
                      ? handleLayerSelectionChange({
                          value: layerOptions.map((opt) => opt.value),
                        })
                      : handleLayerSelectionChange({ value: [] });
                  }}
                />{" "}
                <label htmlFor="selectAll" className="cursor-pointer">
                  {selectedLayerOptions?.length === layerOptions?.length
                    ? t("Deselect All")
                    : t("Select All")}
                </label>
              </div>
            )}
          />
        </div>
        <div className="search-input-wrapper">
          <img
            src={search}
            alt="Search"
            className="search-icon"
            onClick={handleEnterSearch}
            title={t("Search")}
          />
          <Input
            type="text"
            placeholder={t("Quick Search")}
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
              title={t("Close")}
              onClick={() => {
                setSearchValue(""); // clear the input

                dispatch(setShowPropertiesFeature(null));

                closeFindPanel(
                  dispatch,
                  setShowSidebar,
                  setDisplaySearchResults
                );
              }}
            />
          )}
        </div>
        <img
          className="cursor-pointer flex-shrink-0"
          src={reset}
          alt="reset"
          onClick={handleReset}
          height="20"
          title={t("Reset")}
        />
      </div>

      <SearchResult
        features={features}
        layers={layers}
        searchClicked={searchClicked}
        showSidebar={showSidebar}
        setSelectedObjectIdsByFindGroupedByLayerTitle={
          setSelectedObjectIdsByFindGroupedByLayerTitle
        }
        selectedObjectIdsByFindGroupedByLayerTitle={
          selectedObjectIdsByFindGroupedByLayerTitle
        }
        startingPointsGlobalIds={startingPointsGlobalIds}
        setStartingPointsGlobalIds={setStartingPointsGlobalIds}
        barrierPointsGlobalIds={barrierPointsGlobalIds}
        setBarrierPointsGlobalIds={setBarrierPointsGlobalIds}
      />
    </div>
  );
  return container ? ReactDOM.createPortal(content, container) : content;
}
