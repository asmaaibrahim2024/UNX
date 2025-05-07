import { React, useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import "./LayerAliases.scss";
import { useI18n } from "../../../handlers/languageHandler";
import reset from "../../../style/images/refresh.svg";
import { useDispatch, useSelector } from "react-redux";
import {createFeatureLayer} from "../../../handlers/esriHandler";

export default function LayerAliases() {
  const { t, direction, dirClass, i18nInstance } = useI18n("MapSetting");

  const [aliasEnValue, setAliasEnValue] = useState("");
  const [aliasArValue, setAliasArValue] = useState("");
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [layerOptions, setLayerOptions] = useState(null);
  const [fields, setFields] = useState([]);


  // const featureServiceLayers = useSelector(
  //     (state) => state.mapSettingReducer.featureServiceLayers
  //   );
  const featureServiceLayers = useSelector(
    (state) => state.mapViewReducer.layersAndTablesData[0].layers
  );

  const utilityNetwork = useSelector(
    (state) => state.mapViewReducer.utilityNetworkIntial
  );


  useEffect(() => {
    console.log("featureServiceLayersssssssss", featureServiceLayers);
    
    const options = featureServiceLayers?.map((layer) => ({
      name: layer.name,
      id: layer.id,
    })) || [];
  
    setLayerOptions(options);
  
    // Set the default selected layer if none is selected
    if (options.length > 0 && selectedLayer === null) {
      setSelectedLayer(options[0].id);
    }
  }, [featureServiceLayers, selectedLayer]);
  

  // Create selected layer feature layer
  useEffect(() => {
    if (selectedLayer !== null) {
      console.log("Selected Layer ID:", selectedLayer);

      const getLayerFields = async () => {
        const selectedLayerUrl = `${utilityNetwork.featureServiceUrl}/${selectedLayer}`; 
        const featureLayer = await createFeatureLayer(selectedLayerUrl, {
          outFields: ["*"],
        });
        await featureLayer.load();
        console.log("Feature Layer:", featureLayer.fields);

        const extractedFields = featureLayer.fields.map((field) => ({
          name: field.name,
          alias: field.alias,
        }));
      
        setFields(extractedFields);
        
      }

      getLayerFields();
    }
  }, [selectedLayer]);

  
  return (
    <div className="card border-0 rounded_0 h-100 p_x_32 p_t_16">
      <div className="card-body">
        <div>
          <div className="d-flex flex-column m_b_16">
            <label className="m_b_8">{t("Layer Name")}</label>
            <Dropdown
              value={selectedLayer}
              onChange={(e) => setSelectedLayer(e.value)}
              options={layerOptions}
              optionLabel="name"
              optionValue="id"
              placeholder={t("Select Layer Name")}
              className="w-full md:w-14rem"
              filter
            />
          </div>
          {fields.map((field, index) => (
            <div className="row g-4" key={index}>
              <div className="col-4">
                <div className="d-flex flex-column m_b_16">
                  <label className="m_b_8">
                    {/* {t("Field Name")} {index + 1} */}
                    {field.name}
                  </label>
                </div>
              </div>
              <div className="col-4">
                <div className="d-flex flex-column m_b_16">
                  <label className="m_b_8">
                    {t("Alias English Name")}
                  </label>
                  <InputText
                    value={field.alias}
                    onChange={(e) => setAliasEnValue(e.target.value)}
                    className="p-inputtext-sm"
                  />
                </div>
              </div>
              <div className="col-4">
                <div className="d-flex flex-column m_b_16">
                  <label className="m_b_8">
                    {t("Alias Arabic Name")}
                  </label>
                  <InputText
                    value={field.alias}
                    onChange={(e) => setAliasArValue(e.target.value)}
                    className="p-inputtext-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="card-footer bg-transparent border-0">
        <div className="action-btns pb-2">
          <button className="reset">
            <img src={reset} alt="reset" />
            {t("Reset")}
          </button>
          <button className="trace">{t("Connect")}</button>
        </div>
      </div>
    </div>
  );
}
