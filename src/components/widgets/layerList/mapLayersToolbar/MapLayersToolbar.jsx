// Libs
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useMemoSelector } from 'app/handlers/memorizationSelector';

// Configs
import arStrings from './locale/MapLayersToolbar.locale.ar.json';
import enStrings from './locale/MapLayersToolbar.locale.en.json';
import frStrings from './locale/MapLayersToolbar.locale.fr.json';
import { requestVisibilityTypes } from 'app/constants/mgEnums';
import { layerRequestsTypes } from 'app/constants/mapEnums';
import { layersDescription } from 'app/constants/logsDescription';

// Hooks & selectors
import { useLocalization } from 'app/handlers/useLocalization';
import { useDebounce } from 'app/handlers/useDebounce';
import { useNonInitialEffect } from 'app/handlers/useNonInitialEffect';
import {
  requestsVisibilityStateSelector,
  filteredMapLayersOptionsSelector,
  mapLayersSelector,
} from 'app/redux/mapTools/mapLayers/mapLayersSelector';
import {
  filterMapLayers,
  updateMapLayerVisibility,
} from 'app/redux/mapTools/mapLayers/mapLayersActions';
import { userInfoSelector } from "app/redux/user/userSelector";

// Component (UI)
import { AutoComplete, Icon, SwitchButton } from 'app/components/mgComponents';
/*import { ReactComponent as filterIcon } from 'app/style/images/mg-search.svg';*/
import filterIcon from 'app/style/images/dgda/icons/filter_icon.png';
import './MapLayersToolbar.scss';

// Handelers

const MapLayersToolbar = ({
  allowEditableLayersRequests,
  mapAgent,
  externalClassName,
  showDraft,
}) => {
  const dispatch = useDispatch();
  const { t, isLtr } = useLocalization({
    enStrings,
    arStrings,
    frStrings,
  });
  const mapLayers = useMemoSelector(mapLayersSelector, mapAgent);
  const [filterValue, setFilterValue] = useState('');
  const filteredMapLayers = useMemoSelector(
    filteredMapLayersOptionsSelector,
    mapAgent
  );
  const filteredLayers = filteredMapLayers?.filteredLayers;
  const currFilterValue = filteredMapLayers?.filterValue;
  const requestsVisibilityState = useMemoSelector(
    requestsVisibilityStateSelector,
    mapAgent
  );


  const debouncedFilterTerm = useDebounce(filterValue, 500);


  const HandleFilterMapLayers = (value) => {
    if (!value) setFilterValue('');
      else setFilterValue(value);
  };

  useEffect(() => {
    if (currFilterValue) {
      setFilterValue(currFilterValue);
    }
  }, []);

  useNonInitialEffect(() => {
    dispatch(
      filterMapLayers({ payload: { mapAgent, value: debouncedFilterTerm } })
    );
  }, [debouncedFilterTerm]);


  return (
    <div className="map-layers-toolbar">
      <label className="map-layers-toolbar__filter" title={t('filter')}>
        <AutoComplete
          id="filter-on-map"
          placeholder={t('filterPlaceholder')}
          options={filteredLayers}
          value={filterValue}
          allowClear={true}
          onChange={(value) => HandleFilterMapLayers(value)}
          dropdownClassName={externalClassName}
        />
              <Icon id="filter-on-map" imgSrc={filterIcon} imgClassName={ 'w_20px h_20px' } altText={t('filter')} />
      </label>
    </div>
  );
};

export default React.memo(MapLayersToolbar);
