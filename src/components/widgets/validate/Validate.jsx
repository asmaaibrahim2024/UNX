import { React, useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createUtilityNetwork } from "../../../handlers/esriHandler";
import "./Validate.scss";

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
      <button onClick={handleValidateNetwork}>validate</button>
    </>
  );
}
