// Libs

import './LegendMenu.scss';

import { InlineMenuList, Legend } from 'app/components/mgComponents';
import React, { useEffect, useState } from 'react';

import arStrings from './locale/LegendMenu.locale.ar.json';
import enStrings from './locale/LegendMenu.locale.en.json';
import frStrings from './locale/LegendMenu.locale.fr.json';
import { useLocalization } from 'app/handlers/useLocalization';

// Configs



// Hooks & selectors


// Component (UI)



const LegendMenu = ({
  mapAgent,
  id,
  isLayerEditable,
  respectLayerVisibility,
  type,
  loadingImage,
  label
}) => {
  const { t } = useLocalization({
    enStrings,
    arStrings,
    frStrings,
  });

  const [lId, setLId] = useState();
  const [lType, setLType] = useState();
  const [lTitle, setLTitle] = useState();

  let layerType, layerId;
  useEffect(() => {
    if (isLayerEditable) {
      layerId = id?.slice(id.lastIndexOf('_') + 1);
      layerType = id?.slice(0, id.indexOf('_'));
    } 
    setLId(layerId);
    setLType(layerType);
    setLTitle(label);
  }, [id]);

  return (
    <InlineMenuList
      menuTitle={t('legend')}
      menuClassName={'legend-menu'}
      menuData={[
        <Legend
          mapAgent={mapAgent}
          id={lId}
          layerType={lType}
          isLayerEditable={isLayerEditable}
          respectLayerVisibility={respectLayerVisibility}
          loadingImage={loadingImage} 
          label = {lTitle}
        />,
      ]}
    />
  );
};

export default React.memo(LegendMenu);
