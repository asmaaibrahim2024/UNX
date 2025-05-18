import { React, useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createUtilityNetwork } from "../../../handlers/esriHandler";
import "./Validate.scss";
import chevronleft from "../../../style/images/chevron-left.svg";
import close from "../../../style/images/x-close.svg";
import folder from "../../../style/images/folder.svg";
import arrowup from "../../../style/images/cheveron-up.svg";
import arrowdown from "../../../style/images/cheveron-down.svg";
import file from "../../../style/images/document-text.svg";
import reset from "../../../style/images/refresh.svg";
import play from "../../../style/images/play.svg";
import { useI18n } from "../../../handlers/languageHandler";
import { setActiveButton } from "../../../redux/sidebar/sidebarAction";
import {queryFeatureLayer ,flashHighlightFeature} from '../../../handlers/esriHandler';

export default function Validate({ isVisible }) {
  const { t, direction, dirClass, i18nInstance } = useI18n("Validate");
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [validateResult, setValidateResult] = useState(false);
 const [errors,setErrors]=useState(null)
  const view = useSelector((state) => state.mapViewReducer.intialView);
  const utilityNetwork = useSelector(
    (state) => state.mapSettingReducer.utilityNetworkMapSetting
  );

  // useEffect(() => {
  //   if (!view || !utilityNetwork || !view.extent) return;

  //   const handleValidateNetwork = async () => {
  //     try {
  //       await utilityNetwork.load();
  //       console.log(view.extent, utilityNetwork,"MAaaaaaaaaaaaaaar");
  //     const res=  await queryFeatureLayer(utilityNetwork.networkSystemLayers.dirtyAreasLayerUrl);
  //             console.log(res,"MAaaaaaaaaaaaaaar");
  //     res&&setLoading(false);
  //     res&&setValidateResult(true);
  //     setErrors(res)
  //       await utilityNetwork.validateTopology({ validateArea: view.extent });
  //     } catch (error) {
  //       console.error("Error validating network topology:", error);
  //     }
  //   };

  //   handleValidateNetwork();
  // }, [view, utilityNetwork]);

  var static_messages = [
  "0: The field has an invalid data type.",
  "1: The geometry for the network feature is empty.",
  "2: Subtype is unknown.",
  "5: Line feature has length within tolerance.",
  "6: Geometry error—Could not locate the vertex along the line feature.",
  "8: Missing rule—Connectivity exists between two features without a rule that permits the connectivity.",
  "9: Ambiguous connectivity—Multiple rules available for a potential connection.",
  "10: Missing junction—Invalid connectivity between different asset types without an intermediate device or junction.",
  "13: Edge connectivity policy violation—A line has a connection that violates its edge-connectivity policy.",
  "19: Invalid multipoint geometry—A linear network feature has multipart geometry, which is not supported.",
  "20: Self-intersecting line—The geometry of a line intersects itself.",
  "21: Duplicate vertices—A line has two or more duplicate vertices, or vertices within the tolerance of one another.",
  "23: Invalid line—The line feature is not valid for the tier's valid lines.",
  "25: Stacked points—Two or more junctions or devices occupy the same x,y,z location.",
  "26: Invalid device—The device feature is not valid for the tier's valid devices.",
  "27: Invalid junction—The junction feature is not valid for the tier's valid junctions.",
  "28: Disjoint subnetwork—A subnetwork controller is not connected to the rest of the subnetwork.",
  "29: Invalid subnetwork controller—The subnetwork controller is not valid for the tier's valid subnetwork controllers.",
  "30: Invalid subnetwork—The subnetwork is not valid due to inconsistent subnetwork name or other issues.",
  "31: Invalid subnetwork name—The subnetwork name is invalid or inconsistent.",
  "32: Invalid subnetwork definition—The subnetwork definition is invalid or inconsistent.",
  "33: Invalid subnetwork controller type—The subnetwork controller type is invalid for the tier.",
  "34: Invalid subnetwork controller—The subnetwork controller is invalid for the tier.",
  "35: Invalid subnetwork controller—The subnetwork controller is invalid for the tier.",
  "36: Invalid terminal—The From terminal ID or To terminal ID field of a line is not valid for one of the devices or junctions it is connected to.",
  "37: Subnetwork tap—A feature with the subnetwork tap category is drawn at the end point of two lines.",
  "38: Midspan terminal device—A device with multiple terminals is drawn midspan on a line.",
  "39: Invalid edge object—The edge object is not valid for the tier's valid edge objects.",
  "40: Invalid junction object—The junction object is not valid for the tier's valid junction objects.",
  "41: Invalid junction object—The junction object is not valid for the tier's valid junction objects.",
  "42: Invalid edge object—The edge object is not valid for the tier's valid edge objects.",
  "43: Invalid container—The container feature is not valid for the tier's valid containers.",
  "44: Invalid structure line—The structure line is not valid for the tier's valid structure lines.",
  "45: Invalid structure junction—The structure junction is not valid for the tier's valid structure junctions.",
  "46: Invalid structure edge—The structure edge is not valid for the tier's valid structure edges."
];

  const closeSubSidebarPanel = () => {
    dispatch(setActiveButton(null));
    
  };

  const startvalidation = async() => {
    setLoading(true);
      if (!view || !utilityNetwork || !view.extent) return;
try {
        await utilityNetwork.load();
        console.log(view.extent, utilityNetwork,"MAaaaaaaaaaaaaaar");
      const res=  await queryFeatureLayer(utilityNetwork.networkSystemLayers.dirtyAreasLayerUrl);
              console.log(res,"MAaaaaaaaaaaaaaar");
      res&&setLoading(false);
      res&&setValidateResult(true);
      setErrors(res)
        await utilityNetwork.validateTopology({ validateArea: view.extent });
      } catch (error) {
        console.error("Error validating network topology:", error);
      }
  };

// const getErrorDescriptions = (message) => {
//   const codes = [...new Set(  // use Set to avoid duplicates
//     message
//       .split(";")
//       .map(part => part.split(",")[0]) // get the first number from each part
//       .filter(Boolean)
//   )];

//   return codes.map(code => {
//     const msg = static_messages.find(m => m.startsWith(code + ":"));
//     return msg || `Unknown error code: ${code}`;
//   });
// };
const getErrorDescriptions = (message) => {
  const codes = [...new Set(
    message
      .split(";")
      .map(part => part.split(",")[0]) // extract error code before comma
      .filter(Boolean)
  )];

  return codes.map(code => {
    const msg = static_messages.find(m => m.startsWith(code + ":"));
    return msg || `Unknown error code: ${code}`;
  });
};
  if (!isVisible) return null;

  return (
    <>
      <div className="subSidebar-widgets-container validate-container">
        <div className="subSidebar-widgets-header">
          <div className="container-title">{t("validate")}</div>
          <img
            src={close}
            alt="close"
            className="cursor-pointer"
            onClick={closeSubSidebarPanel}
          />
        </div>

        <main className="subSidebar-widgets-body">
          <div className="h-100 d-flex flex-column p_x_8 p_y_8">
            {!loading && (
              <button
                className="btn_primary flex-shrink-0"
                onClick={startvalidation}
              >
                <img src={play} alt="play" />
                <span>{t("start validation")}</span>
              </button>
            )}
            {loading && (
              <div className="validate_loading">
                <div className="apploader_container">
                  <span className="apploader"></span>
                </div>
                <p className="m_0 validate_txt">
                  <span className="m_r_4">{t("in progress")}</span>
                  <span>(</span>
                  <span>60%</span>
                  <span>)</span>
                </p>
              </div>
            )}
            {!loading && validateResult && (
              <div className="flex-fill d-flex flex-column p_t_16 overflow-auto">
                <ul className="validate_result_list flex-fill overflow-auto p_x_4">
{errors.length === 0 ? (
  <div className="no-errors-message p_x_4 p_y_4 text-center text-muted">
    {t("No dirty areas found")}
  </div>
) : (
  <ul className="validate_result_list flex-fill overflow-auto p_x_4">
    {(() => {
      let globalIndex = 1;
      return errors.flatMap((item, index) => {
        const errorDescriptions = getErrorDescriptions(item.attributes.ERRORMESSAGE);
        return errorDescriptions.map((desc) => {
          const cleanedDescription = desc.replace(/^\d+:\s*/, '');

          const handleClick = () => {
        const extent = item.geometry.extent;
        if (extent && view) {
          view.goTo(extent).catch((error) => {
            console.error("Failed to zoom to extent:", error);
          });
        } else {
          console.warn("No extent found on item");
        }
       flashHighlightFeature(item,true,view,500)
      };

          return (
            <li key={`${index}-${globalIndex}`} onClick={handleClick} style={{ cursor: 'pointer' }}>
              <span className="title">{`Error${globalIndex++}`}</span>
              <span className="description">{cleanedDescription}</span>
            </li>
          );
        });
      });
    })()}
  </ul>
)}


</ul>
                <p className="m_0 totalResult flex-shrink-0">
                  <span className="m_r_4">{t("total errors")}</span>
                   <span>(</span>
      <span>
        {
          errors.reduce((acc, item) => {
            const descriptions = getErrorDescriptions(item.attributes.ERRORMESSAGE);
            return acc + descriptions.length;
          }, 0)
        }
      </span>
      <span>)</span>
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
