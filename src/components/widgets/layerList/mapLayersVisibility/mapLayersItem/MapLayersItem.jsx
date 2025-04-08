// Libs
import React, { useEffect, useMemo, useState } from 'react';
// Configs
import arStrings from './locale/MapLayersItem.locale.ar.json';
import enStrings from './locale/MapLayersItem.locale.en.json';
import frStrings from './locale/MapLayersItem.locale.fr.json';

// Hooks & selectors
import { useLocalization } from 'app/handlers/useLocalization';

// Component (UI)
import { Icon } from 'app/components/mgComponents';
import MapLayersActions from '../mapLayersActions/MapLayersActions';
import { ReactComponent as editableLayerIcon } from 'app/style/images/mg-editable-layer.svg';
/*import { ReactComponent as layerGraphIcon } from 'app/style/images/dgda/mg-map-tool-layers.svg';*/
import layerGraphIcon from 'app/style/images/dgda/icons/LayerList.svg';
import './MapLayersItem.scss';
const MapLayersItem = ({
    layerName,
    layerId,
    isLayerActive,
    isLayerEditable,
    menuOptions,
    externalClassName,
    externalConfig,
    loadingImage,
    selectedLayerId,
    onClick
}) => {
    const { t } = useLocalization({
        enStrings,
        arStrings,
        frStrings,
    });

    const { isChild, isLayerOfScale ,viewType } = menuOptions;
    const styleCase = () => {
        let classNames;
        if (isLayerEditable && !isChild) {
            classNames = 'map-layers-item__title--editable';
        }
        if (layerId !== selectedLayerId && isLayerOfScale) {
            classNames = `${classNames} map-layers-item__title--out-of-scale`;
        }
        if (layerId == selectedLayerId) {
            classNames = `${classNames} map-layers-item__title--active-session`;
        }
        if (viewType == "3d") {
            classNames = `${classNames} map-layers-item_3D`;
        }
        return classNames;
    };

    return (
        <div className="map-layers-item">
            <div className={`map-layers-item__title ${styleCase()}`} onClick={onClick}>
                <div className="map-layers-item__title-wrapper">
                    <Icon
                        imgSrc={layerGraphIcon}
                        altText={t('editableLayer')}
                        title={t('editableLayer')}
                        imgClassName={`w_20px h_20px` }
                    />
                    <span
                        className={`map-layers-item__layer-title ${isLayerOfScale
                                ? 'map-layers-item__title--out-of-scale'
                                : isLayerEditable
                                    ? 'map-layers-item__layer-title--editable'
                                    : '' 
                            } ${viewType == "3d"
                                ? 'map-layers-item_3D'
                                : ''} `}
                        title={layerName}
                    >
                        {layerName} {viewType === "3d" ? "3D" : "2D"}
                        {isLayerActive && (
                            <span
                                className={`map-layers-item__layer-title--active ${!isLayerOfScale ? '' : 'map-layers-item__title--out-of-scale'
                                    }`}
                            >
                                {` (${t('active')})`}
                            </span>
                        )}
                    </span>

                    {isLayerEditable && (
                        <Icon
                            imgSrc={editableLayerIcon}
                            altText={t('editableLayer')}
                            title={t('editableLayer')}
                        />
                    )}
                </div>
            </div>
            <MapLayersActions
              menuOptions={menuOptions}
              externalClassName={externalClassName}
              externalConfig={externalConfig}
              loadingImage={loadingImage}
            />
        </div>
    );
};

export default React.memo(MapLayersItem);
