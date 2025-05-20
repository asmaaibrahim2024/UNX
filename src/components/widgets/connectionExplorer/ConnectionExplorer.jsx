import { React, useRef, useEffect, useState, useLayoutEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createUtilityNetwork } from "../../../handlers/esriHandler";
import { createGraphic } from "../../../handlers/esriHandler";
import { loadModules } from "esri-loader";

import "./ConnectionExplorer.scss";

export default function ConnectionExplorer() {
  const view = useSelector((state) => state.mapViewReducer.intialView);
  const [associations, setAssociations] = useState([]);
  const [graphicsLayer, setGraphicsLayer] = useState(null);

  const utilityNetwork = useSelector(
    (state) => state.mapSettingReducer.utilityNetworkMapSetting
  );
  const networkService = useSelector(
    (state) => state.mapSettingReducer.networkServiceConfig
  );

  // const handleQueryAssociations = async () => {
  //   const utilityNetwork = await createUtilityNetwork(
  //     window.mapConfig.portalUrls.utilityNetworkLayerUrl
  //   );
  //   if (!view || !utilityNetwork) return;

  //   try {
  //   //   const [
  //   //     SynthesizeAssociationGeometriesParameters,
  //   //     synthesizeAssociationGeometries,
  //   //     GraphicsLayer,
  //   //     Graphic,
  //   //   ] = await loadModules([
  //   //     "esri/rest/networks/support/SynthesizeAssociationGeometriesParameters",
  //   //     "esri/rest/networks/synthesizeAssociationGeometries",
  //   //     "esri/layers/GraphicsLayer",
  //   //     "esri/Graphic",
  //   //   ]);

  //   //   console.log(view.extent.toJSON());
  //   //   const associationParameters =
  //   //     new SynthesizeAssociationGeometriesParameters({
  //   //       extent: view.extent.toJSON(), // 💡 view.extent must be plain JSON
  //   //       //   returnAttachmentAssociations: true,
  //   //       returnConnectivityAssociations: true,
  //   //       //   returnContainmentAssociations: true,
  //   //       outSR: utilityNetwork.spatialReference,
  //   //       maxGeometryCount: 500,
  //   //     });

  //   //   console.log("UN Service URL:", utilityNetwork.networkServiceUrl);

  //   //   const result =
  //   //     await synthesizeAssociationGeometries.synthesizeAssociationGeometries(
  //   //       utilityNetwork.networkServiceUrl,
  //   //       associationParameters
  //   //     );

  //   //   console.log("Synthesized associations result:", result);
  //   //   console.log("Synthesized associations result:", result.associations);

  //   //   const associations = result.associations ?? [];
  //   //   alert(
  //   //     `Returned ${result.associations?.length ?? 0} association geometries`
  //   //   );
  //   //   // Create a graphics layer to hold the results
  //   //   const graphicsLayer = new GraphicsLayer();
  //   //   view.map.add(graphicsLayer);

  //   //   // Loop through returned associations and create graphics with the geometries
  //   //   // Association type decides what color the line symbol
  //   //   const associationGraphics = associations.map((association) => {
  //   //     return new Graphic({
  //   //       geometry: association.geometry,
  //   //       //   {
  //   //       //     type: "polyline",
  //   //       //     paths: association.geometry.paths,
  //   //       //     spatialReference: association.geometry.spatialReference,
  //   //       //   }
  //   //       symbol: {
  //   //         type: "simple-line", // autocasts as SimpleLineSymbol()
  //   //         style: "dot",
  //   //         color:
  //   //           //   association.associationType === "connectivity"
  //   //           //     ? [190, 41, 236]
  //   //           //     :
  //   //           [57, 255, 20], // Connectivity: Purple; Attachment: Green
  //   //         width: 4,
  //   //       },
  //   //     });
  //   //   });

  //   //   // Add the graphics to the view
  //   //   // view.graphics.addMany(associationGraphics);
  //   //   // Loop and add each association as a graphic
  //   //   let c = 0;
  //   //   associations.forEach(async (assoc) => {
  //   //     const graphic = await createGraphicFromFeature(
  //   //       assoc.geometry,
  //   //       {
  //   //         type: "simple-line",
  //   //         color: [255, 0, 0],
  //   //         width: 10,
  //   //       },
  //   //       assoc
  //   //     );
  //   //     // console.log(graphic);
  //   //     graphicsLayer.add(graphic);

  //   //     // if (c == 0) {
  //   //     //   view
  //   //     //     .goTo({
  //   //     //       target: assoc.geometry,
  //   //     //       zoom: 25, // For small point geometries
  //   //     //     })
  //   //     //     .catch(console.error);
  //   //     //   c += 1;
  //   //     // }
  //   //   });

  //     const [QueryAssociationsParameters, queryAssociations] =
  //       await loadModules(
  //         [
  //           "esri/rest/networks/support/QueryAssociationsParameters",
  //           "esri/rest/networks/queryAssociations",
  //         ],
  //         { css: true }
  //       );

  //     const queryAssociationsParameters = new QueryAssociationsParameters({
  //       associationTypes: ["junction-edge-from-connectivity"],
  //       elements: [
  //         {
  //           networkSourceId: 9,
  //           globalId: "{33489A0A-9288-4D53-87A2-659C5EA158E7}",
  //           objectId: null,
  //           terminalId: 41,
  //           assetGroupCode: null,
  //           assetTypeCode: null,
  //         },
  //       ],
  //     });

  //     const networkServiceUrl =
  //       "https://utilitykit.eastus.cloudapp.azure.com/server/rest/services/utility/utilityNetwork/UtilityNetworkServer";

  //     // Query associations, and assign the query result to a variable of type QueryAssociationsResult
  //     const queryAssociationsResult = await queryAssociations.queryAssociations(
  //       networkServiceUrl,
  //       queryAssociationsParameters
  //     );

  //     // Print out the first association
  //     console.log(queryAssociationsResult.associations);
  //   } catch (err) {
  //     console.error("Error synthesizing associations:", err);
  //   }
  // };

  // const handleQueryAssociations = async () => {
  //   console.log("the handle query associations is triggered");
  //   console.log(utilityNetwork);
  //   try {
  //     const [QueryAssociationsParameters, queryAssociations] =
  //       await loadModules(
  //         [
  //           "esri/rest/networks/support/QueryAssociationsParameters",
  //           "esri/rest/networks/queryAssociations",
  //         ],
  //         { css: true }
  //       );

  //     // Your target element
  //     const targetElement = {
  //       // networkSourceId: 9,
  //       // globalId: "{33489A0A-9288-4D53-87A2-659C5EA158E7}",
  //       // objectId: null,
  //       // terminalId: 41,
  //       // assetGroupCode: null,
  //       // assetTypeCode: null,
  //       globalId: "{9B02FE67-2F58-40D0-B311-40DD42C33A8D}",
  //       objectId: 17729,
  //       networkSourceId: 10,
  //     };

  //     const queryAssociationsParameters = new QueryAssociationsParameters({
  //       associationTypes: ["junction-junction-connectivity"],
  //       elements: [targetElement],
  //     });
  //     const networkServiceUrl = utilityNetwork.networkServiceUrl;

  //     const result = await queryAssociations.queryAssociations(
  //       networkServiceUrl,
  //       queryAssociationsParameters
  //     );

  //     const associations = result.associations || [];

  //     console.log("Connected associations:", associations);

  //     setAssociations(associations);
  //   } catch (err) {
  //     console.error("Error loading connectivity:", err);
  //   }
  // };

  // const handleQueryAssociations = async () => {
  //   const associations = await utilityNetwork.queryAssociations({
  //     elements: [
  //       {
  //         globalId: "{9B02FE67-2F58-40D0-B311-40DD42C33A8D}",
  //         objectId: 17729,
  //         networkSourceId: 10,
  //         terminalId: 1,
  //         assetGroupCode: 2,
  //         assetTypeCode: 11,
  //       },
  //     ],
  //     associationTypes: [
  //       "containment",
  //       "attachment",
  //       "junction-edge-from-connectivity",
  //     ],
  //   });

  //   console.log(associations);
  // };

  const handleQueryAssociations = async () => {
    try {
      const [
        SynthesizeAssociationGeometriesParameters,
        synthesizeAssociationGeometries,
      ] = await loadModules([
        "esri/rest/networks/support/SynthesizeAssociationGeometriesParameters",
        "esri/rest/networks/synthesizeAssociationGeometries",
      ]);

      console.log(view.extent.toJSON());
      const associationParameters =
        new SynthesizeAssociationGeometriesParameters({
          extent: view.extent.toJSON(), // 💡 view.extent must be plain JSON
          //   returnAttachmentAssociations: true,
          returnConnectivityAssociations: true,
          //   returnContainerAssociations: true,
          // returnContainmentAssociations: true,
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
      alert(
        `Returned ${result.associations?.length ?? 0} association geometries`
      );
    } catch (err) {
      console.error("Error synthesizing associations:", err);
    }
  };

  return (
    <div
      onClick={handleQueryAssociations}
      style={{
        cursor: "pointer",
        padding: "10px",
        background: "#ddd",
        display: "inline-block",
      }}
    >
      test
    </div>
  );
}
