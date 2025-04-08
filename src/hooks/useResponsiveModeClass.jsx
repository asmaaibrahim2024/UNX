import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { isSmallScreenModeVisible, isSidebarMobileVisible } from 'app/redux/uiHandler/uiHandlerSelector'
import { enableSmallScreenMode, enableSidebarMobile } from 'app/redux/uiHandler/uiHandlerActions'

import { mapAgent } from "app/constants/mgEnums";
import { useMemoSelector } from "app/handlers/memorizationSelector";
import {
    setIsMapToolsPanelOpened,
    setSelectedMapViewId,
} from "app/redux/maps/mapsActions";
import { isMapToolsPanelOpenedSelector } from "app/redux/maps/mapsSelector";

const useResponsiveModeClass = () => {
    //hooks
    const dispatch = useDispatch();
    const showSmallScreenModeVisible = useSelector(isSmallScreenModeVisible);
    const showSidebarMobile = useSelector(isSidebarMobileVisible);

    const isMapToolsPanelOpened = useMemoSelector(
        isMapToolsPanelOpenedSelector,
        mapAgent.MV
    );

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 675) {
                document.body.classList.add("small-screen");
                dispatch(enableSmallScreenMode(true));


                //close sidebar panel
                dispatch(
                    setIsMapToolsPanelOpened(false, {
                        mapAgent: mapAgent.MV,
                    })
                );

                //if (!isMapToolsPanelOpened) {
                //    dispatch(enableSidebarMobile(true));
                //} else {
                //    dispatch(enableSidebarMobile(false));
                //}
                

                //if (showSidebarMobile) {
                //    dispatch(enableSidebarMobile(true));
                //} else {
                //    dispatch(enableSidebarMobile(false));
                //}

                

            } else {
                document.body.classList.remove("small-screen");
                dispatch(enableSmallScreenMode(false));

                //toggle sidebar panel accordiong to mobile menu opened or closed
                //if (showSidebarMobile) {
                //    dispatch(
                //        setIsMapToolsPanelOpened(true, {
                //            mapAgent: mapAgent.MV,
                //        })
                //    );
                //} else {
                //    dispatch(
                //        setIsMapToolsPanelOpened(false, {
                //            mapAgent: mapAgent.MV,
                //        })
                //    );
                //}
                
            }
        };

        handleResize();
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);
}

export default useResponsiveModeClass;