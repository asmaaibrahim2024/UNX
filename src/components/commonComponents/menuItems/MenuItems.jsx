import { useTranslation } from "react-i18next";
import {
  addOrRemoveBarrierPoint,
  addOrRemoveFeatureFromSelection,
  addOrRemoveTraceStartPoint,
  getAssociationStatusValue,
  getAttributeCaseInsensitive,
  getDomainValues,
  getSelectedFeaturesForLayer,
  isBarrierPoint,
  isFeatureAlreadySelected,
  isStartingPoint,
  showContainment,
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
import {
  setContainmentParentFeature,
  setContainmentVisiblity,
} from "../../../redux/commonComponents/showContainment/showContainmentAction";
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
import { setZIndexPanel } from "../../../redux/ui/uiAction";
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
  const showContainmentFeature = useSelector(
    (state) => state.showContainmentReducer.parentFeature
  );

  const dispatch = useDispatch();

  const associationStatusValue = getAssociationStatusValue(
    utilityNetwork,
    feature
  );

  const associationStatusValueLowertCase = associationStatusValue.toLowerCase();

  const menuZoom = () => {
    if (feature.geometry)
      return (
        <>
          <div
            className="d-flex align-items-center cursor-pointer"
            onClick={(event) => {
              handleZoomToFeature();
              closeMenu(event);
            }}
          >
            <img src={zoom} alt="zoom" height="18" />
            <span className="m_l_8">{t("Zoom to")}</span>
          </div>
        </>
      );
    else
      return (
        <>
          <div className="d-none align-items-center text-muted">
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
          className={`d-flex align-items-center cursor-pointer ${
            showPropertiesFeature && "opened"
          }`}
          onClick={(event) => {
            showProperties();
            closeMenu(event);
          }}
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
    if (associationStatusValueLowertCase.includes("connectivity"))
      return (
        <>
          <div
            className="d-flex align-items-center cursor-pointer"
            onClick={(event) => {
              showConnection();
              closeMenu(event);
            }}
          >
            <img src={connection} alt="connection" height="18" />
            <span className="m_l_8">{t("Connection")}</span>
          </div>
        </>
      );
    else
      return (
        <>
          <div className="d-none align-items-center text-muted">
            <img src={connection} alt="connection" height="18" />
            <span className="m_l_8">{t("Connection")}</span>
          </div>
        </>
      );
  };

  const menuContainment = () => {
    if (
      associationStatusValueLowertCase.includes("containment") ||
      associationStatusValueLowertCase.includes("container")
    )
      return (
        <>
          <div
            className={`d-flex align-items-center cursor-pointer ${
              showContainmentFeature && "opened"
            }`}
            onClick={(event) => {
              showContainment(
                feature,
                showContainmentFeature,
                setContainmentParentFeature,
                dispatch
              );
              closeMenu(event);
              //   dispatch(setContainmentVisiblity(!isContainmentVisible));
            }}
          >
            <img src={containment} alt="containment" height="18" />
            <span className="m_l_8">{t("containment")}</span>
          </div>
        </>
      );
    else
      return (
        <>
          <div className="d-none align-items-center text-muted">
            <img src={containment} alt="containment" height="18" />
            <span className="m_l_8">{t("containment")}</span>
          </div>
        </>
      );
  };

  const menuAttachment = () => {
    if (
      associationStatusValueLowertCase.includes("attachment") ||
      associationStatusValueLowertCase.includes("structure")
    )
      return (
        <>
          <div
            className="d-flex align-items-center cursor-pointer"
            onClick={(event) => {
              showAttachment();
              dispatch(setZIndexPanel("ShowAttachment"));
              closeMenu(event);
            }}
          >
            <img src={attachment} alt="attachment" height="18" />
            <span className="m_l_8">{t("attachment")}</span>
          </div>
        </>
      );
    else
      return (
        <>
          <div className="d-none align-items-center text-muted ">
            <img src={attachment} alt="attachment" height="18" />
            <span className="m_l_8">{t("attachment")}</span>
          </div>
        </>
      );
  };

  const menuUnselect = () => {
    if (feature.geometry)
      return (
        <>
          <div
            className="d-flex align-items-center cursor-pointer"
            onClick={(event) => {
              handleselectFeature();
              closeMenu(event);
            }}
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
    else
      return (
        <>
          <div className="d-none align-items-center text-muted">
            <img src={select} alt="Select" height="18" />
            <span className="m_l_8">{t("Select")}</span>
          </div>
        </>
      );
  };

  const menuTraceStartPoint = () => {
    if (feature.geometry)
      return (
        <>
          <div
            className="d-flex align-items-center cursor-pointer"
            onClick={(event) => {
              handleTraceStartPoint();
              closeMenu(event);
            }}
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
    else
      return (
        <>
          <div className="d-none align-items-center text-muted">
            <img src={flag} alt="zoom" height="18" />
            <span className="m_l_8">{t("Add as a trace start point")}</span>
          </div>
        </>
      );
  };
  const menuBarrierPoint = () => {
    if (feature.geometry)
      return (
        <>
          <div
            className="d-flex align-items-center cursor-pointer"
            onClick={(event) => {
              handleBarrierPoint();
              closeMenu(event);
            }}
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
    else
      return (
        <>
          <div className="d-none align-items-center text-muted">
            <img src={barrier} alt="zoom" height="18" />
            <span className="m_l_8">{t("Add as a barrier point")}</span>
          </div>
        </>
      );
  };
  //////
  const handleZoomToFeature = async () => {
    if (!objectId || !view) return;

    const matchingFeature = feature;
    ZoomToFeature(matchingFeature, view);
  };

  const showProperties = (event) => {
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
        //ui commented by ui to only open right panel not toggle it
        //dispatch(setShowPropertiesFeature(null));
        //return;
      }

      dispatch(setShowPropertiesFeature(matchingFeature));
      dispatch(setZIndexPanel("ShowProperties"));
    }
  };

  const showAttachment = async (event) => {
    if (showAttachmentFeature === null)
      dispatch(setAttachmentParentFeature(feature));
    //ui commented by ui to only open right panel not toggle it
    // else if (
    //   getAttributeCaseInsensitive(feature.attributes, "objectid") ===
    //     getAttributeCaseInsensitive(
    //       showAttachmentFeature.attributes,
    //       "objectid"
    //     ) &&
    //   feature.layer.layerId === showAttachmentFeature.layer.layerId
    // )
    //   dispatch(setAttachmentParentFeature(null));
    else dispatch(setAttachmentParentFeature(feature));
  };

  const handleselectFeature = async () => {
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

    //ui commented by ui to only open right panel not toggle it
    ////////// dispatch(setConnectionVisiblity(!isConnectionVisible));
    dispatch(setConnectionVisiblity(true));
  };

  //commented by dev i need to use the menuFeature passed in the parameter in order to toggle
  // the menu when i opens for the first time you can see it at ShowContainment and ShowAttachment
  // const menuFeatureRef = useRef(null);
  // Function to close the menu
  const closeMenu = (event) => {
    if (menuFeature.current) {
      menuFeature.current.hide(event);
    }
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
      className: !feature.geometry && "d-none",
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
