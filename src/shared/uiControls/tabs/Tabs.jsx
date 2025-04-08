import React from 'react';
import { Tabs as AntTabs } from 'app/components/externalComponents';
import PropTypes from 'prop-types';
import './Tabs.scss';
import { Button } from 'app/components/mgComponents';

import { ReactComponent as RightArrow } from 'app/style/images/mg-right-arrow.svg';
import { ReactComponent as LeftArrow } from 'app/style/images/mg-left-arrow.svg';

const { TabPane } = AntTabs;

/**
 * Define Tab Object
 * @typedef {Object} Tab
 * @property {string} type: Title component
 * @property {object} title: Title component
 * @property {object} content: Title component
 */
/**
 * Tabs common component
 * using AntDesign https://ant.design/components/tabs/#header
 * @param {object} props
 * @param {string} props.className : tab className
 * @param {string} props.id : tab id
 * @param {string} [props.tabPosition]: position of tabs	top | right | bottom | left
 * @param {string} [props.defaultActiveKey]: active TabPane's key
 * @param {number} props.disabledKey: key of disabled tab,
 * @param {string} props.activeKey
 * @param {string} props.tabPaneClassName
 * @param {string} props.tabsWrapperClassName
 * @param {function} props.onTabClick
 * @param {Array.<Tab>} props.tabs : tab content ( title and content) to be wrapped and displayed in the tabs
 */

const Tabs = ({
  tabs,
  tabPosition = 'top',
  defaultActiveKey = '0', // set index to zero in case the props not sending
  id,
  className,
  activeKey,
  disabledKey,
  tabPaneClassName,
  tabsWrapperClassName,
  onTabClick,
  withArrows = false,
  arrowsClassName,
  forceRenderTabs = true,
  ...restProps
}) => {
  const selectPrev = () => {
    const index = tabs.findIndex((tab) => tab.type === activeKey);
    const prevKey = index !== -1 ? tabs[index - 1].type : +activeKey - 1;
    onTabClick(prevKey.toString());
  };

  const selectNext = () => {
    const index = tabs.findIndex((tab) => tab.type == activeKey);
    const nextKey = index !== -1 ? tabs[index + 1].type : +activeKey + 1;
    onTabClick(nextKey.toString());
  };
  return (
    <div id={id} className={`tabs ${className}`}>
      {tabs.length > 0 ? (
        <AntTabs
          className={`tabs__wrapper ${tabsWrapperClassName}`}
          defaultActiveKey={defaultActiveKey}
          activeKey={activeKey}
          tabPosition={tabPosition}
          onTabClick={onTabClick}
          type="editable-card"
          hideAdd
          tabBarExtraContent={
            withArrows && (
              <>
                <Button
                  id={`tabs_prev_arrow_${id}`}
                  onClick={selectPrev}
                  icon={<LeftArrow />}
                  disabled={activeKey == (tabs[0].type || 0)}
                  btnClassName={arrowsClassName}
                />
                <Button
                  id={`tabs_next_arrow_${id}`}
                  onClick={selectNext}
                  icon={<RightArrow />}
                  disabled={
                    activeKey == (tabs[tabs.length - 1].type || tabs.length - 1)
                  }
                  btnClassName={arrowsClassName}
                />
              </>
            )
          }
          {...restProps}
        >
          {tabs.map((pane, index) => (
            <TabPane
              className={`tabs__pane ${tabPaneClassName}`}
              tab={pane.title}
              key={pane.type ? pane.type : `${index}`}
              closable={pane.closable || false}
              forceRender={forceRenderTabs}
            >
              {pane.content}
            </TabPane>
          ))}
        </AntTabs>
      ) : null}
    </div>
  );
};

Tabs.propTypes = {
  id: PropTypes.string,
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string,
      title: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
      content: PropTypes.element,
    })
  ).isRequired,
  className: PropTypes.string,
  tabPosition: PropTypes.string,
  activeKey: PropTypes.string,
  defaultActiveKey: PropTypes.number,
  disabledKey: PropTypes.number,
};

export default React.memo(Tabs);
