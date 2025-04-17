import { React, useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createUtilityNetwork } from "../../../handlers/esriHandler";
import { createGraphic } from "../../../handlers/esriHandler";
import { loadModules } from "esri-loader";

import "./ConnectionExplorer.scss";

export default function ConnectionExplorer() {
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
        GraphicsLayer,
        Graphic,
      ] = await loadModules([
        "esri/rest/networks/support/SynthesizeAssociationGeometriesParameters",
        "esri/rest/networks/synthesizeAssociationGeometries",
        "esri/layers/GraphicsLayer",
        "esri/Graphic",
      ]);

      console.log(view.extent.toJSON());
      const associationParameters =
        new SynthesizeAssociationGeometriesParameters({
          extent: view.extent.toJSON(), // 💡 view.extent must be plain JSON
          //   returnAttachmentAssociations: true,
          returnConnectivityAssociations: true,
          //   returnContainmentAssociations: true,
          outSR: utilityNetwork.spatialReference,
          maxGeometryCount: 500,
        });

      console.log("UN Service URL:", utilityNetwork.networkServiceUrl);

      const result =
        await synthesizeAssociationGeometries.synthesizeAssociationGeometries(
          utilityNetwork.networkServiceUrl,
          associationParameters
        );

      console.log("Synthesized associations result:", result);
      console.log("Synthesized associations result:", result.associations);

      const associations = result.associations ?? [];
      alert(
        `Returned ${result.associations?.length ?? 0} association geometries`
      );
      // Create a graphics layer to hold the results
      const graphicsLayer = new GraphicsLayer();
      view.map.add(graphicsLayer);

      // Loop through returned associations and create graphics with the geometries
      // Association type decides what color the line symbol
      const associationGraphics = associations.map((association) => {
        return new Graphic({
          geometry: association.geometry,
          //   {
          //     type: "polyline",
          //     paths: association.geometry.paths,
          //     spatialReference: association.geometry.spatialReference,
          //   }
          symbol: {
            type: "simple-line", // autocasts as SimpleLineSymbol()
            style: "dot",
            color:
              //   association.associationType === "connectivity"
              //     ? [190, 41, 236]
              //     :
              [57, 255, 20], // Connectivity: Purple; Attachment: Green
            width: 4,
          },
        });
      });

      // Add the graphics to the view
      view.graphics.addMany(associationGraphics);
      // Loop and add each association as a graphic
      //   let c = 0;
      //   associations.forEach(async (assoc) => {
      //     const graphic = await createGraphic(
      //       assoc.geometry,
      //       {
      //         type: "simple-line",
      //         color: [255, 0, 0],
      //         width: 10,
      //       },
      //       assoc
      //     );
      //     console.log(graphic);
      //     graphicsLayer.add(graphic);

      //     if (c == 0) {
      //       view
      //         .goTo({
      //           target: assoc.geometry,
      //           zoom: 25, // For small point geometries
      //         })
      //         .catch(console.error);
      //       c += 1;
      //     }
      //   });
    } catch (err) {
      console.error("Error synthesizing associations:", err);
    }
  };

  return (
    <>
      <button onClick={handleQueryAssociations}>Load Associations</button>
    </>
  );
}
