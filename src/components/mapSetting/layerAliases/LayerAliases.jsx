import { React, useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import "./LayerAliases.scss";
import { useI18n } from "../../../handlers/languageHandler";
import reset from "../../../style/images/refresh.svg";
import { useDispatch, useSelector } from "react-redux";
import isEqual from 'lodash/isEqual';
import {
  getAllLayersConfigurationsUpToDate,
  getLayerInfo,
  saveAliases,
  updateNetworkLayersData,
} from "../mapSettingHandler";
import { Field } from "../models/Field";
import {
  createFieldConfig,
  createLayerConfig,
  updateLayerConfig,
} from "../mapSettingHandler";
import {
  setHasUnsavedChanges,
  setNetworkLayersCache,
} from "../../../redux/mapSetting/mapSettingAction";
import {
  showErrorToast,
  showSuccessToast,
} from "../../../handlers/esriHandler";
import { ProgressSpinner } from "primereact/progressspinner";
import { HasUnsavedChanges } from "../models/HasUnsavedChanges";

export default function LayerAliases() {
  const { t, direction, dirClass, i18nInstance } = useI18n("MapSetting");

  const [aliasEnValue, setAliasEnValue] = useState("");
  const [aliasArValue, setAliasArValue] = useState("");
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState([]);
  const [saveToDb, setSaveToDb] = useState(false);
  const [selectedLayerOldConfig, setSelectedLayerOldConfig] = useState([]);

  // Holds the user edits along the tab
  const [allLayersConfig, setAllLayersConfig] = useState([]);
  // Holds the layers when the user first initialized the tab
  const [allLayersConfigBackup, setAllLayersConfigBackup] = useState([]);

  const [resetDisabled, setResetDisabled] = useState(true);
  
  const [resetClicked, setResetClicked] = useState(false);
  
  const [changedLayersConfig, setChangedLayersConfig] = useState([]);

  const dispatch = useDispatch();

  const utilityNetwork = useSelector(
    (state) => state.mapSettingReducer.utilityNetworkMapSetting
  );

  const networkServiceConfig = useSelector(
    (state) => state.mapSettingReducer.networkServiceConfig
  );

  const featureServiceLayers = useSelector(
    (state) => state.mapSettingReducer.featureServiceLayers
  );

  const networkLayersCache = useSelector(
    (state) => state.mapSettingReducer.networkLayersCache
  );

  // Tracks changes
    useEffect(() => {
      const isSame = isEqual(allLayersConfig, allLayersConfigBackup);

      const hasUnsavedChanges = new HasUnsavedChanges({
        tabName: "Layer-Fields-Aliases",
        isSaved: isEqual(allLayersConfig, allLayersConfigBackup),
        backup: allLayersConfigBackup,
        tabStates: [
          t, changedLayersConfig, networkLayersCache, allLayersConfig, setAllLayersConfigBackup, dispatch
        ]
      });
  
      dispatch(setHasUnsavedChanges(hasUnsavedChanges));
      setResetDisabled(isSame);  // disable reset if no changes

    },[allLayersConfig, allLayersConfigBackup]);

  // Get all data and save it in a temp backup to detect user edits inside the layer aliases tab
  useEffect(() => {
    const allLayersConfig = getAllLayersConfigurationsUpToDate(networkServiceConfig, networkLayersCache);
    const clonedAllLayersConfig = structuredClone(allLayersConfig);
    setAllLayersConfig(clonedAllLayersConfig);
    setAllLayersConfigBackup(structuredClone(clonedAllLayersConfig));
  },[networkServiceConfig, networkLayersCache])


  // Set the default selected layer if none is selected
  useEffect(() => {
    if (featureServiceLayers.length > 0 && !selectedLayer) {
      setSelectedLayer(featureServiceLayers[0].id);
    }
  }, [featureServiceLayers, selectedLayer]);

  // Create selected layer feature layer and set fields to be displayed
  // useEffect(() => {
  //   const fetchLayerFields = async () => {
  //     setLoading(true);

  //     try {
  //       // Get Layer from rest to see if any field was added that do not exist in DB
  //       // Else fetch from API
  //       const result = await getLayerInfo(
  //         utilityNetwork.featureServiceUrl,
  //         selectedLayer
  //       );
  //       if (result && result.layerFields) {
  //         const layerConfig = allLayersConfig.find(
  //           (l) => l.layerId === result.layerId
  //         );
  //         // const layerConfig = null;

  //         if (layerConfig) {
  //           // CASE LAYER EXIST IN DB
  //           const clonedLayerConfig = structuredClone(layerConfig);
  //           setSelectedLayerOldConfig(clonedLayerConfig);
  //           const displayedFields = [];
  //           for (const fieldRest of result.layerFields) {
  //             const fieldConfig = layerConfig.layerFields.find(
  //               (f) => f.dbFieldName === fieldRest.name
  //             );
  //             if (fieldConfig) {
  //               // CASE FIELD EXIST IN DB
  //               displayedFields.push(fieldConfig);
  //             } else {
  //               // CASE FIELD NOT IN DB
  //               // Create field's default configuration
  //               const newFieldConfig = createFieldConfig(
  //                 fieldRest,
  //                 result.layerId
  //               );
  //               displayedFields.push(newFieldConfig);
  //             }
  //           }
  //           setFields(displayedFields);
  //         } else {
  //           // CASE LAYER NOT IN DB
  //           const layerFields = result.layerFields.map((field) =>
  //             createFieldConfig(field, result.layerId)
  //           );
  //           const newLayerConfig = createLayerConfig(
  //             result,
  //             utilityNetwork.featureServiceUrl,
  //             layerFields
  //           );
  //           setFields(newLayerConfig.layerFields);
  //           setSelectedLayerOldConfig(newLayerConfig);
  //         }
  //       }
        
  //     } catch (e) {
  //       console.error("Error: Couldn't fetch layer fields. ", e);
  //       showErrorToast(`${t("Error: Couldn't fetch layer fields. ")} ${e}`);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   if(resetClicked){
  //     const selectedLayerBackup = allLayersConfigBackup.find((l) => l.layerId === selectedLayer);
  //     setFields(selectedLayerBackup.layerFields);
  //   } else if (selectedLayer !== null) {
  //     fetchLayerFields();
  //   }
  // }, [selectedLayer]);

  useEffect(() => {
    const fetchLayerFields = async () => {
      const selectedLayerConfig = allLayersConfig.find((l)=> l.layerId === selectedLayer);
      setFields(selectedLayerConfig.layerFields);
      setSelectedLayerOldConfig(selectedLayerConfig);
    };

    if(resetClicked){
      const selectedLayerBackup = allLayersConfigBackup.find((l) => l.layerId === selectedLayer);
      setFields(selectedLayerBackup.layerFields);
    } else if (selectedLayer !== null) {
      fetchLayerFields();
    }
  }, [selectedLayer]);


  const handleFieldChangeEN = (e, index, layerId) => {
    const updatedFields = [...fields];
    updatedFields[index].fieldNameEN = e.target.value;
    setFields(updatedFields);
    const newLayerConfig = updateLayerConfig(
      selectedLayerOldConfig,
      updatedFields
    );
    // setAllLayersConfig((prevLayers) => {
    //   const exists = prevLayers.some(layer => layer.layerId === newLayerConfig.layerId);
    //   return exists ? prevLayers : [...prevLayers, newLayerConfig];
    // });
    setAllLayersConfig((prevLayers) => {
      const layerIndex = prevLayers.findIndex(layer => layer.layerId === newLayerConfig.layerId);
      
      if (layerIndex >= 0) {
        // Layer exists - create new array with updated layer
        return prevLayers.map((layer, index) => 
          index === layerIndex ? newLayerConfig : layer
        );
      } else {
        // Layer doesn't exist - add it
        return [...prevLayers, newLayerConfig];
      }
    });

    // Update changedLayersConfig if not already added
    setChangedLayersConfig((prevChanged) => {
      const exists = prevChanged.some(layer => layer.layerId === newLayerConfig.layerId);
      return exists ? prevChanged : [...prevChanged, newLayerConfig];
    });
    setResetDisabled(false);
  };

  const handleFieldChangeAR = (e, index, layerId) => {
    const updatedFields = [...fields];
    updatedFields[index].fieldNameAR = e.target.value;
    setFields(updatedFields);
    const newLayerConfig = updateLayerConfig(
      selectedLayerOldConfig,
      updatedFields
    );
    // setAllLayersConfig((prevLayers) => {
    //   const exists = prevLayers.some(layer => layer.layerId === newLayerConfig.layerId);
    //   return exists ? prevLayers : [...prevLayers, newLayerConfig];
    // });
    setAllLayersConfig((prevLayers) => {
      const layerIndex = prevLayers.findIndex(layer => layer.layerId === newLayerConfig.layerId);
      
      if (layerIndex >= 0) {
        // Layer exists - create new array with updated layer
        return prevLayers.map((layer, index) => 
          index === layerIndex ? newLayerConfig : layer
        );
      } else {
        // Layer doesn't exist - add it
        return [...prevLayers, newLayerConfig];
      }
    });

    // Update changedLayersConfig if not already added
    setChangedLayersConfig((prevChanged) => {
      const exists = prevChanged.some(layer => layer.layerId === newLayerConfig.layerId);
      return exists ? prevChanged : [...prevChanged, newLayerConfig];
    });
    setResetDisabled(false);
  };

  const handleReset = () => {
  setAllLayersConfig(structuredClone(allLayersConfigBackup));
  const selectedLayerBackup = allLayersConfigBackup.find(l => l.layerId === selectedLayer);
  setFields(selectedLayerBackup?.layerFields || []);
  setResetClicked(true);
  setTimeout(() => setResetClicked(false), 0); // Reset after state updates
};

  return (
    <div className="card border-0 rounded_0 h-100 p_x_32 p_t_16">
      <div className="card-body">
        <div className="h-100 d-flex flex-column">
          <div className="flex-shrink-0 d-flex flex-column m_b_16">
            <label className="m_b_8">{t("Layer Name")}</label>
            <Dropdown
              value={selectedLayer}
              onChange={(e) => setSelectedLayer(e.value)}
              options={featureServiceLayers}
              optionLabel="name"
              optionValue="id"
              placeholder={t("Select Layer Name")}
              className="w-full md:w-14rem"
              filter
            />
            {loading && (
              <div style={{ width: "20px", height: "20px" }}>
                <ProgressSpinner
                  style={{ width: "20px", height: "20px" }}
                  strokeWidth="4"
                />
              </div>
            )}
          </div>
          <div className="flex-fill overflow-auto p_x_16">
            {fields.map((field, index) => (
              // <div className="row g-4" key={index}>
              <div
                className={`row gx-4 p_t_16 p_b_24 ${
                  index % 2 === 0 ? "row-white" : "row-gray"
                }`}
                key={index}
              >
                <div className="col-4">
                  <div className="d-flex flex-column">
                    <label className="">
                      {/* {t("Field Name")} {index + 1} */}
                      {field.dbFieldName}
                    </label>
                  </div>
                </div>
                <div className="col-4">
                  <div className="d-flex flex-column">
                    <label className="m_b_8">{t("Alias English Name")}</label>
                    <InputText
                      value={field.fieldNameEN}
                      // onChange={(e) => setAliasEnValue(e.target.value)}
                      onChange={(e) =>
                        handleFieldChangeEN(e, index, selectedLayer)
                      }
                      className="p-inputtext-sm"
                    />
                  </div>
                </div>
                <div className="col-4">
                  <div className="d-flex flex-column">
                    <label className="m_b_8">{t("Alias Arabic Name")}</label>
                    <InputText
                      value={field.fieldNameAR}
                      // onChange={(e) => setAliasArValue(e.target.value)}

                      onChange={(e) =>
                        handleFieldChangeAR(e, index, selectedLayer)
                      }
                      className="p-inputtext-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="card-footer bg-transparent border-0">
        <div className="action-btns pb-2">
          <button 
            className={`reset ${resetDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => handleReset()}
            disabled={resetDisabled}
          >
            <img src={reset} alt="reset" />
            {t("Reset")}
          </button>
          <button className="trace" onClick={() => 
            // saveAliases(selectedLayer, fields, setSaveToDb, selectedLayerOldConfig, networkLayersCache, setNetworkLayersCache, dispatch)
            saveAliases(t, changedLayersConfig, networkLayersCache, allLayersConfig, setAllLayersConfigBackup, dispatch)
            }>
            {t("Save")}
          </button>
        </div>
      </div>
    </div>
  );
}
