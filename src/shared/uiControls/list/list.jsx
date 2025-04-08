import { Divider, List, Typography, Avatar } from 'antd';
import React from 'react';
import enStrings from './locale/list.locale.en.json';
// import arStrings from './locale/list.locale.ar.json';
import frStrings from './locale/list.locale.fr.json';
import { useLocalization } from 'app/handlers/useLocalization';

import { Button, Icon } from "app/components/mgComponents";
import { ReactComponent as ZoomIcon } from 'app/style/images/mg-zoom.svg';
import { ReactComponent as menuIcon } from 'app/style/images/mg-menu.svg';
import { ReactComponent as layerGraphIcon } from 'app/style/images/dgda/mg-map-tool-layers.svg';

import './list.scss';

const data = [
    {
        title: 'Legend 1',
    },
    {
        title: 'Legend 2',
    },
    {
        title: 'Legend 3',
    },
    {
        title: 'Legend 4',
    },
];



const AppList = () => {
    const { t } = useLocalization({
        enStrings,
      
        frStrings,
    });
    return (
        <List
            dataSource={data}
            renderItem={(item) => (
                <List.Item>
                    <List.Item.Meta
                        avatar={<Icon
                            imgSrc={layerGraphIcon}
                            altText={t('legend')}
                            imgClassName={'w_20px h_20px'}
                        />}
                        title={item.title}
                    />
                    <p class="m_0"><span>(</span><span>155</span><span>)</span></p>
                </List.Item>
            )}
        />
    );
};
export default React.memo(AppList);