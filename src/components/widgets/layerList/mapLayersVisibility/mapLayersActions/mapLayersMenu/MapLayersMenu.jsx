import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

// Config
import config from './MapLayersMenu.config.json';
import arStrings from './locale/MapLayersMenu.locale.ar.json';
import enStrings from './locale/MapLayersMenu.locale.en.json';
import frStrings from './locale/MapLayersMenu.locale.fr.json';

// Hooks & selectors
import { useLocalization } from "app/handlers/useLocalization";
import {
  updateMapLayerOpacity,
  updateMapLayerPopupEnabling,
  updateMapLayerIsLabelEnabled,
} from "app/redux/mapTools/mapLayers/mapLayersActions";
import { useNonInitialEffect } from "app/handlers/useNonInitialEffect";
import { useDebounce } from "app/handlers/useDebounce";

// Component (UI)
import {
  InputNumber,
  MenuList,
  Slider,
  SwitchButton,
} from "app/components/mgComponents";
import LegendMenu from './legendMenu/LegendMenu';
/*import { ReactComponent as menuIcon } from 'app/style/images/mg-menu.svg';*/
import menuIcon from 'app/style/images/dgda/icons/menu_icon.png';
import './MapLayersMenu.scss';
import { businessLayersType } from "app/constants/mapEnums";

const MapLayersMenu = ({
    menuOptions,
    externalClassName,
    externalConfig,
    loadingImage,
}) => {
    const {
        opacity,
        id,
        mapAgent,
        isLayerEditable,
        mapLayers,
        isChild,
        respectLayerVisibility,
        isLayerOfScale,
        popupEnabled,
        isLabelEnabled,
        type,
        hasChildren,
        title
    } = menuOptions;

    // Reverse the opacity calculation
    const layerOpacity = (100 - opacity * config.opacity.opacityFactor);
    const [opacityValue, setOpacityValue] = useState(layerOpacity);
    const [isPopupEnabled, setIsPopupEnabled] = useState(popupEnabled);
    const [LabelEnabled, setIsLabelEnabled] = useState(isLabelEnabled);
    const [isOpacityChanged, setIsOpacityChanged] = useState(false);

    const [errorFlag, setErrorFlag] = useState(false);
    const { t } = useLocalization({
        enStrings,
        arStrings,
        frStrings,
    });

    const dispatch = useDispatch();

    const debouncedOpacityTerm = useDebounce(opacityValue, 500);

    const onOpacityChange = (value) => {
        setIsOpacityChanged(true);
        if (
            value !== '' &&
            value !== null &&
            value >= 0 &&
            value <= 100 &&
            Number.isInteger(value)
        ) {
            setErrorFlag(false);
            setOpacityValue(value);
        } else if (value === null) {
            setErrorFlag(false);
            setOpacityValue(opacityValue);
        } else {
            setErrorFlag(true);
        }
    };

    const onPopupEnabledChange = (value) => {
        setIsPopupEnabled(value);
        dispatch(
            updateMapLayerPopupEnabling({
                payload: {
                    mapAgent,
                    options: {
                        id,
                        isLayerEditable,
                        mapLayers,
                        popupEnabled: value,
                    },
                },
            })
        );
    };

    const onLabelEnabledChange = (value) => {
        setIsLabelEnabled(value)
        dispatch(
            updateMapLayerIsLabelEnabled({
                payload: {
                    mapAgent,
                    options: {
                        id,
                        isLayerEditable,
                        mapLayers,
                        isLabelEnabled: value,
                    },
                },
            })
        );
    };

    const createMenu = () => {
        const data = [];
        for (const configKey in config) {
            if (
                configKey === 'opacity' &&
                externalConfig.opacity &&
                config[configKey].isEnabled &&
                ((!isLayerEditable && !hasChildren) || isChild)
            ) {
                data.push(
                    <label className={`${externalClassName} menu-list-item`}>
                        <span>{t('transparency')}</span>
                        <Slider
                            max={config.opacity.slider.max}
                            min={config.opacity.slider.min}
                            value={opacityValue}
                            onChange={onOpacityChange}
                        />
                        <div className={`${externalClassName} menu-list-item__input-num`}>
                            <InputNumber
                                max={config.opacity.inputNumber.max}
                                min={config.opacity.inputNumber.min}
                                value={opacityValue}
                                onChange={onOpacityChange}
                                isError={errorFlag}
                                errorValue={t('errorTooltip')
                                    .replace('{0}', config.opacity.inputNumber.min)
                                    .replace('{1}', config.opacity.inputNumber.max)}
                            />
                        </div>
                    </label>
                );
            }
            if (
                configKey === 'mapLabel' &&
                externalConfig.mapLabel &&
                config[configKey].isEnabled
            ) {
                data.push(
                    <div className={`${externalClassName} menu-list-item`}>
                        <span>{t('mapLabel')}</span>
                        <SwitchButton
                            onChange={onLabelEnabledChange}
                            checked={LabelEnabled}
                            className={` ${externalClassName
                                    ? `custom-switch-btn ${LabelEnabled ? 'custom-switch-btn--checked' : ''
                                    }`
                                    : ''
                                } `}
                        />
                    </div>
                );
            }

            if (
                configKey === 'mapPopup' &&
                externalConfig.mapPopup &&
                config[configKey].isEnabled &&
                ((isLayerEditable && isChild) ||
                    (!isLayerEditable &&
                        type !== businessLayersType.MAP_IMAGE &&
                        isChild))
            ) {
                data.push(
                    <div className={`${externalClassName} menu-list-item`}>
                        <span>{t('mapPopup')}</span>
                        <SwitchButton
                            checked={isPopupEnabled}
                            onChange={onPopupEnabledChange}
                            className={` ${externalClassName
                                    ? `${externalClassName} custom-switch-btn ${isPopupEnabled ? 'custom-switch-btn--checked' : ''
                                    }`
                                    : ''
                                } `}
                        />
                    </div>
                );
            }

            //if (
            //    configKey === 'legend' &&
            //    externalConfig.legendMenu &&
            //    config[configKey].isEnabled &&
            //    ((!isChild && type === businessLayersType.MAP_IMAGE) ||
            //        isLayerEditable ||
            //        (!isLayerEditable && type !== businessLayersType.MAP_IMAGE))
            //) {
            //    data.push(
            //        <LegendMenu
            //            mapAgent={mapAgent}
            //            id={id}
            //            isLayerEditable={isLayerEditable}
            //            respectLayerVisibility={respectLayerVisibility}
            //            mapLayers={mapLayers}
            //            type={type}
            //            loadingImage={loadingImage}
            //            label={title}
            //        />
            //    );
            //}
        }
        return data;
    };

    useNonInitialEffect(() => {
        if (isOpacityChanged && debouncedOpacityTerm !== '') {
            setIsOpacityChanged(false);
            dispatch(
                updateMapLayerOpacity({
                    payload: {
                        mapAgent,
                        options: {
                            mapAgent,
                            isLayerEditable,
                            mapLayers,
                            opacity: (100 - debouncedOpacityTerm) / config.opacity.opacityFactor,
                            id,
                            type,
                        },
                    },
                })
            );
        }
    }, [debouncedOpacityTerm]);

    useNonInitialEffect(() => {
        const layerOpacity = (100 - opacity * config.opacity.opacityFactor);
        setOpacityValue(layerOpacity);
    }, [opacity]);

    return (
        <MenuList
            id={`${id}_menu`}
            data={createMenu()}
            imgSrc={menuIcon}
            imgClassName={'w_20px h_20px img_map-layers-menu-btn'}
            placement="bottomRight"
            overlayClassName={`${externalClassName} map-layers-menu`}
            activeBtnClassName={'map-layers-menu-btn'}
            isMenuDisabled={isLayerOfScale}
            dropdownTitle={t('mapLayersMenu')}
            altText={t('mapLayersMenu')}
            label={title}
        /> 
        
    );
};

export default React.memo(MapLayersMenu);
