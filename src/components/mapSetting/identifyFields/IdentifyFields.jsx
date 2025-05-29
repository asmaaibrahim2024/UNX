import { React, useState, useEffect } from "react";
import "./IdentifyFields.scss";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useI18n } from "../../../handlers/languageHandler";
import {
  addLayerToGrid,
  removeLayerFromGrid,
  saveFlags,
  showLatest,
  // resetFlags,
} from "../mapSettingHandler";

import {
  setHasUnsavedChanges,
  setNetworkLayersCache,
} from "../../../redux/mapSetting/mapSettingAction";

import { useDispatch, useSelector } from "react-redux";
import {
  showErrorToast,
  showSuccessToast,
  showInfoToast,
} from "../../../handlers/esriHandler";
import reset from "../../../style/images/refresh.svg";
import close from "../../../style/images/x-close.svg";
import trash from "../../../style/images/trash-03.svg";
import { HasUnsavedChanges } from "../models/HasUnsavedChanges";
import { isEqual } from "lodash";

export default function IdentifyFields() {
  const { t, direction, dirClass, i18nInstance } = useI18n("MapSetting");

  const [selectedLayer, setSelectedLayer] = useState(null);
  const [addedLayers, setAddedLayers] = useState([]);
  const [fields, setFields] = useState([]);
  const [removeInfo, setRemoveInfo] = useState({
    isRemove: false,
    removedLayerConfigs: [],
  });
  const [adding, setAdding] = useState(false);
  const [addedLayersBackup, setAddedLayersBackup] = useState({});
  const [resetDisabled, setResetDisabled] = useState(true);

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

  const dispatch = useDispatch();

  // Track changes
  useEffect(() => {
    const isSame = isEqual(addedLayers, addedLayersBackup);

    const hasUnsavedChanges = new HasUnsavedChanges({
      tabName: "Identify-Details-Layer-Fields",
      isSaved: addedLayers === addedLayersBackup,
      backup: addedLayersBackup,
      tabStates: [
        "isIdentifiable",
        addedLayers,
        setAddedLayers,
        networkLayersCache,
        dispatch,
        setNetworkLayersCache,
        removeInfo,
        setRemoveInfo,
        setAddedLayersBackup,
      ],
    });

    dispatch(setHasUnsavedChanges(hasUnsavedChanges));
    setResetDisabled(isSame); // disable reset if no changes
  }, [addedLayers, addedLayersBackup]);

  // Show layers from cache or DB
  useEffect(() => {
    showLatest(
      networkServiceConfig,
      networkLayersCache,
      setAddedLayers,
      "isIdentifiable",
      setAddedLayersBackup
    );
  }, [networkServiceConfig, networkLayersCache]);

  useEffect(() => {
    // Set the default selected layer if none is selected
    if (featureServiceLayers.length > 0 && !selectedLayer) {
      setSelectedLayer(featureServiceLayers[0].id);
    }
  }, [featureServiceLayers, selectedLayer]);

  const statusBodyTemplate = (rowData) => {
    return (
      <MultiSelect
        value={rowData.selectedFields}
        options={rowData.layerFields}
        optionLabel="fieldNameEN"
        optionValue="dbFieldName"
        placeholder="Select Field"
        maxSelectedLabels={3}
        showSelectAll={false}
        filter
        className="w-100"
        // pt={{
        //   panel: { className: "mapSetting-layer-panel" },
        // }}
        optionDisabled={(option) =>
          option.dbFieldName.toLowerCase() === "objectid"
        }
        onChange={(e) => {
          if (e.value.length > 10) {
            showInfoToast(t("You can select up to 10 fields only."));
            return; // Do not update if more than 10 selected
          }
          setAddedLayers((prevLayers) =>
            prevLayers.map((layer) =>
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
      setAddedLayers((prevLayers) =>
        prevLayers.map((layer) =>
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
            const field = allFields.find((f) => f.dbFieldName === fieldId);
            const isObjectId = field?.dbFieldName?.toLowerCase() === "objectid";
            return (
              <li key={fieldId}>
                <div className="d-flex align-items-center">
                  <span>{field?.dbFieldName || fieldId}</span>
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
      const layerId = rowData.layerId;

      // Store removed layer's configuration in removedLayerConfigs
      setRemoveInfo((prevState) => ({
        ...prevState,
        isRemove: true,
        removedLayerConfigs: [...prevState.removedLayerConfigs, rowData], // Add rowData to removedLayerConfigs
      }));

      // Remove the layer from addedLayers state
      setAddedLayers((prevLayers) => {
        const updatedLayers = prevLayers.filter(
          (layer) => layer.layerId !== layerId
        );

        return updatedLayers;
      });
    };

    return (
      <img
        src={trash}
        alt="trash"
        className="cursor-pointer"
        height="14"
        onClick={handleDeleteLayer}
      />
    );
  };

  return (
    <div className="card border-0 rounded_0 h-100 p_x_32 p_t_16">
      <div className="card-body d-flex flex-column">
        {/* <div className="w-100 flex-shrink-0">
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
                      <button className="btn_add flex-shrink-0 m_l_16" onClick={() => addLayerToGrid(selectedLayer, utilityNetwork.featureServiceUrl, networkServiceConfig, setAddedLayers, setAdding, false, "isIdentifiable", networkLayersCache)}>
                      {adding ? t("Adding...") : t("Add")}
                      </button>
                    </div>
                  </div>
                </div> */}

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
              field="layerNameEN"
              header={t("Layer Name")}
            ></Column>
            <Column
              style={{ width: 200 }}
              header={t("Fields")}
              body={statusBodyTemplate}
            ></Column>
            <Column
              field="selectedFields"
              header={t("Selected Fields")}
              body={selectedFieldsBodyTemplate}
            ></Column>
            {/* <Column
              style={{ width: 40 }}
              field="selectedFields"
              header=""
              body={deleteBodyTemplate}
            ></Column> */}
          </DataTable>
        </div>
      </div>
      <div className="card-footer bg-transparent border-0">
        <div className="action-btns pb-2">
          <button
            className={`reset ${
              resetDisabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={() => setAddedLayers(addedLayersBackup)}
            disabled={resetDisabled}
          >
            <img src={reset} alt="reset" />
            {t("Reset")}
          </button>
          <button
            className="trace"
            onClick={() =>
              saveFlags(
                "isIdentifiable",
                addedLayers,
                setAddedLayers,
                networkLayersCache,
                dispatch,
                setNetworkLayersCache,
                removeInfo,
                setRemoveInfo,
                setAddedLayersBackup,
                t
              )
            }
          >
            {t("Save")}
          </button>
        </div>
      </div>
    </div>
  );
}
