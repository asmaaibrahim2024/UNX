import React, { useCallback, useEffect, useState } from "react";
import "./ShowAttachment.scss";
import close from "../../../style/images/x-close.svg";
import select from "../../../style/images/select.svg";
import flag from "../../../style/images/flag.svg";
import barrier from "../../../style/images/barrier.svg";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useI18n } from "../../../handlers/languageHandler";
import { setAttachmentVisiblity } from "../../../redux/commonComponents/showAttachment/showAttachmentAction";
import file from "../../../style/images/document-text.svg";
import dot from "../../../style/images/dots-vertical.svg";
import {
  addTablesToNetworkLayers,
  getAttachmentitems,
  getAttributeCaseInsensitive,
  getDomainValues,
  mergeNetworkLayersWithNetworkLayersCache,
} from "../../../handlers/esriHandler";
import { getSelectedPointTerminalId } from "../../widgets/trace/traceHandler";

const ShowAttachment = ({ feature }) => {
  const { t, i18n } = useTranslation("ShowAttachment");
  const { direction } = useI18n("ShowAttachment");
  const dispatch = useDispatch();

  const utilityNetwork = useSelector(
    (state) => state.mapSettingReducer.utilityNetworkMapSetting
  );
  const parentFeature = useSelector(
    (state) => state.showAttachmentReducer.parentFeature
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

  const [items, setItems] = useState([]);

  // effect to load the data when the feature is changed
  useEffect(() => {
    const getAttachmentData = async () => {
      const networkLayers = mergeNetworkLayersWithNetworkLayersCache(
        networkService.networkLayers,
        networkLayersCache
      );
      //adding tables to networklayers
      addTablesToNetworkLayers(layersAndTablesData[0].tables, networkLayers);
      console.log(networkLayers);

      const associationTypes = ["attachment"];
      const attachmentData = await getAttachmentitems(
        associationTypes,
        utilityNetwork,
        parentFeature,
        getSelectedPointTerminalId,
        networkLayers
      );
      console.log(attachmentData);

      setItems(attachmentData);
    };

    getAttachmentData();
  }, [parentFeature]);

  return (
    <div className={`feature-sidebar feature-sidebar-prop ${direction}`}>
      <div className="feature-sidebar-header propertites flex-shrink-0 bg-transparent fw-normal">
        <span>{t("Attachment")}</span>
        <img
          src={close}
          alt="close"
          className="cursor-pointer"
          onClick={() => {
            dispatch(setAttachmentVisiblity(false));
          }}
        />
      </div>

      <div className="feature-sidebar-body flex-fill overflow-auto">
        <div className="feature-sidebar-body-container d-flex flex-column h-100">
          <h2 className="title m_0 flex-shrink-0">
            <span>
              {getAttributeCaseInsensitive(
                getDomainValues(
                  utilityNetwork,
                  parentFeature.attributes,
                  parentFeature.layer,
                  Number(parentFeature.layer.layerId)
                ).rawKeyValues,
                "assetgroup"
              )}
            </span>
            <span className="fw-bold m_l_8">
              #
              {getAttributeCaseInsensitive(
                parentFeature.attributes,
                "objectid"
              )}
            </span>
          </h2>
          <div className="flex-fill overflow-auto">
            <ul className="elements-list-global m_x_2 h-100">
              {items.map((item, index) => {
                console.log(item);
                const objectId = getAttributeCaseInsensitive(
                  item.attributes,
                  "objectid"
                );
                const attributesWithDomainValues = getDomainValues(
                  utilityNetwork,
                  item.attributes,
                  item.layer,
                  Number(item.layer.layerId)
                ).rawKeyValues;
                const assetgroup = getAttributeCaseInsensitive(
                  attributesWithDomainValues,
                  "assetgroup"
                );
                return (
                  <li className="element-item" key={objectId}>
                    <div className="object-header">
                      <span>#{objectId}</span>
                      <span className="m_x_4 item_name">{assetgroup}</span>
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

export default ShowAttachment;
