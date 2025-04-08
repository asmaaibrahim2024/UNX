import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { Button } from "app/components/mgComponents";
import LegendIcon from 'app/style/images/mg-map-tool-legend.svg';
import './MapLayersActions.scss';
import { useLocalization } from "app/handlers/useLocalization";
import { updateLegendEnabled } from "app/redux/mapTools/mapLayers/mapLayersActions";
import { useMemoSelector } from "app/handlers/memorizationSelector";
import { mapLayersSelector } from 'app/redux/mapTools/mapLayers/mapLayersSelector';
import enStrings from './locale/MapLayersActions.locale.en.json';
import arStrings from './locale/MapLayersActions.locale.ar.json';
import frStrings from './locale/MapLayersActions.locale.fr.json';
import MapLayersMenu from './mapLayersMenu/MapLayersMenu';
import config from './MapLayersActions.config.json';
import { mapLayerType } from 'app/constants/mapEnums';

const MapLayersActions = ({ menuOptions, externalClassName, externalConfig, loadingImage }) => {
  const { t } = useLocalization({
    enStrings,
    arStrings,
    frStrings,
  });

  const { isLayerOfScale, mapAgent, id, isLayerEditable, type } = menuOptions;

  const mapLayers = useMemoSelector(mapLayersSelector, mapAgent);
  const dispatch = useDispatch();

  const [localActiveKey, setLocalActiveKey] = useState(menuOptions.activeKey);

  const collapseLegend = useCallback(() => {
    let layerId, layerType;
    let activeK = localActiveKey === "1" ? "0" : "1";
    setLocalActiveKey(activeK);

    if (isLayerEditable) {
      layerId = id?.slice(id.lastIndexOf('_') + 1);
      layerType = id?.slice(0, id.indexOf('_'));
    } else {
      if (type === mapLayerType.WEBMAP) {
        layerId = id;
        layerType = type;
      } else {
        layerId = id;
        layerType = id;
      }
    }

    const payload = {
      mapAgent,
      options: {
        layerId,
        mapLayers,
        type: layerType,
        activeKey: activeK,
        id: layerId,
        isLayerEditable,
      },
    };

    dispatch(updateLegendEnabled({ payload }));
  }, [localActiveKey, isLayerEditable, id, type, mapAgent, mapLayers, dispatch]);

  useEffect(() => {
    setLocalActiveKey(menuOptions.activeKey);
  }, [menuOptions.activeKey]);

  return (
    <div className="map-layers-actions">
      {/* <div    id={`${id}_LegendContainer`} className={localActiveKey === "0" ? "selectedDiv" : ""}> */}
      <Button
        id={`${id}_Legend`}
        imgSrc={LegendIcon}
        onClick={collapseLegend}
        btnClassName={localActiveKey === "0" ? "selectedDiv" : ""}
        altText={t('LegendTitle')}
        title={t('LegendTitle')}
        isDisabled={isLayerOfScale}
        imgClassName={`w_20px h_20px map_layer_action_zoom ${id} ${id === 'DM_Basemap_5859' ? 'map_layer_action_zoom_active' : ''}`}
      />
      {/* </div> */}
      {externalConfig.mapLayersMenu && config.mapLayersMenu.isEnabled && (
        <MapLayersMenu
          menuOptions={menuOptions}
          isLayerOfScale={isLayerOfScale}
          externalClassName={externalClassName}
          externalConfig={externalConfig}
          loadingImage={loadingImage}
        />
      )}
    </div>
  );
};

export default React.memo(MapLayersActions);
