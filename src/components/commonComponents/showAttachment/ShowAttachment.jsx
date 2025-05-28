import React, { useCallback, useEffect, useRef, useState } from "react";
import "./ShowAttachment.scss";
import close from "../../../style/images/x-close.svg";
import select from "../../../style/images/select.svg";
import flag from "../../../style/images/flag.svg";
import barrier from "../../../style/images/barrier.svg";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useI18n } from "../../../handlers/languageHandler";
import {
  setAttachmentParentFeature,
  setAttachmentVisiblity,
} from "../../../redux/commonComponents/showAttachment/showAttachmentAction";
import file from "../../../style/images/document-text.svg";
import dot from "../../../style/images/dots-vertical.svg";
import {
  addOrRemoveBarrierPoint,
  addTablesToNetworkLayers,
  buildWhereClauseForListOfGlobalIds,
  filterAssociationsByFromGlobalId,
  filterAssociationsByToGlobalId,
  getAssociationsitems,
  getAttachmentitems,
  getAttributeCaseInsensitive,
  getDomainValues,
  getFeatureLayers,
  getLayerIdMappedByNetworkSourceId,
  isBarrierPoint,
  mergeNetworkLayersWithNetworkLayersCache,
  QueryAssociationsForOneFeature,
  showErrorToast,
  ZoomToFeature,
} from "../../../handlers/esriHandler";
import { getSelectedPointTerminalId } from "../../widgets/trace/traceHandler";
import { Menu } from "primereact/menu";
import MenuItems from "../menuItems/MenuItems";
import { setShowPropertiesFeature } from "../../../redux/commonComponents/showProperties/showPropertiesAction";
import { setZIndexPanel } from "../../../redux/ui/uiAction";

const ShowAttachment = () => {
  const { t, i18n } = useTranslation("ShowAttachment");
  const { direction } = useI18n("ShowAttachment");
  const dispatch = useDispatch();

  const menuFeature = useRef(null);
  // Function to close the menu
  const closeMenu = (event) => {
    if (menuFeature.current) {
      menuFeature.current.hide(event);
    }
  };

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

  const view = useSelector((state) => state.mapViewReducer.intialView);

  const zIndexPanel = useSelector((state) => state.uiReducer.zIndexPanel);

  // Set z-index: 100 if this component is active, else 1
  const zIndex = zIndexPanel === "ShowAttachment" ? 100 : 1;

  const showPropertiesFeature = useSelector(
    (state) => state.showPropertiesReducer.showPropertiesFeature
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
      // addTablesToNetworkLayers(layersAndTablesData[0].tables, networkLayers);

      const associationTypes = ["attachment"];
      const attachmentData = await getAssociationsitems(
        associationTypes,
        utilityNetwork,
        parentFeature,
        getSelectedPointTerminalId,
        networkLayers
      );

      setItems(attachmentData);
    };

    getAttachmentData();
  }, [parentFeature]);

  const handleZoomToFeature = async (item) => {
    const matchingFeature = item;
    ZoomToFeature(matchingFeature, view);
  };

  const showProperties = (item) => {
    const matchingFeature = item;

    if (matchingFeature) {
      if (
        showPropertiesFeature &&
        getAttributeCaseInsensitive(matchingFeature.attributes, "objectid") ==
          getAttributeCaseInsensitive(
            showPropertiesFeature.attributes,
            "objectid"
          )
      ) {
        //ui commented by ui to only open right panel not toggle it
        //dispatch(setShowPropertiesFeature(null));
        //return;
      }

      dispatch(setShowPropertiesFeature(matchingFeature));
      dispatch(setZIndexPanel("ShowProperties"));
    }
  };

  return (
    <div
      className={`feature-sidebar feature-sidebar-prop ${direction}`}
      style={{ zIndex }}
    >
      <div className="feature-sidebar-header propertites flex-shrink-0 bg-transparent fw-normal">
        <span>{t("Attachment")}</span>
        <img
          src={close}
          alt="close"
          className="cursor-pointer"
          onClick={() => {
            dispatch(setAttachmentParentFeature(null));
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
                    <div
                      className="object-header"
                      onClick={() => {
                        if (item.geometry) return handleZoomToFeature(item);
                        else
                          return showErrorToast(
                            "there is no geometry for this table"
                          );
                      }}
                    >
                      <span>#{objectId}</span>
                      <span className="m_x_4 item_name">{assetgroup}</span>
                    </div>
                    <div className="header-action">
                      <img
                        src={file}
                        alt="properties"
                        className="cursor-pointer"
                        onClick={() => showProperties(item)}
                        title={t("Show Properties")}
                      />
                      <img
                        src={dot}
                        alt="menu"
                        className="cursor-pointer"
                        onClick={(event) => {
                          menuFeature.current.toggle(event);
                        }}
                      />
                      <MenuItems feature={item} menuFeature={menuFeature} />
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
