// Libs
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useMemoSelector } from "app/handlers/memorizationSelector";
import {
    ViewSelector
  } from "app/redux/mapsView/mapsViewSelector";

// Config
import config from './MapLayersVisibility.config.json';
import arStrings from './locale/MapLayersVisibility.locale.ar.json';
import enStrings from './locale/MapLayersVisibility.locale.en.json';
import frStrings from './locale/MapLayersVisibility.locale.fr.json';
import { layersDescription } from 'app/constants/logsDescription';
// Redux actions & selectors
import {
  filteredMapLayersSelector,
  mapLayerOperationSelector,
  mapLayersSelector,
} from 'app/redux/mapTools/mapLayers/mapLayersSelector';
import {
  updateMapLayerOrder,
  updateMapLayerVisibility,
} from 'app/redux/mapTools/mapLayers/mapLayersActions';
import {
  mapLayerOperationTypes,
  mapLayerType,
} from 'app/constants/mapEnums';
import { userInfoSelector } from "app/redux/user/userSelector";


// Handlers
import { useMapHandler } from 'app/handlers/map/mapHandler';
import { useLocalization } from 'app/handlers/useLocalization';
import { useComponentSettings } from 'app/handlers/useComponentSettings';

// Enums
import { componentsNames } from 'app/constants/mgEnums';

// Component (UI)
import {
    Button,
    Icon,
    ReorderList,
    ReorderListCollapse,
    Tooltip,
    Tree,
} from "app/components/mgComponents";
import MapLayersItem from './mapLayersItem/MapLayersItem';
import { ReactComponent as visibleEye } from 'app/style/images/mg-visible-eye.svg';
import { ReactComponent as nonVisibleEye } from 'app/style/images/mg-non-visible-eye.svg';
import { ReactComponent as noFilteredLayers } from 'app/style/images/mg-no-filtered-layers.svg';
import './MapLayersVisibility.scss';
import { mapScaleSelector } from "app/redux/maps/mapsSelector";
import {
    isSplitScreen
} from "app/redux/mapsView/mapsViewSelector";
import {
    is3DEnabledSelector
} from "app/redux/maps/mapsSelector";



import {
    SwitchButton,
} from "app/components/mgComponents";
import { async } from 'rxjs';

const MapLayersVisibility = ({
    respectLayerVisibility,
    mapAgent,
    externalClassName,
    externalConfig,
    loadingImage,
    selectedLayerId,
}) => {
    const { t, isLtr, isLoaded } = useLocalization({
        enStrings,
        arStrings,
        frStrings,
    });
    const is3DActive = useMemoSelector(is3DEnabledSelector, mapAgent);
    const isSplitScreenEnabled = useMemoSelector(isSplitScreen, mapAgent);

    const {
        changeLayerVisibility,
        changeLayerOpacity,
        changeLayerOrder,
        setMapScale,
        changePopupEnable,
        changeLabelEnable,
        zoomToExtent
    } = useMapHandler({ mapAgent });

    const dispatch = useDispatch();

    const mapLayers = useMemoSelector(mapLayersSelector, mapAgent);
    const mapView = useMemoSelector(ViewSelector, mapAgent);


    const mapLayerOperation = useMemoSelector(
        mapLayerOperationSelector,
        mapAgent
    );
    const filteredMapLayers = useMemoSelector(
        filteredMapLayersSelector,
        mapAgent
    );

    useEffect(() => {
        const savedSettings = {};
        if (mapLayers.length > 0) {
            mapLayers.forEach((mapLayer) => {
                const { visible, id, requests } = mapLayer;
                const layerLabelEnable = {};
                Object.keys(requests).forEach((layerKey) => {
                    layerLabelEnable[layerKey] = requests[layerKey].isLabelEnabled;
                });
                savedSettings[id] = { visible, layerLabelEnable };
            });
        }

        // setSettings({
        //   ...componentSettings,
        //   [componentsNames.MAP_LAYERS]: savedSettings,
        // });
    }, [mapLayers]);

    const mapScale = useMemoSelector(mapScaleSelector, mapAgent);

    const [falsyFilter, setFalsyFilter] = useState(false);

    const onClick = ({ id, isLayerEditable, type }) => {
        dispatch(
            updateMapLayerVisibility({
                payload: {
                    mapAgent,
                    options: {
                        id,
                        isLayerEditable,
                        mapLayers,
                        isToggledLayer: false,
                        isAllRequests: false,
                        type,
                    },
                },
            })
        );

    };

    const onReorder = (
        sourceId,
        destinationId,
        sourceIndex,
        destinationIndex
    ) => {
        dispatch(
            updateMapLayerOrder({
                payload: {
                    mapAgent,
                    options: {
                        mapLayers,
                        sourceId,
                        destinationId,
                        sourceIndex,
                        destinationIndex,
                    },
                },
            })
        );

    };

    const onScaleChange = (scale, layerId, isLayerEditable, type) => {
        let layerType;
        if (isLayerEditable) {
            layerType = mapLayerType.GWE_LIVE;
        }
        else {
            layerType = mapLayerType.NON_EDITABLE_LAYER;
        }
        setMapScale(scale, layerId, layerType);
    };

    useEffect(() => {
        if (mapLayerOperation.type === mapLayerOperationTypes.UPDATE_VISIBILITY) {
            changeLayerVisibility(
                mapLayerOperation.options.type,
                mapLayerOperation.options.visibility,
                mapLayerOperation.options
            );
        } else if (
            mapLayerOperation.type ===
            mapLayerOperationTypes.UPDATE_ALL_REQUESTS_VISIBILITY
        ) {
            changeLayerVisibility(
                mapLayerOperation.options.type,
                mapLayerOperation.options.visibility,
                mapLayerOperation.options
            );
        } else if (
            mapLayerOperation.type ===
            mapLayerOperationTypes.UPDATE_NON_EDITABLE_LAYER_OPACITY ||
            mapLayerOperation.type ===
            mapLayerOperationTypes.UPDATE_EDITABLE_LAYER_OPACITY
        ) {
            changeLayerOpacity({
                mapAgent: mapLayerOperation.options?.mapAgent,
                options: mapLayerOperation.options,
            });
        } else if (
            mapLayerOperation.type === mapLayerOperationTypes.FILTER_MAP_LAYERS
        ) {
            if (mapLayerOperation.falsyValue && !filteredMapLayers.length) {
                setFalsyFilter(true);
            } else {
                setFalsyFilter(false);
            }
        } else if (
            mapLayerOperation.type === mapLayerOperationTypes.UPDATE_LAYER_ORDER
        ) {
            changeLayerOrder({
                mapAgent: mapLayerOperation.options?.mapAgent,
                options: mapLayerOperation.options,
            });
        } else if (
            mapLayerOperation.type ===
            mapLayerOperationTypes.UPDATE_EDITABLE_LAYERS_POPUP_ENABLING ||
            mapLayerOperation.type ===
            mapLayerOperationTypes.UPDATE_NON_EDITABLE_LAYERS_POPUP_ENABLING
        ) {
            changePopupEnable({
                layerId: mapLayerOperation.options.layerId,
                layerType: mapLayerOperation.options.layerType,
                popupEnabled: mapLayerOperation.options.popupEnabled,
            });
        } else if (
            mapLayerOperation.type ===
            mapLayerOperationTypes.UPDATE_EDITABLE_LAYERS_LABEL_ENABLING ||
            mapLayerOperation.type ===
            mapLayerOperationTypes.UPDATE_NON_EDITABLE_LAYERS_LABEL_ENABLING
        ) {
            changeLabelEnable({
                layerId: mapLayerOperation.options.layerId,
                layerType: mapLayerOperation.options.type,
                isLabelEnabled: mapLayerOperation.options.isLabelEnabled,
            });
            
        }
        
    }, [mapLayerOperation]);
    

    const createIcon = ({
        layer,
        isLayerOfScale,
        isChild,
        req,
        isLayerActive,
        isChildLayerActive,
    }) => {
        return !isLayerOfScale ? (
                ///*<Button*/
                //    imgSrc={
                //        layer.visible.includes(isChild ? req.id : layer.id)
                //            ? visibleEye
                //            : nonVisibleEye
                //    }
                //    title={
                //        layer.visible.includes(isChild ? req.id : layer.id)
                //            ? t('hideLayer')
                //            : t('showLayer')
                //    }
                //    altText={''}
                //    isDisabled={isChild ? isChildLayerActive : isLayerActive}
                //    onClick={() =>
                //        onClick(
                //            isChild
                //                ? {
                //                    id: req.id,
                //                    isLayerEditable: layer.isEditable,
                //                    type: layer.layerType,
                //                }
                //                : {
                //                    id: layer.id,
                //                    isLayerEditable: layer.isEditable,
                //                    type: layer.layerType,
                //                }
                //        )
                //    }
                ///>
                <SwitchButton
                    onChange={() =>
                        onClick(
                            isChild
                                ? {
                                    id: req.id,
                                    isLayerEditable: layer.isEditable,
                                    type: layer.layerType, 
                                    viewType : layer.viewType
                                }
                                : {
                                    id: layer.id,
                                    isLayerEditable: layer.isEditable,
                                    type: layer.layerType,
                                    viewType : layer.viewType
                                }
                        )
                    }
                    checked={layer.visible.includes(isChild ? req.id : layer.id)}
                    
                />
        ) : (
            <Tooltip
                placement={isLtr ? 'topLeft' : 'topRight'}
                className={`${externalClassName} scale-tooltip`}
                title={
                    <div>
                        {t('scaleTooltip')}
                        {
                            <Button
                                onClick={() =>
                                    onScaleChange(
                                        layer.minScale,
                                        layer.id,
                                        layer.isEditable,
                                        layer.layerType
                                    )
                                }
                            >
                                {`1 :${layer.minScale}`}
                            </Button>
                        }
                    </div>
                }
            >
                <span className={isLayerOfScale ? 'toc-layer-out-of-scale' : ''}>
                    <Button
                        imgSrc={
                            layer.visible.includes(isChild ? req.id : layer.id)
                                ? visibleEye
                                : nonVisibleEye
                        }
                        title={
                            layer.visible.includes(isChild ? req.id : layer.id)
                                ? t('hideLayer')
                                : t('showLayer')
                        }
                        altText={''}
                        isDisabled={isChild ? isChildLayerActive : isLayerActive}
                        btnClassName=""
                        onClick={() =>
                            onClick(
                                isChild
                                    ? {
                                        id: req.id,
                                        isLayerEditable: layer.isEditable,
                                        type: layer.layerType,
                                    }
                                    : {
                                        id: layer.id,
                                        isLayerEditable: layer.isEditable,
                                        type: layer.layerType,
                                    }
                            )
                        }
                    />
                </span>
            </Tooltip>
        );
    };

    const treeList = useMemo(() => { 
        var  layers = filteredMapLayers.length ? filteredMapLayers : mapLayers;

        if (!isSplitScreenEnabled) {
            if (is3DActive) {
              layers=layers.filter(l => l.viewType == "3d")
            } else {
               layers= layers.filter(l => l.viewType == "2d")

            }
        }

        layers.sort((a, b) => {
            // Compare the viewType property
            if (a.viewType === "2d" && b.viewType === "3d") {
              return -1; // "2d" comes before "3d"
            } else if (a.viewType === "3d" && b.viewType === "2d") {
              return 1; // "3d" comes after "2d"
            } else {
              return 0; // No change in order
            }
        });
        return Promise.all(layers.map(async (layer) => {

            const fiteredMapLayers = mapView.map.layers.items.filter((i) => i.type == "feature");
            const layerView = fiteredMapLayers.find((layerView) => layerView.title == layer.title)
            const isLayerActive = Number(layer.id) === selectedLayerId;
            //TODO: maxScale will be handled later
            const isLayerOfScale = layer.minScale <= mapScale || layer.maxScale >= mapScale;
            const layerRequests = Object.keys(layer.requests);
            const zoomToLayerExtent = () => {
                let layerId, layerType;
                if (layer.isEditable) {
                    layerId = layer.id?.slice(layer.id.lastIndexOf('_') + 1);
                    layerType = layer.id?.slice(0, layer.id.indexOf('_'));
                } else {
                    if (layer.layerType === mapLayerType.WEBMAP) {
                        layerId = layer.id;
                        layerType = layer.layerType;
                    } else {
                        layerId = layer.id;
                        layerType = layer.id;
                    }
                }
                zoomToExtent(layerId, layerType);
            };
         
             
            const layerTree = [
                {
                    key: layer.id,
                    title: (
                        <MapLayersItem
                            layerName={layer.title}
                            layerId={layer.id}
                            isLayerEditable={layer.isEditable}
                            menuOptions={{
                                id: layer.id,
                                isLayerEditable: layer.isEditable,
                                opacity: layer.opacity,
                                mapAgent,
                                mapLayers,
                                isChild: false,
                                respectLayerVisibility,
                                isLayerOfScale: isLayerOfScale,
                                popupEnabled: layer.popupEnabled,
                                isLabelEnabled: layer.isLabelEnabled,
                                activeKey: layer.activeKey,
                                hasChildren: layer.hasChildren,
                                type: layer.layerType,
                                title : layer.title ,
                                viewType: layer.viewType
                            }}
                            onClick={zoomToLayerExtent}
                            externalClassName={externalClassName}
                            externalConfig={externalConfig}
                            loadingImage={loadingImage}
                            selectedLayerId={selectedLayerId}
                        />
                    ),
                    icon: createIcon({
                        layer,
                        isLayerOfScale,
                        isLayerActive,
                        isChild: false,
                    }),

                    children: layerRequests.length
                        ? Object.values(layer.requests).map((req) => {
                            const isChildLayerActive =
                                isLayerActive &&
                                (req.id.includes('live') || req.id.includes('draftRequest'));
                            return {
                                key: req.id,
                                title: (
                                    <MapLayersItem
                                        layerName={req.title}
                                        layerId={req.id}
                                        isLayerActive={isChildLayerActive}
                                        menuOptions={{
                                            id: req.id,
                                            opacity: req.opacity,
                                            isLayerEditable: layer.isEditable,
                                            mapAgent,
                                            mapLayers,
                                            isChild: true,
                                            respectLayerVisibility,
                                            isLayerOfScale: isLayerOfScale,
                                            popupEnabled: req.popupEnabled,
                                            isLabelEnabled: req.isLabelEnabled,
                                            activeKey: req.activeKey,
                                            hasChildren: layer.hasChildren,
                                            type: layer.layerType,
                                            title:layer.title ,
                                            viewType: layer.viewType
                                        }}
                                        onClick={zoomToLayerExtent}
                                        externalClassName={externalClassName}
                                        externalConfig={externalConfig}
                                        selectedLayerId={selectedLayerId}
                                    />
                                ),
                                icon: createIcon({
                                    layer,
                                    isLayerOfScale,
                                    isLayerActive,
                                    isChild: true,
                                    req,
                                    isChildLayerActive,
                                }),
                            };
                        })
                        : [],
                },
            ];
            return {
                id: layer.id,
                content: (
                    <label
                        title={
                            isLtr
                                ? `${layer.title} ${t('layer')}`
                                : `${t('layer')} ${layer.title}`
                        } 
                        respectLayerVisibility = {respectLayerVisibility}
                        mapAgent = {mapAgent} 
                        loadingImage={loadingImage} 
                        activeKey={layer.activeKey} 
                        layerview = {layerView}
                    >
                        <Tree treeData={layerTree} showIcon={config.tree.showIcon} switcherIcon={config.tree.switcherIcon} />
                    </label>
                ),
            };
        }));
    }, [isLoaded, mapLayers, filteredMapLayers, mapScale,isSplitScreenEnabled,is3DActive]);

    return (
        <>
            {falsyFilter ? (
                <div className="map-layers-falsy-value">
                    <Icon imgSrc={noFilteredLayers} altText={t('filterFalsyValue')} />
                    <div>{t('filterFalsyValue')}</div>
                </div>
            ) : (
                <div className="map-layers-visibility">
                    {/*<ReorderList list={treeList} onReorder={onReorder} />*/}
                    <ReorderListCollapse list={treeList} onReorder={onReorder} />
                </div>
            )}
        </>
    );
};

export default React.memo(MapLayersVisibility);
