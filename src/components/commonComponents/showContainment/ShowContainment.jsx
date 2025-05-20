import React, { useCallback, useEffect, useRef, useState } from "react";
import "./ShowContainment.scss";
import close from "../../../style/images/x-close.svg";
import select from "../../../style/images/select.svg";
import flag from "../../../style/images/flag.svg";
import barrier from "../../../style/images/barrier.svg";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useI18n } from "../../../handlers/languageHandler";
import { setContainmentVisiblity } from "../../../redux/commonComponents/showContainment/showContainmentAction";
import file from "../../../style/images/document-text.svg";
import dot from "../../../style/images/dots-vertical.svg";
import {
  addTablesToNetworkLayers,
  getAssociationsitems,
  mergeNetworkLayersWithNetworkLayersCache,
} from "../../../handlers/esriHandler";
import { getSelectedPointTerminalId } from "../../widgets/trace/traceHandler";

const ShowContainment = ({ feature }) => {
  const { t, i18n } = useTranslation("ShowContainment");
  const { direction } = useI18n("ShowContainment");
  const dispatch = useDispatch();
  const zIndexPanel = useSelector((state) => state.uiReducer.zIndexPanel);

  // Set z-index: 100 if this component is active, else 1
  const zIndex = zIndexPanel === "ShowContainment" ? 100 : 1;
  // const items = [
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  //   "item",
  // ];

  const showPropertiesFeature = useSelector(
    (state) => state.showPropertiesReducer.showPropertiesFeature
  );

  const menuFeature = useRef(null);

  const utilityNetwork = useSelector(
    (state) => state.mapSettingReducer.utilityNetworkMapSetting
  );
  const parentFeature = useSelector(
    (state) => state.showContainmentReducer.parentFeature
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

  const [items, setItems] = useState([]);

  // effect to load the data when the feature is changed
  useEffect(() => {
    const getContainmentData = async () => {
      const networkLayers = mergeNetworkLayersWithNetworkLayersCache(
        networkService.networkLayers,
        networkLayersCache
      );
      console.log(networkLayers);
      //adding tables to networklayers
      addTablesToNetworkLayers(layersAndTablesData[0].tables, networkLayers);

      const associationTypes = ["containment"];
      const containmentData = await getAssociationsitems(
        associationTypes,
        utilityNetwork,
        parentFeature,
        getSelectedPointTerminalId,
        networkLayers
      );

      setItems(containmentData);
    };

    getContainmentData();
  }, [parentFeature]);

  return (
    <div
      className={`feature-sidebar feature-sidebar-prop ${direction}`}
      style={{ zIndex }}
    >
      <div className="feature-sidebar-header propertites flex-shrink-0 bg-transparent fw-normal">
        <span>{t("Containment")}</span>
        <img
          src={close}
          alt="close"
          className="cursor-pointer"
          onClick={() => {
            dispatch(setContainmentVisiblity(false));
          }}
        />
      </div>

      <div className="feature-sidebar-body flex-fill overflow-auto">
        <div className="feature-sidebar-body-container d-flex flex-column h-100">
          <h2 className="title m_0 flex-shrink-0">
            <span>{t("Fuse")}</span>
            <span className="fw-bold m_l_8">#33255</span>
          </h2>
          <div className="flex-fill overflow-auto">
            <ul className="elements-list-global m_x_2 h-100">
              {items.map((item, index) => {
                return (
                  <li className="element-item" key={index}>
                    <div className="object-header">
                      <span>#0{index + 1}</span>
                      <span className="m_x_4 item_name">{item}</span>
                    </div>
                    <div className="header-action">
                      <img
                        src={file}
                        alt="properties"
                        className="cursor-pointer"
                      />
                      <img src={dot} alt="menu" className="cursor-pointer" />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      <div className="feature-sidebar-footer"></div>
    </div>
  );
};

export default ShowContainment;
