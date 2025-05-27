import React from "react";
import PropTypes from "prop-types";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

import arStrings from "./locale/ReorderList.locale.ar.json";
import enStrings from "./locale/ReorderList.locale.en.json";
import frStrings from "./locale/ReorderList.locale.fr.json";
import { useLocalization } from "app/handlers/useLocalization";

import { Icon } from "app/components/mgComponents";
import { ReactComponent as draggingIcon } from "app/style/images/mg-dragging.svg";
import "./ReorderList.scss";

const getItemStyle = (isDragging, draggableStyle) => ({
  userSelect: "none",

  // styles we need to apply on draggables
  ...draggableStyle,
});

const getListStyle = (isDraggingOver, listStyle) => ({
  ...listStyle,
});

const ReorderList = ({ list, ...restProps }) => {
  const { t } = useLocalization({
    enStrings,
    arStrings,
    frStrings,
  });
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
            {list.map((item, index) => {
              const id = item.id.toString();
             // console.log({item});
              return (
                <Draggable key={id} draggableId={id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`reorder-list-container__item`}
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
                      <div className="reorder-list-container__content">
                        {item.content}
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

ReorderList.propTypes = {
  list: PropTypes.array.isRequired,
};

ReorderList.defaultProps = {
  list: [],
};

export default React.memo(ReorderList);
