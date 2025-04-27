import { React, useRef, useEffect, useState, useLayoutEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createUtilityNetwork } from "../../../handlers/esriHandler";
import { createGraphicFromFeature } from "../../../handlers/esriHandler";
import { loadModules } from "esri-loader";

import "./ConnectionExplorer.scss";

export default function ConnectionExplorer() {
  const view = useSelector((state) => state.mapViewReducer.intialView);
  const [associations, setAssociations] = useState([]);
  const [graphicsLayer, setGraphicsLayer] = useState(null);

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
  //   const utilityNetwork = await createUtilityNetwork(
  //     window.mapConfig.portalUrls.utilityNetworkLayerUrl
  //   );
  //   if (!view || !utilityNetwork) return;

  //   try {
  //     const [
  //       QueryAssociationsParameters,
  //       queryAssociations,
  //     ] = await loadModules(
  //       [
  //         "esri/rest/networks/support/QueryAssociationsParameters",
  //         "esri/rest/networks/queryAssociations",
  //       ],
  //       { css: true }
  //     );

  //     // Your target element
  //     const targetElement = {
  //       networkSourceId: 9,
  //       globalId: "{33489A0A-9288-4D53-87A2-659C5EA158E7}",
  //       objectId: null,
  //       terminalId: 41,
  //       assetGroupCode: null,
  //       assetTypeCode: null,
  //     };

  //     const queryAssociationsParameters = new QueryAssociationsParameters({
  //       associationTypes: ["junction-edge-from-connectivity"],
  //       elements: [targetElement],
  //     });

  //     const networkServiceUrl =
  //       "https://utilitykit.eastus.cloudapp.azure.com/server/rest/services/utility/utilityNetwork/UtilityNetworkServer";

  //     const result = await queryAssociations.queryAssociations(
  //       networkServiceUrl,
  //       queryAssociationsParameters
  //     );

  //     const associations = result.associations || [];

  //     console.log("Connected associations:", associations);

  //     setAssociations(associations)

  //   } catch (err) {
  //     console.error("Error loading connectivity:", err);
  //   }
  // };

  const [mainElement, setMainElement] = useState(null);
  const [connectedElements, setConnectedElements] = useState([]);
  const parentRef = useRef(null);
  const childRefs = useRef([]);
  const [lineCoords, setLineCoords] = useState([]);

  const handleQueryAssociations = async () => {
    // Dummy data simulating a network query
    const main = { name: "MV Fuse" };
    const connected = [
      { name: "MV Conductor" },
      { name: "MV Busbar" },
      { name: "MV Busbar2" },
    ];

    // Set state to trigger render
    setMainElement(main);
    setConnectedElements(connected);
  };

  useLayoutEffect(() => {
    if (!parentRef.current || childRefs.current.length === 0) return;

    const parentRect = parentRef.current.getBoundingClientRect();
    const coords = childRefs.current.map((child) => {
      const childRect = child.getBoundingClientRect();
      return {
        x1: parentRect.left + parentRect.width / 2,
        y1: parentRect.bottom,
        x2: childRect.left + childRect.width / 2,
        y2: childRect.top,
      };
    });

    setLineCoords(coords);
  }, [mainElement, connectedElements]);

  return (
    <>
      <button onClick={handleQueryAssociations}>Load Connectivity</button>

      <div className="connection-explorer">
        <h2>Connection Explorer</h2>
        <button onClick={handleQueryAssociations}>Load Connectivity</button>

        {mainElement && (
          <div className="connection-diagram">
            <div className="node main" ref={parentRef}>
              {mainElement.name}
            </div>

            <svg className="connector-svg">
              {lineCoords.map((line, i) => (
                <line
                  key={i}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="#99c"
                  strokeWidth="2"
                />
              ))}
            </svg>

            <div className="connected-row">
              {connectedElements.map((el, i) => (
                <div
                  className="node child"
                  key={i}
                  ref={(el) => (childRefs.current[i] = el)}
                >
                  {el.name}
                  <button className="plus-btn">+</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
