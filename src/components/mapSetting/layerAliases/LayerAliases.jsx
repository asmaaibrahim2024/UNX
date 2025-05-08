import { React, useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import "./LayerAliases.scss";
import { useI18n } from "../../../handlers/languageHandler";
import reset from "../../../style/images/refresh.svg";
import { useDispatch, useSelector } from "react-redux";
import {getLayerInfo} from "../mapSettingHandler";

export default function LayerAliases() {
  const { t, direction, dirClass, i18nInstance } = useI18n("MapSetting");

  const [aliasEnValue, setAliasEnValue] = useState("");
  const [aliasArValue, setAliasArValue] = useState("");
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [fields, setFields] = useState([]);


  const utilityNetwork = useSelector(
    (state) => state.mapSettingReducer.utilityNetworkMapSetting
  );
  
  const featureServiceLayers = useSelector(
      (state) => state.mapSettingReducer.featureServiceLayers
    );



  useEffect(() => {
  
    // Set the default selected layer if none is selected
    if (featureServiceLayers.length > 0 && !selectedLayer) {
      setSelectedLayer(featureServiceLayers[0].id);
    }
  }, [featureServiceLayers, selectedLayer]);
  

  // Create selected layer feature layer
  useEffect(() => {
    if (selectedLayer !== null) {
      console.log("Selected Layer ID from layer aliases tab:", selectedLayer);

     const fetchLayerFields = async () => {
      const result = await getLayerInfo(utilityNetwork.featureServiceUrl, selectedLayer);
      if (result && result.layerFields) {
        setFields(result.layerFields);
      }
    };

    fetchLayerFields();
      
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
              options={featureServiceLayers}
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
          <button className="trace">{t("Save")}</button>
        </div>
      </div>
    </div>
  );
}
