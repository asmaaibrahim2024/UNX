import { React, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import MapView from "../mapView/MapView";

import { Splitter, SplitterPanel } from "primereact/splitter";

export default function MapContainer({ setLoading }) {
  const isNetworkDiagramSplitterVisible = useSelector(
    (state) => state.networkDiagramReducer.isNetworkDiagramSplitterVisible
  );

  return (
    <>
      {!isNetworkDiagramSplitterVisible ? (
        <MapView setLoading={setLoading} />
      ) : (
        <Splitter className="h-100">
          <SplitterPanel className="flex align-items-center justify-content-center">
            <MapView setLoading={setLoading} />
          </SplitterPanel>
          <SplitterPanel className="flex align-items-center justify-content-center">
            <MapView setLoading={setLoading} />
          </SplitterPanel>
        </Splitter>
      )}
    </>
  );
}
