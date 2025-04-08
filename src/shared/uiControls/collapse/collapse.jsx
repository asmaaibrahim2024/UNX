import { Collapse } from 'antd';
import React, { useState, useEffect } from 'react';
// import LegendContainer from '../../../modules/mapViewer/components/mapTools/legendContainer/LegendContainer';
import './collapse.scss';
import { Button ,Legend} from "app/components/mgComponents";
import { ReactComponent as ZoomIcon } from 'app/style/images/mg-zoom.svg';
import { ReactComponent as menuIcon } from 'app/style/images/mg-menu.svg';
import {
    SwitchButton,
    MenuList
} from "app/components/mgComponents";

import AppList from "app/shared/components/list/list";

const { Panel } = Collapse;

const AppCollapse = ({ content }) => {
    const [activeKey, setActiveKey] = useState([content.props.activeKey]);
    const onChange = (key) => {
        console.log(key);
        console.log(content);
    };
    useEffect(() => {
        setActiveKey([content.props.activeKey]);
    }, [content.props.activeKey]);

    return (
        <Collapse activeKey={activeKey} onChange={onChange} className="custom_collapse">
            <Panel header={content} collapsible="icon" showArrow={false} >
                <Legend props ={content} />
                {/*<AppList />*/}
            </Panel>
        </Collapse>
    );
};
export default AppCollapse;