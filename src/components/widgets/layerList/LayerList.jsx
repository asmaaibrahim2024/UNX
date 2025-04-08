// Libs
import React, { useEffect, useState } from 'react';
// Component (UI)
import MapLayersToolbar from './mapLayersToolbar/MapLayersToolbar';
import MapLayersVisibility from './mapLayersVisibility/MapLayersVisibility';
import { useTranslation } from "react-i18next";

import AppButton from "../../../shared/button/Button";
import { ReactComponent as ExportLayers } from "../../../style/images/dgda/icons/exportToShapeFile.svg";
import {
    changeMapLayerActiveKey ,changeALLMapLayersVisibilty
  } from 'app/redux/mapTools/mapLayers/mapLayersActions';
  import {
    mapLayersSelector,  filteredMapLayersSelector
  } from 'app/redux/mapTools/mapLayers/mapLayersSelector';

import { Switch } from 'antd';
import * as XLSX from 'xlsx';

import './LayerList.scss';
import MapLayersSearchControl from '../layerList/mapLayersSearchControl/MapLayersSearchControl';
import { useDispatch } from 'react-redux';
import {
  ViewSelector
  } from "app/redux/mapsView/mapsViewSelector";
import { useMemoSelector } from "app/handlers/memorizationSelector";
import {queryFeatureLayer } from '../../../handlers/esriHandler';
import { useMapHandler } from 'app/handlers/map/mapHandler';
const LayerList = ({
    allowEditableLayers,
    allowEditableLayersRequests,
    respectLayerVisibility,
    mapAgent,
    externalClassName,
    externalConfig,
    loadingImage,
    selectedLayerId,
    showDraft,
}) => {
    // const { t, isLtr } = useLocalization({
    //     enStrings,
    //     arStrings,
    // });
        const { t, i18n } = useTranslation("LayerList");
    
    const dispatch = useDispatch();

    const [isLoaded, setIsLoaded] = useState(false);
    const [activeKey, setActiveKey] = useState("0");
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [isVisible, setIsVisible] = useState(true);
    const [toggleText, setToggleText] = useState(t('collapseAll'));
    const mapLayers = useMemoSelector(mapLayersSelector, mapAgent);
    const mapView = useMemoSelector(ViewSelector, mapAgent);
   const filteredMapLayers = useMemoSelector(
  filteredMapLayersSelector,
  mapAgent
);
    useEffect(() => {
      setToggleText(isCollapsed ? t('expandAll'):t('collapseAll') );
        if(mapLayers) {
            const activeKeys = mapLayers.map(layer => layer.activeKey);
            const allActiveKeysAreOne = activeKeys.every(key => key === '1');
            const allActiveKeysAreZero = activeKeys.every(key => key === '0');
            
            let newActiveKey;
            if (allActiveKeysAreOne) {
              newActiveKey = '0';
            } else if (allActiveKeysAreZero) {
              newActiveKey = '1';
            } else {
              // Default to '0' or '1' based on your preference if they are mixed
              newActiveKey = '0';
            }
            setActiveKey(newActiveKey)
         
        }
    }, [mapLayers]);
    useEffect(() => {
        if(mapLayers) {
            const layersVisibility = mapLayers.map(layer => layer.visible.length == 0);
            const allLayersVisabilityAreTrue = layersVisibility.every(key => key === true);
            const allLayersVisabilityAreFalse = layersVisibility.every(key => key === false);
            
            let newActiveKey;
            if (allLayersVisabilityAreTrue) {
              newActiveKey = false;
            } else if (allLayersVisabilityAreFalse) {
              newActiveKey = true;
            } else {
              // Default to '0' or '1' based on your preference if they are mixed
              newActiveKey = true;
            }
            setIsVisible(newActiveKey)
         
        }
    }, [mapLayers]); 
  
    const collapseAll = () => {
      setIsCollapsed(!isCollapsed);
    dispatch(changeMapLayerActiveKey(mapAgent, activeKey));
    };
   
    const ToggleVisabilty= ()=>{
        setIsVisible(!isVisible);
        dispatch(changeALLMapLayersVisibilty(mapAgent, !isVisible));

    }
    const ExportToExcel = (features,layerName) => {
      // Create a worksheet
      const ws = XLSX.utils.json_to_sheet(features);

      // Create a workbook 
      const wb = XLSX.utils.book_new();

      //add the worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Features');

      XLSX.writeFile(wb, `${layerName}.csv`); 
  } 

    const ExportALLLayers= ()=>{
      if(mapLayers,mapView) { 
        const layers = mapView.map.layers.items.filter(i => i.type === "feature");
        if (filteredMapLayers && filteredMapLayers.length>0) {
          filteredMapLayers.forEach(async(layer) => {
           let mapLayerObj =layers.find(
             (u) => u.id === layer.id
             );
             if (mapLayerObj) {
               setIsLoaded(true);
               const layerName = mapLayerObj.title;
               const selectedLayerUrl = mapLayerObj.url + "/" + mapLayerObj.layerId;
               const featuresResult = await queryFeatureLayer(selectedLayerUrl);
               var features = featuresResult.map(i => i.attributes);
               ExportToExcel(features,layerName)
               setIsLoaded(false);
             }
             })      
        }else{
          mapLayers.forEach(async(layer) => {
           let mapLayerObj =layers.find(
             (u) => u.id === layer.id
             );
             if (mapLayerObj) {
               setIsLoaded(true);
               const layerName = mapLayerObj.title;
               const selectedLayerUrl = mapLayerObj.url + "/" + mapLayerObj.layerId;
               const featuresResult = await queryFeatureLayer(selectedLayerUrl);
               var features = featuresResult.map(i => i.attributes);
               ExportToExcel(features,layerName)
               setIsLoaded(false);
             }
             })
        }
     
    }
    }
    return (
      <div className="map-layers">
          <div className="d-flex">
            {isLoaded && (
                <div className="map-tools-loading-container d-inline px-3 py-3">
                    <img src={loadingImage} alt={t("loading")}  style={{ height: "30px", width: "30px" }}  />
                </div>
            )}
            {/*<MapLayersToolbar*/}
            {/*    allowEditableLayersRequests={allowEditableLayersRequests}*/}
            {/*    mapAgent={mapAgent}*/}
            {/*    externalClassName={externalClassName}*/}
            {/*    showDraft={showDraft}*/}
            {/*/>*/}

            <MapLayersSearchControl mapAgent={mapAgent} itemWidth={isLoaded ? "340px" : "370px" }  />
        </div>

            <div className="d-flex justify-content-between align-items-center p_x_8 p_b_8 txt-fs-s2">
                <button
                    className="btn btn-link text_secondary_500"
                    size="small" onClick={collapseAll}>
                    <span className="text-decoration-underline txt-fs-xs">{toggleText}</span>

                </button>
                <div className="layer_visibility p_x_12 p_t_12 p_b_4">
                    <h3 className="m_0 m_r_8 text_primary_500 txt-fs-xs fw-bold">{t('hide')}</h3>
                    <Switch size="small" defaultChecked checked={isVisible} onClick={ToggleVisabilty} />
                    <h3 className="m_0 m_l_8 text_primary_500 txt-fs-xs fw-bold">{t('show')}</h3>
                </div>
                <div>
                    <AppButton
                        title={"Export Layers"}
                        id={"Export"}
                        shape={"circle"}
                        imgSrc={ExportLayers}
                        onClick={ExportALLLayers}
                        className="btn_icon_widget"
                        appIconClassName=""
                        imgClassName="w-100 h-100"
                    />
                    <p className='d-inline txt-fs-xs'>{t('ExportLayers')}</p>
                </div>
            </div>

            <MapLayersVisibility
                allowEditableLayers={allowEditableLayers}
                respectLayerVisibility={respectLayerVisibility}
                mapAgent={mapAgent}
                externalClassName={externalClassName}
                externalConfig={externalConfig}
                loadingImage={loadingImage}
                selectedLayerId={selectedLayerId}
            />
        </div>
    );
};

export default React.memo(LayerList);
