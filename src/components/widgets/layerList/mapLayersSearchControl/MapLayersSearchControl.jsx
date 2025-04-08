import "./MapLayersSearchControl.scss";

import React from "react";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { AudioOutlined, SearchOutlined } from "@ant-design/icons";
import { Input } from "antd";
import {
    filterMapLayers,
  } from 'app/redux/mapTools/mapLayers/mapLayersActions';
import { mapAgent } from "app/constants/mgEnums";
import arStrings from "../locale/MapLayers.locale.ar.json";
import enStrings from "../locale/MapLayers.locale.en.json";
import frStrings from "../locale/MapLayers.locale.fr.json";
import { useLocalization } from "app/handlers/useLocalization";
const { Search } = Input;


const MapLayersSearchControl = ({
    mapAgent,itemWidth
}) => {
    const { t, isLtr } = useLocalization({
        enStrings,
        arStrings,
        frStrings,
    });
    const dispatch = useDispatch();
    const [searchValue, setSearchValue] = useState();
    const onChange = (e) => { 
        setSearchValue(e.target.value);
        dispatch(
            filterMapLayers({ payload: {  mapAgent, value:e.target.value } })
          );
    }

    const onClearSearch = (e) => {
        setSearchValue('');
        dispatch(
            filterMapLayers({ payload: {  mapAgent, value:'' } })
          );
    }

    return (
        <>
            <div className="p_x_12 p_y_8" style={{width:itemWidth}}>
                <Search
                    placeholder={t('filter')}
                    onChange={onChange}
                    onSearch={onClearSearch}
                    style={{
                        width: "100%",
                    }}
                    allowClear={true}
                    className={"ant-input-search_custom"}
                    addonBefore={<SearchOutlined />}
                />
            </div>
        </>
    );
};
export default MapLayersSearchControl;
