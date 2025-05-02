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

export default function Validate({ isVisible }) {
  const view = useSelector((state) => state.mapViewReducer.intialView);

  const handleValidateNetwork = async () => {
    const utilityNetwork = await createUtilityNetwork(
      window.mapConfig.portalUrls.utilityNetworkLayerUrl
    );
    await utilityNetwork.load();

    // await utilityNetwork.submitTopologyJob({ validateArea: view.extent });
    await utilityNetwork.validateTopology({ validateArea: view.extent });
  };

  if (!isVisible) return null;

  return (
    <>
      <section className="validate-section"></section>
    </>
  );
}
