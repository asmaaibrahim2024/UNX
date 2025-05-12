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
  const utilityNetwork = useSelector(
    (state) => state.mapSettingReducer.utilityNetworkMapSetting
  );
  const handleValidateNetwork = async () => {

    
    await utilityNetwork.load();

    await utilityNetwork.validateTopology({ validateArea: view.extent });
  };
useEffect(()=>{
 if (!view || !utilityNetwork || !view.extent) return;

  const handleValidateNetwork = async () => {
    try {
      await utilityNetwork.load();
      await utilityNetwork.validateTopology({ validateArea: view.extent });
    } catch (error) {
      console.error("Error validating network topology:", error);
    }
  };

  handleValidateNetwork();
},[view,utilityNetwork])
  if (!isVisible) return null;

  return (
    <>
      <section className="validate-section"></section>
    </>
  );
}
