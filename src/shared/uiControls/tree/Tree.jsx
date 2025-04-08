import React from 'react';
import PropTypes from 'prop-types';
import { Tree as AntTree } from "app/components/externalComponents";
import './Tree.scss';
const Tree = ({
    id,
    treeData,
    actions,
    treeClassName,
    switcherIcon,
    showIcon,
    ...restProps
}) => {
    const itemActions = (item) => (
        <div key={item.key} className="tree-item">
            {item.title}
            <div className="tree-item__actions">{actions}</div>
        </div>
    );
    return (
        <AntTree
            id={`tree_list_${id}`}
            treeData={treeData}
            titleRender={itemActions}
            switcherIcon={switcherIcon}
            showIcon={showIcon}
            className={`tree-list ${treeClassName}`}
            {...restProps}
        />
    );
};

Tree.propTypes = {
    id: PropTypes.string,
    treeData: PropTypes.arrayOf(
        PropTypes.shape({
            title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
            key: PropTypes.string,
            children: PropTypes.arrayOf(
                PropTypes.shape({
                    title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
                    key: PropTypes.string,
                })
            ),
        })
    ).isRequired,
    switcherIcon: PropTypes.node,
    showIcon: PropTypes.bool,
    actions: PropTypes.node,
    className: PropTypes.string,
};

export default React.memo(Tree);
