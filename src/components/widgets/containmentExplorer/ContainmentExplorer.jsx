import { React, useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createUtilityNetwork } from "../../../handlers/esriHandler";
import { loadModules } from "esri-loader";

import "./ContainmentExplorer.scss";

export default function ContainmentExplorer() {
  const view = useSelector((state) => state.mapViewReducer.intialView);

  const handleQueryAssociations = async () => {
    const utilityNetwork = await createUtilityNetwork(
      window.mapConfig.portalUrls.utilityNetworkLayerUrl
    );
    if (!view || !utilityNetwork) return;

    try {
      const [
        SynthesizeAssociationGeometriesParameters,
        synthesizeAssociationGeometries,
      ] = await loadModules([
        "esri/rest/networks/support/SynthesizeAssociationGeometriesParameters",
        "esri/rest/networks/synthesizeAssociationGeometries",
      ]);

      // console.log(view.extent.toJSON());
      const associationParameters =
        new SynthesizeAssociationGeometriesParameters({
          extent: view.extent.toJSON(), // 💡 view.extent must be plain JSON
          //   returnAttachmentAssociations: true,
          //   returnConnectivityAssociations: true,
          //   returnContainerAssociations: true,
          returnContainmentAssociations: true,
          outSR: utilityNetwork.spatialReference,
          maxGeometryCount: 500,
        });

      // console.log("UN Service URL:", utilityNetwork.networkServiceUrl);

      const result =
        await synthesizeAssociationGeometries.synthesizeAssociationGeometries(
          utilityNetwork.networkServiceUrl,
          associationParameters
        );

      // console.log("Synthesized associations result:", result);
      // console.log("Synthesized associations result:", result.associations);
      alert(
        `Returned ${result.associations?.length ?? 0} association geometries`
      );
    } catch (err) {
      console.error("Error synthesizing associations:", err);
    }
  };

  //To access the config
  // console.log(window.containmentExplorerConfig);
  return (
    <>
      <button onClick={handleQueryAssociations}>Load Associations</button>
    </>
  );
}
