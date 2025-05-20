import { useTranslation } from "react-i18next";
import {
  addOrRemoveBarrierPoint,
  addOrRemoveFeatureFromSelection,
  addOrRemoveTraceStartPoint,
  getAttributeCaseInsensitive,
  getSelectedFeaturesForLayer,
  isBarrierPoint,
  isFeatureAlreadySelected,
  isStartingPoint,
  ZoomToFeature,
} from "../../../handlers/esriHandler";
import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SelectedTracePoint } from "../../widgets/trace/models";
import { removeTracePoint } from "../../../redux/widgets/trace/traceAction";
import {
  addPointToTrace,
  getSelectedPointTerminalId,
} from "../../widgets/trace/traceHandler";
import {
  setConnectionParentFeature,
  setConnectionVisiblity,
} from "../../../redux/commonComponents/showConnection/showConnectionAction";
import { setShowPropertiesFeature } from "../../../redux/commonComponents/showProperties/showPropertiesAction";
import { setContainmentVisiblity } from "../../../redux/commonComponents/showContainment/showContainmentAction";
import { setSelectedFeatures } from "../../../redux/widgets/selection/selectionAction";
import store from "../../../redux/store";
import {
  setAttachmentParentFeature,
  setAttachmentVisiblity,
} from "../../../redux/commonComponents/showAttachment/showAttachmentAction";
import { Menu } from "primereact/menu";

//menu
import file from "../../../style/images/document-text.svg";
import attachment from "../../../style/images/menu_attachment.svg";
import barrier from "../../../style/images/barrier.svg";
import connection from "../../../style/images/connection.svg";
import deselect from "../../../style/images/deselect.svg";
import select from "../../../style/images/select.svg";
import edit from "../../../style/images/edit.svg";
import flag from "../../../style/images/flag.svg";
import zoom from "../../../style/images/menu_zoom.svg";
import containment from "../../../style/images/containment.svg";
//

const MenuItems = ({ feature, menuFeature }) => {
  const { t, i18n } = useTranslation("menuItems");
  const { t: tTrace, i18n: i18nTrace } = useTranslation("Trace");

  const objectId = getAttributeCaseInsensitive(feature.attributes, "objectid");

  const [startingPointsGlobalIds, setStartingPointsGlobalIds] = useState([]);
  const [barrierPointsGlobalIds, setBarrierPointsGlobalIds] = useState([]);

  const currentSelectedFeatures = useSelector(
    (state) => state.selectionReducer.selectedFeatures
  );
  const selectedPoints = useSelector(
    (state) => state.traceReducer.selectedPoints
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
  const traceGraphicsLayer = useSelector(
    (state) => state.traceReducer.traceGraphicsLayer
  );
  const view = useSelector((state) => state.mapViewReducer.intialView);

  const showPropertiesFeature = useSelector(
    (state) => state.showPropertiesReducer.showPropertiesFeature
  );

  const isConnectionVisible = useSelector(
    (state) => state.showConnectionReducer.isConnectionVisible
  );

  const isContainmentVisible = useSelector(
    (state) => state.showContainmentReducer.isContainmentVisible
  );
  const showAttachmentFeature = useSelector(
    (state) => state.showAttachmentReducer.parentFeature
  );

  const dispatch = useDispatch();

  const menuZoom = () => {
    return (
      <>
        <div
          className="d-flex align-items-center cursor-pointer"
          onClick={() => handleZoomToFeature(objectId)}
        >
          <img src={zoom} alt="zoom" height="18" />
          <span className="m_l_8">{t("Zoom to")}</span>
        </div>
      </>
    );
  };
  const menuProperties = () => {
    return (
      <>
        <div
          className="d-flex align-items-center cursor-pointer"
          onClick={() => showProperties(objectId)}
        >
          <img src={file} alt="Show Properties" height="18" />
          <span className="m_l_8">{t("Show Properties")}</span>
        </div>
      </>
    );
  };
  const menuEdit = () => {
    return (
      <>
        <div className="d-flex align-items-center cursor-pointer">
          <img src={edit} alt="edit" height="18" />
          <span className="m_l_8">{t("Edit")}</span>
        </div>
      </>
    );
  };
  const menuConnection = () => {
    return (
      <>
        <div
          className="d-flex align-items-center cursor-pointer"
          onClick={() => showConnection()}
        >
          <img src={connection} alt="connection" height="18" />
          <span className="m_l_8">{t("Connection")}</span>
        </div>
      </>
    );
  };

  const menuContainment = () => {
    return (
      <>
        <div
          className="d-flex align-items-center cursor-pointer"
          onClick={() => {
            dispatch(setContainmentVisiblity(!isContainmentVisible));
          }}
        >
          <img src={containment} alt="containment" height="18" />
          <span className="m_l_8">{t("containment")}</span>
        </div>
      </>
    );
  };

  const menuAttachment = () => {
    return (
      <>
        <div
          className="d-flex align-items-center cursor-pointer"
          onClick={() => {
            showAttachment();
          }}
        >
          <img src={attachment} alt="attachment" height="18" />
          <span className="m_l_8">{t("attachment")}</span>
        </div>
      </>
    );
  };
  const menuUnselect = () => {
    return (
      <>
        <div
          className="d-flex align-items-center cursor-pointer"
          onClick={() => handleselectFeature(objectId)}
        >
          {isFeatureAlreadySelected(
            getSelectedFeaturesForLayer(currentSelectedFeatures, feature),
            feature
          ) ? (
            <>
              <img src={deselect} alt="Deselect" height="18" />
              <span className="m_l_8">{t("Deselect")}</span>
            </>
          ) : (
            <>
              <img src={select} alt="Select" height="18" />
              <span className="m_l_8">{t("Select")}</span>
            </>
          )}
        </div>
      </>
    );
  };
  const menuTraceStartPoint = () => {
    return (
      <>
        <div
          className="d-flex align-items-center cursor-pointer"
          onClick={() => handleTraceStartPoint(objectId)}
        >
          <img src={flag} alt="zoom" height="18" />
          <span className="m_l_8">
            {isStartingPoint(
              getAttributeCaseInsensitive(feature.attributes, "globalid"),
              selectedPoints
            )
              ? t("Remove trace start point")
              : t("Add as a trace start point")}
          </span>
        </div>
      </>
    );
  };
  const menuBarrierPoint = () => {
    return (
      <>
        <div
          className="d-flex align-items-center cursor-pointer"
          onClick={() => handleBarrierPoint(objectId)}
        >
          <img src={barrier} alt="zoom" height="18" />
          <span className="m_l_8">
            {isBarrierPoint(
              getAttributeCaseInsensitive(feature.attributes, "globalid"),
              selectedPoints
            )
              ? t("Remove barrier point")
              : t("Add as a barrier point")}
          </span>
        </div>
      </>
    );
  };
  //////
  const handleZoomToFeature = async (objectId) => {
    if (!objectId || !view) return;

    const matchingFeature = feature;
    ZoomToFeature(matchingFeature, view);
  };

  const showProperties = () => {
    const matchingFeature = feature;

    if (matchingFeature) {
      if (
        showPropertiesFeature &&
        getAttributeCaseInsensitive(matchingFeature.attributes, "objectid") ==
          getAttributeCaseInsensitive(
            showPropertiesFeature.attributes,
            "objectid"
          )
      ) {
        dispatch(setShowPropertiesFeature(null));
        return;
      }

      dispatch(setShowPropertiesFeature(matchingFeature));
    }
  };

  const showAttachment = async () => {
    if (showAttachmentFeature === null)
      dispatch(setAttachmentParentFeature(feature));
    else if (
      getAttributeCaseInsensitive(feature.attributes, "objectid") ===
        getAttributeCaseInsensitive(
          showAttachmentFeature.attributes,
          "objectid"
        ) &&
      feature.layer.layerId === showAttachmentFeature.layer.layerId
    )
      dispatch(setAttachmentParentFeature(null));
    else dispatch(setAttachmentParentFeature(feature));
  };

  const handleselectFeature = async (objectId) => {
    const matchingFeature = feature;
    if (!matchingFeature) return;

    await addOrRemoveFeatureFromSelection(
      objectId,
      matchingFeature,
      currentSelectedFeatures,
      feature.layer.title,
      dispatch,
      setSelectedFeatures,
      view,
      () => store.getState().selectionReducer.selectedFeatures
    );
  };

  const handleTraceStartPoint = () => {
    const matchingFeature = feature;

    addOrRemoveTraceStartPoint(
      matchingFeature,
      SelectedTracePoint,
      traceGraphicsLayer,
      dispatch,
      removeTracePoint,
      getSelectedPointTerminalId,
      addPointToTrace,
      utilityNetwork,
      selectedPoints,
      tTrace
    );
  };

  const handleBarrierPoint = () => {
    const matchingFeature = feature;

    addOrRemoveBarrierPoint(
      matchingFeature,
      SelectedTracePoint,
      traceGraphicsLayer,
      dispatch,
      removeTracePoint,
      getSelectedPointTerminalId,
      addPointToTrace,
      utilityNetwork,
      selectedPoints,
      tTrace
    );
  };

  const showConnection = async () => {
    dispatch(setConnectionParentFeature(feature));

    dispatch(setConnectionVisiblity(!isConnectionVisible));
  };

  const menuItems = [
    {
      template: menuZoom,
    },
    {
      template: menuProperties,
    },
    // {
    //   template: menuEdit,
    // },
    {
      template: menuConnection,
    },
    {
      template: menuContainment,
    },
    {
      template: menuAttachment,
    },
    {
      template: menuUnselect,
      className: "item_unselect",
    },
    {
      label: t("Add"),
      items: [
        {
          template: menuTraceStartPoint,
        },
        {
          template: menuBarrierPoint,
        },
      ],
    },
  ];

  return (
    <Menu
      model={menuItems}
      popup
      ref={menuFeature}
      popupAlignment="left"
      className="feature_menu"
    />
  );
};

export default MenuItems;
