import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

import arStrings from "./locale/ReorderListCollapse.locale.ar.json";
import enStrings from "./locale/ReorderListCollapse.locale.en.json";
import frStrings from "./locale/ReorderListCollapse.locale.fr.json";
import { useLocalization } from "app/handlers/useLocalization";

import { Icon } from "app/components/mgComponents";
import { ReactComponent as draggingIcon } from "app/style/images/mg-dragging.svg";
import "./ReorderListCollapse.scss";

import AppCollapse from "app/shared/components/collapse/collapse";

const getItemStyle = (isDragging, draggableStyle) => ({
  userSelect: "none",

  // styles we need to apply on draggables
  ...draggableStyle,
});

const getListStyle = (isDraggingOver, listStyle) => ({
  ...listStyle,
});

const ReorderListCollapse = ({ list, ...restProps }) => {
    const { t } = useLocalization({
        enStrings,
        arStrings,
        frStrings,
    });
    const [resolvedTreeList, setResolvedTreeList] = useState([]);
    const onDragEnd = (result) => {
        // dropped outside the list

        if (!result.destination) {
            return;
        }
        if (
            result.destination.droppableId === result.source.droppableId &&
            result.destination.index === result.source.index
        ) {
            return;
        }
        restProps?.onReorder?.(
            result.draggableId,
            list[result.destination.index]?.id,
            result.source.index,
            result.destination.index
        );
    };

    useEffect(() => {
        list.then((resolvedList) => {
            setResolvedTreeList(resolvedList);
        });
    }, [list]);

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="droppable">
                {(provided, snapshot) => (
                    <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="reorder-list-container"
                        style={getListStyle(snapshot.isDraggingOver)}
                    >
                        {resolvedTreeList.map((item, index) => {
                            const id = item.id.toString();
                            return (
                                <Draggable key={id} draggableId={id} index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={`reorder-list-container__item custom`}
                                            style={getItemStyle(
                                                snapshot.isDragging,
                                                provided.draggableProps.style
                                            )}
                                        >
                                            <Icon
                                                id={`${id}_drag`}
                                                imgSrc={draggingIcon}
                                                altText={t("drag")}
                                            />
                                            {/*<div className="reorder-list-container__content">*/}
                                            {/*    {item.content}*/}
                                            {/*</div>*/}
                                            <div className="reorder-list-container__content">
                                                <AppCollapse content={item.content} />
                                            </div>
                                        </div>
                                    )}
                                </Draggable>
                            );
                        })}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
};

ReorderListCollapse.propTypes = {
  list: PropTypes.array.isRequired,
};

ReorderListCollapse.defaultProps = {
  list: [],
};

export default React.memo(ReorderListCollapse);
