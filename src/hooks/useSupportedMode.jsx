import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { isAppSupport } from 'app/redux/uiHandler/uiHandlerSelector'
import { enableAppSupport } from 'app/redux/uiHandler/uiHandlerActions'


const useSupportedMode = () => {
    //hooks
    const dispatch = useDispatch();
    const showAppSupport = useSelector(isAppSupport);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 1050 || window.innerHeight <= 550) {
                document.body.classList.add("not-supported-app");
                dispatch(enableAppSupport(false));
                
            } else {
                document.body.classList.remove("not-supported-app");
                dispatch(enableAppSupport(true));
            }
        };

        handleResize();
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);
}

export default useSupportedMode;