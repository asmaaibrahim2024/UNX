import { React, useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import "./NetworkDiagramMapView.scss";
import * as go from "gojs";

export default function NetworkDiagramMapView() {
  const diagramRef = useRef(null);
  const diagramInstance = useRef(null);

  // Get the model from Redux
  const diagramModelData = useSelector(
    (state) => state.networkDiagramReducer.diagramModelData
  );

  useEffect(() => {

    if (!diagramRef.current || diagramInstance.current) return;
    const $ = go.GraphObject.make;

    const diagram = $(go.Diagram, diagramRef.current, {
      initialAutoScale: go.Diagram.UniformToFill,
       layout: $(go.TreeLayout, {
        angle: 90,
        layerSpacing: 80,
        nodeSpacing: 40,
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
          fill: "#f3e5f5",
          stroke: "#6a1b9a",
          strokeWidth: 2,
          width: 40,
          height: 40,
        }),
        $(go.TextBlock, {
          margin: 4,
          font: "10px sans-serif",
          textAlign: "center",
        }, new go.Binding("text", "label"))
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
      $(go.Shape, { strokeWidth: 2, stroke: "#555" }),
      $(go.Shape, {
        toArrow: "Standard",
        stroke: "#555",
        fill: "#555",
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
    if(!diagramModelData) return  
      try {
        const model = go.Model.fromJson(diagramModelData);
        diagramInstance.current.model = model;
      } catch (err) {
        console.error("Invalid diagram model JSON:", err);
      }
    
  }, [diagramModelData]);
  return (
    <>
      <div
        className={`map_view d-flex flex-column h-100 position-relative h-100 `}
      >
        <div
          ref={diagramRef}
          style={{ width: "100%", height: "100%" }}
          className="the_map flex-fill"
        />
      </div>
    </>
  );
}
