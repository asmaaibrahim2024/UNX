import { React, useState } from "react";
import MapView from "../mapView/MapView";
import Home from "../home/Home"

export default function MapContainer({ setLoading }) {



    return (
        <>
        <MapView setLoading={setLoading}/>
       {/* <Home/> */}
        </>
    );
}
