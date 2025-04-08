import React, { useState, useEffect } from 'react';
import './Icon.scss';
import PropTypes from 'prop-types';
import error from 'app/style/images/mg-error.png';
import brokenImage from 'app/style/images/mg-broken-image.svg';
import indicatorLoadingIcon from 'app/style/images/mg-loader.gif';
import { useLocalization } from "app/handlers/useLocalization";
import enStrings from './locale/icon.locale.en.json';
import arStrings from './locale/icon.locale.ar.json';
import frStrings from './locale/icon.locale.fr.json';
/**
 * Common Icon component to handle icons with or without indicator (which could be number or icon)
 * @param {object} props
 * @param {string} props.id: icon id
 * @param {string} props.imgClassName: Styles class name
 * @param {string} props.indicatorClassName: Styles class name
 * @param {string || object} props.imgSrc: imported image to be displayed as button's icon; you can make usual import as: import logo from './logo.png' or import ReactComponent as: import { ReactComponent as Logo } from './logo.svg';
 * @param {string} props.altText: altText for the imported icon
 * @param {number} props.indicatorNum: indicator number to be previewed
 * @param {string} props.indicatorIconAltText: alt text for icon indicator
 * @param {string} props.emptyIcon: icon displayed if the imgSrc is empty
 * @param {boolean} props.isLoading: if indicator number is loading >> show loading indicator
 * @param {boolean} props.hasError: show error indicator
 * @param {string || object} props.indicatorIcon: imported image to be displayed as indicator's icon; import ReactComponent as: import { ReactComponent as Logo } from './logo.svg';
 * @param {string} props.appIconClassName: Styles app icon class name
 * 
 */
const AppIcon = ({
    id,
    imgClassName,
    imgSrc,
    altText,
    indicatorNum,
    indicatorClassName,
    indicatorIcon,
    indicatorIconAltText,
    emptyIcon,
    isLoading,
    hasError,
    mirrorInRtl,
    tooltip,
    appIconClassName,
    ...restProps
}) => {
    const { t } = useLocalization({
        enStrings,
        arStrings,
        frStrings,
    });

    const [isBroken, setIsBroken] = useState(false);

    const onError = () => {
        setIsBroken(true);
    };

    useEffect(() => {
        setIsBroken(false);
    }, [imgSrc]);

    //render Icon in both cases string/object
    const renderIcon = () => {
        if (typeof imgSrc === 'string') {
            return (
                <img
                    id={`${id}_icon`}
                    src={imgSrc}
                    alt={altText}
                    className={`${mirrorInRtl ? 'app-icon__icon' : ''} ${imgClassName}`}
                    onError={onError}
                    {...restProps}
                />
            );
        } else if (typeof imgSrc === 'object') {
            const SvgIcon = imgSrc;
            return (
                <SvgIcon
                    id={`${id}_icon`}
                    alt={altText}
                    className={`${mirrorInRtl ? 'app-icon__icon' : ''} ${imgClassName}`}
                    title={tooltip}
                    {...restProps}
                />
            );
        }
    };

    //render indicator (have numbers)
    const renderIndicatorNumber = () => {
        return (
            <span
                id={`${id}_indicator`}
                className={`app-icon__indicator ${indicatorClassName}`}
            >
                {indicatorNum > 99 ? (
                    <span>
                        <span className="plusSign">{'+'}</span>
                        {'99'}
                    </span>
                ) : (
                    indicatorNum
                )}
            </span>
        );
    };

    //render indicator icon
    const renderIndicatorIcon = () => {
        //loading indicator
        if (isLoading) {
            return (
                <img
                    id={`${id}_indicator_loading_icon`}
                    src={indicatorLoadingIcon}
                    alt={t('loading')}
                    className={`app-icon__indicator-icon ${indicatorClassName}`}
                />
            );
        }
        //error indicator
        else if (hasError) {
            return (
                <img
                    id={`${id}_indicator_error_icon`}
                    src={error}
                    alt={t('error')}
                    className={`app-icon__indicator-icon ${indicatorClassName}`}
                />
            );
        } else if (typeof indicatorIcon === 'string') {
            return (
                <img
                    id={`${id}_indicator_icon`}
                    src={indicatorIcon}
                    alt={indicatorIconAltText}
                    className={`app-icon__indicator-icon ${indicatorClassName}`}
                />
            );
        } else if (typeof indicatorIcon === 'object') {
            const IndicatorSvgIcon = indicatorIcon;
            return (
                <IndicatorSvgIcon
                    id={`${id}_indicator_icon`}
                    alt={indicatorIconAltText}
                    className={`app-icon__indicator-icon ${indicatorClassName}`}
                />
            );
        }
    };

    const renderIndicator = () => {
        if (hasError || isLoading || indicatorIcon) {
            return renderIndicatorIcon();
        } else if (typeof indicatorNum === 'number') {
            return renderIndicatorNumber();
        }
    };

    return (
        <div className={`app-icon ${appIconClassName}`}>
            {imgSrc ? renderIcon() : emptyIcon}
            {renderIndicator()}
        </div>
    );
};

AppIcon.propTypes = {
    id: PropTypes.string,
    imgClassName: PropTypes.string,
    imgSrc: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    altText: PropTypes.string,
    indicatorNum: PropTypes.number,
    indicatorClassName: PropTypes.string,
    indicatorIcon: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    isLoading: PropTypes.bool,
    hasError: PropTypes.bool,
    indicatorIconAltText: PropTypes.string,
    appIconClassName: PropTypes.string
};

export default React.memo(AppIcon);
