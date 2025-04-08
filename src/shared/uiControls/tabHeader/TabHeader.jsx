import React, {useEffect} from "react";
import PropTypes from "prop-types";

// l10n
import enStrings from "./locale/tabHeader.locale.en.json";
import arStrings from "./locale/tabHeader.locale.ar.json";
import frStrings from "./locale/tabHeader.locale.fr.json";

import {useLocalization} from "app/handlers/useLocalization";
// Common SVG Icons
import {ReactComponent as AddIcon} from "app/style/images/mg-add.svg";
import {ReactComponent as FloatIcon} from "app/style/images/mg-popout-window.svg";
import {ReactComponent as CloseIcon} from "app/style/images/mg-close.svg";
import {ReactComponent as AlertIcon} from "app/style/images/mg-alert.svg";
import {ReactComponent as DraggingIcon} from "app/style/images/mg-dragging.svg";

import {Button, Icon as TabIcon} from "app/components/mgComponents";
import {Actions, TabNode} from "@gss20/mg-flexlayout-react";
import "./TabHeader.scss";

/**
 * Incident Sub Tab Header Component
 * @param {{
 *  node: TabNode
 *  itemId: string,
 *  name: string,
 * additionalData?:string,
 *  required?: boolean,
 *  count?: number,
 *  Icon?: Component,
 * altText:string, //mandatory in case of using 'Icon'
 *  isActive: boolean,
 *  isTempName: boolean,
 *  addChildAllowed?: boolean,
 *  hasAlertIcon?: boolean,
 *  draggable?: boolean,
 *  onTextChange?: Function,
 *  onAddClick?: Function
 *  onCloseClicked?: Function,
 *  iconClassName: String,
 *  alertIconTitle?: String,
 * }}
 */
const TabHeader = ({
  node,
  itemId = node?.getId(),
  name = node?.getName(),
  draggable = node?.isEnableDrag() &&
    !window.location.hash.includes(node.getPath()),
  enableFloat = false,
  enableClose = false,
  additionalData,
  required = false,
  count,
  Icon,
  altText,
  isActive = false,
  isTempName,
  addChildAllowed,
  hasAlertIcon = false,
  onTextChange,
  onAddClick,
  iconClassName,
  onCloseClicked,
  alertIconTitle,
}) => {
  const {t} = useLocalization({
    enStrings,
    arStrings,
    frStrings,
  });

  useEffect(() => {
    if (onTextChange) {
      onTextChange(name);
    }
  }, [name]);

  /**
   * Handle adding new child (subTab)
   * @param {MouseEvent} evt
   */
  const onAddChildClick = (evt) => {
    evt.stopPropagation();
    if (onAddClick) onAddClick();
  };

  const onFloat = (evt) => {
    node?.getModel().doAction(Actions.floatTab(node.getId()));
  };

  const onClose = (evt) => {
    onCloseClicked?.();
    node?.getModel().doAction(Actions.deleteTab(node.getId()));
  };

  const iconComponentClass = `tab-header__main-icon ${
    isActive ? "tab-header__main-icon--selected" : ""
  } ${iconClassName && iconClassName}`.trim();

  const buttonClass = "tab-header__button";
  const addBtnTitle = t("add") + " " + name;

  return (
    <div className="tab-header">
      {draggable && (
        <DraggingIcon
          className={
            "tab-header__dragging-icon" +
            (isActive ? " tab-header__dragging-icon--selected" : "")
          }
        />
      )}
      {Icon && (
        <TabIcon
          id={`tab-icon-${itemId}`}
          imgSrc={Icon}
          imgClassName={"tab-header__icon " + iconComponentClass}
          altText={altText}
        />
      )}
      <span>
        <span className={isTempName ? "tab-header__temp-name" : ""}>
          {name}
        </span>
        {additionalData && ` ${additionalData}`}
        {typeof count === "number" && ` (${count})`}
        {required && (
          <span title={t("mandatory")} className="tab-header__mandatory-icon">
            {" *"}
          </span>
        )}
      </span>
      {hasAlertIcon && (
        <AlertIcon
          title={alertIconTitle ? alertIconTitle : t("alert")}
          className="tab-header__alert-icon"
        />
      )}
      {addChildAllowed && (
        <Button
          id={`add-${name}-${itemId}`}
          title={addBtnTitle}
          altText={addBtnTitle}
          btnClassName={buttonClass}
          imgSrc={AddIcon}
          onClick={onAddChildClick}
        />
      )}
      {false && //FIXME: Currently handled by FlexLayout Actions
        enableFloat && (
          <Button
            id={`float-${itemId}`}
            title={t("float")}
            altText={t("float")}
            btnClassName={buttonClass}
            imgClassName={`${buttonClass}__float-icon`}
            imgSrc={FloatIcon}
            onClick={onFloat}
          />
        )}

      {false && //FIXME: Deprecated from FlexLayout v1.1.12
        enableClose && (
          <Button
            id={`close-${itemId}`}
            title={t("close")}
            altText={t("close")}
            btnClassName={buttonClass}
            imgClassName={`${buttonClass}__close-icon`}
            imgSrc={CloseIcon}
            onClick={onClose}
          />
        )}
    </div>
  );
};

/** PropTypes */
TabHeader.propTypes = {
  name: PropTypes.string,
  additionalData: PropTypes.string,
  altText: PropTypes.string,
  count: PropTypes.number,
  required: PropTypes.bool,
  iconClassName: PropTypes.string,
};

export default React.memo(TabHeader);
