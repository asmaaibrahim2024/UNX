import React from "react";
import { Empty } from "app/components/externalComponents";
import "./EmptyPlaceholder.scss";

import { useLocalization } from "app/handlers/useLocalization";
import enStrings from "./locale/emptyPlaceholder.locale.en.json";
import arStrings from "./locale/emptyPlaceholder.locale.ar.json";
import frStrings from "./locale/emptyPlaceholder.locale.fr.json";

/**
 * Empty state placeholder using Ant Design
 * {@link https://ant.design/components/empty/ Empty state placeholder Ant Design}
 */
const EmptyPlaceholder = ({ emptyImage, ...restProps }) => {
  const { t } = useLocalization({
    enStrings,
    arStrings,
    frStrings,
  });

  return (
    <Empty
      className="emptyPlaceholder"
      description={<span>{t("description")}</span>}
      {...restProps}
    />
  );
};

EmptyPlaceholder.propTypes = {};

EmptyPlaceholder.defaultProps = {};

export default React.memo(EmptyPlaceholder);
