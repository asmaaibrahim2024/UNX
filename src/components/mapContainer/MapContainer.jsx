import { React, useState } from "react";
import MapView from "../mapView/MapView";
import Home from "../home/Home"

export default function MapContainer() {

    const [isLoading, setIsLoading] = useState(true);


    return (
        <>
        <MapView/>
       {/* <Home/> */}
        </>
    );
}
