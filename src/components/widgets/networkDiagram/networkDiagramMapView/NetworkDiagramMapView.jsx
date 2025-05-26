import { React, useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import "./NetworkDiagramMapView.scss";
import * as go from "gojs";

import {setDiagramLoader } from "../../../../redux/widgets/networkDiagram/networkDiagramAction";


export default function NetworkDiagramMapView() {
  const diagramRef = useRef(null);
  const diagramInstance = useRef(null);
  const dispatch = useDispatch();

  // Get the model from Redux
  const diagramModelData = useSelector(
    (state) => state.networkDiagramReducer.diagramModelData
  );
  const isDiagramLoading = useSelector(
    (state) => state.networkDiagramReducer.isDiagramLoadingIntial
  );
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
debugger
    if (!diagramRef.current || diagramInstance.current) return;
    const $ = go.GraphObject.make;

    const diagram = $(go.Diagram, diagramRef.current, {
      initialAutoScale: go.Diagram.Uniform,
       layout: $(go.TreeLayout, {
        angle: 90,
        layerSpacing: 40,
        nodeSpacing: 20,
        alignment: go.TreeLayout.AlignmentCenterChildren,
        setsPortSpot: false,
        setsChildPortSpot: false,
      }),
      "undoManager.isEnabled": false,
    });

    diagram.nodeTemplateMap.add(
      "container",
      $(go.Node, "Auto",
        $(go.Shape, "Rectangle", {
          fill: "#e0f7fa",
          stroke: "#006064",
          strokeWidth: 2,
          width: 100,
          height: 40,
        }),
        $(go.TextBlock, {
          margin: 8,
          font: "bold 12px sans-serif",
          wrap: go.TextBlock.WrapFit,
          textAlign: "center",
        }, new go.Binding("text", "label"))
      )
    );

    diagram.nodeTemplateMap.add(
      "junction",
      $(go.Node, "Auto",
        $(go.Shape, "Ellipse", {
         fill: "#FAB38D", stroke: "#110e25",
          strokeWidth: 1,
          width: 15,
          height: 15,
        }),
        $(go.TextBlock, {
          margin: 4,
          font: "10px sans-serif",
          textAlign: "center",
        })
      )
    );

    diagram.nodeTemplate = $(go.Node, "Auto",
      $(go.Shape, "RoundedRectangle", {
        fill: "#c8e6c9",
        stroke: "#2e7d32",
        strokeWidth: 2,
      }),
      $(go.TextBlock, {
        margin: 8,
        font: "bold 11px sans-serif",
        wrap: go.TextBlock.WrapFit,
      }, new go.Binding("text", "label"))
    );

    diagram.linkTemplate =   $(go.Link,
        {
          routing: go.Link.AvoidsNodes,
          curve: go.Link.JumpOver,
          corner: 10
        },
      $(go.Shape, {
    strokeWidth: 1,
    stroke: "#110e25",
    strokeDashArray: [6, 4]
  }),
      $(go.Shape, {
        toArrow: "Standard",
        stroke: "#110e25",
        fill: "#110e25", scale: 0.6
      }),
      $(go.TextBlock, {
        segmentOffset: new go.Point(0, -10),
        font: "10px sans-serif",
        stroke: "#333",
      }, new go.Binding("text", "text"))
    );

    diagramInstance.current = diagram;
  }, []);

  // Load diagram model when it changes in Redux
  useEffect(() => {   
    console.log(diagramModelData,"diagramModelData");

    debugger
    // setLoading(true); // Start loader
    if(!diagramModelData) return  

      try {
        const model = go.Model.fromJson(diagramModelData);
                dispatch(setDiagramLoader(false))

        diagramInstance.current.model = model;

         // Add a small delay to ensure diagram is rendered before hiding loader
        // setTimeout(() => {
        //   setLoading(false);
        // }, 200);
      } catch (err) {
        console.error("Invalid diagram model JSON:", err);
      }
  }, [diagramModelData]);
  useEffect(()=>{
    console.log(isDiagramLoading,"isDiagramLoading");
    
  },[isDiagramLoading])
  return (
    <div className="map_view d-flex flex-column h-100 position-relative">
      {/* {isDiagramLoading &&(
        <div className="apploader_container apploader_container_widget">
          <span className="apploader"></span>
        </div>
      )} */}
        <div
          ref={diagramRef}
          style={{ width: "100%", height: "100%" }}
          className="the_map flex-fill"
        />
   
     
    </div>
  );
}