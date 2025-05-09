import { React, useState, useEffect } from "react";
import "./SearchResultFields.scss";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useI18n } from "../../../handlers/languageHandler";
import {addLayerToGrid, removeLayerFromGrid} from "../mapSettingHandler";
import { useDispatch, useSelector } from "react-redux";
import { showErrorToast, showSuccessToast } from "../../../handlers/esriHandler";
import reset from "../../../style/images/refresh.svg";
import close from "../../../style/images/x-close.svg";
import trash from "../../../style/images/trash-03.svg";

export default function SearchResultFields() {
  const { t, direction, dirClass, i18nInstance } = useI18n("MapSetting");
  
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [addedLayers, setAddedLayers] = useState([]);
  const [fields, setFields] = useState([]);
  const [adding, setAdding] = useState(false);
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

    

  const statusBodyTemplate = (rowData) => {
    return (
      // <Dropdown
      //   value={rowData.status}
      //   options={statusOptions}
      //   optionLabel="label"
      //   optionValue="value"
      //   onChange={(e) => {
      //     const updatedProducts = [...products];
      //     const rowIndex = updatedProducts.findIndex(
      //       (item) => item.id === rowData.id
      //     );
      //     updatedProducts[rowIndex].status = e.value;
      //     setProducts(updatedProducts);
      //   }}
      //   placeholder="Select Status"
      //   className="w-100"
      //   appendTo="self"
      // />
      <MultiSelect
        value={rowData.selectedFields}
        options={rowData.layerFields}
        optionLabel="name"
        optionValue="id"
        placeholder="Select Field"
        maxSelectedLabels={3}
        className="w-100"
        pt={{
          panel: { className: "mapSetting-layer-panel" },
        }}
        optionDisabled={(option) => option.name.toLowerCase() === "objectid"}
        onChange={(e) => {
          setAddedLayers(prevLayers => 
            prevLayers.map(layer => 
              layer.layerId === rowData.layerId 
                ? { ...layer, selectedFields: e.value } 
                : layer
            )
          );
        }}
      />
    );
  };

  const selectedFieldsBodyTemplate = (rowData) => {
    const selectedIds = rowData.selectedFields;
    const allFields = rowData.layerFields;

    const handleRemoveField = (fieldIdToRemove) => {
      setAddedLayers(prevLayers =>
        prevLayers.map(layer =>
          layer.layerId === rowData.layerId
            ? {
                ...layer,
                selectedFields: layer.selectedFields.filter(
                  (fieldId) => fieldId !== fieldIdToRemove
                ),
              }
            : layer
        )
      );
    };
    return (
      <div>
        <ul className="list-unstyled selected_fields_list">
        {selectedIds.map((fieldId, index) => {
            const field = allFields.find(f => f.id === fieldId);
            const isObjectId = field?.name?.toLowerCase() === "objectid";
            return (
              <li key={fieldId}>
                <div className="d-flex align-items-center">
                <span>{field?.name || fieldId}</span>
                {!isObjectId && (
                    <img
                      src={close}
                      alt="close"
                      className="cursor-pointer m_l_8"
                      height="14"
                      onClick={() => handleRemoveField(fieldId)}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  const deleteBodyTemplate = (rowData) => {
    const handleDeleteLayer = () => {
      setAddedLayers(prevLayers =>
        prevLayers.filter(layer => layer.layerId !== rowData.layerId)
      );
    };

    return (
      <img src={trash} alt="trash" className="cursor-pointer" height="14"  onClick={handleDeleteLayer}/>
    );
  };

  return (
    <div className="card border-0 rounded_0 h-100 p_x_32 p_t_16">
      <div className="card-body d-flex flex-column">

        <div className="w-100 flex-shrink-0">
          <div className="d-flex flex-column m_b_16">
            <label className="m_b_8">{t("Layer Name")}</label>
            <div className="d-flex align-items-center">
              <Dropdown
                value={selectedLayer}
                onChange={(e) => setSelectedLayer(e.value)}
                options={featureServiceLayers}
                optionLabel="name"
                optionValue="id"
                placeholder={t("Select Layer Name")}
                className="flex-fill"
                filter
              />
              <button className="btn_add flex-shrink-0 m_l_16" onClick={() => addLayerToGrid(selectedLayer, utilityNetwork.featureServiceUrl, featureServiceLayers, setAddedLayers, setAdding)}>
              {adding ? t("Adding...") : t("Add")}
              </button>
            </div>
          </div>
        </div>

        <div className="dataGrid w-100 flex-fill overflow-auto">
          <DataTable
            value={addedLayers}
            tableStyle={{ minWidth: "50rem" }}
            scrollable
            scrollHeight="flex"
            stripedRows
            size="small"
          >
            <Column
              style={{ width: 200 }}
              field="layerName"
              header="Layer Name"
            ></Column>
            <Column
              style={{ width: 200 }}
              header="Fields"
              body={statusBodyTemplate}
            ></Column>
            <Column
              field="selectedFields"
              header="Selected Fields"
              body={selectedFieldsBodyTemplate}
            ></Column>
            <Column
              style={{ width: 40 }}
              field="selectedFields"
              header=""
              body={deleteBodyTemplate}
            ></Column>
          </DataTable>
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
