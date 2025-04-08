import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'app/components/externalComponents';
import { Icon } from 'app/components/mgComponents';
import { Tooltip } from "app/components/mgComponents";

import './Button.scss';

/**
 * Common button component to handle buttons in case of:
 * (text btn, text with icon, icon btn) with or without indicator (which could be number or icon)
 * using Icon Common component (for Icon & its indicator)
 *
 * @param {String} id: button id
 * @param {String} title: button title
 * @param {String} shape: button shape (circle | round)
 * @param {Boolean} block: property will make the button fit to its parent width.
 * @param {Function} onClick: handle onClick btn
 * @param {Function} onIndicatorClick: handle onClick btn's indicator
 * @param {String} btnClassName: Styles class name
 * @param {String} imgClassName: Styles class name
 * @param {String} txtClassName: Styles class name
 * @param {String} indicatorClassName: Styles class name
 * @param {string || object} imgSrc: imported image to be displayed as button's icon; you can make usual import as: import logo from './logo.png' or import ReactComponent as: import { ReactComponent as Logo } from './logo.svg';
 * @param {String} altText: altText for the imported image
 * @param {Boolean} isDisabled: if btn is disabled
 * @param {Boolean} isLoading: if indicator number is loading >> show loading indicator
 * @param {String} indicatorIconAltText: alt text for icon indicator
 * @param {String} indicatorIconTitle: title for icon indicator
 * @param {string || object} indicatorIcon: imported image to be displayed as indicator's icon; import ReactComponent as: import { ReactComponent as Logo } from './logo.svg';
 * @param {Number} indicatorNum: indicator number to be previewed
 * @param {boolean} hasError : to show error indicator
 * @param {children} children: Button children like its content text
 * @param {string} borderColor : to enable border
 * @param {string} props.appIconClassName: Styles app icon class name
 */
const AppButton = forwardRef(
    (
        {
            id,
            title,
            onClick,
            onIndicatorClick,
            mouseHandler,
            btnClassName,
            imgClassName,
            txtClassName,
            imgSrc,
            altText,
            isDisabled,
            indicatorNum,
            indicatorIcon,
            indicatorIconAltText,
            indicatorIconTitle,
            indicatorClassName,
            shape,
            block,
            children,
            htmlType,
            isLoading,
            hasError,
            borderColor,
            mirrorInRtl,
            appIconClassName,
            placement,
            ...restProps
        },
        ref
    ) => {
        //render button icon (with ir without indicator)
        const icon = () => {
            return (
                <Icon
                    imgSrc={imgSrc}
                    altText={altText}
                    imgClassName={imgClassName}
                    id={id}
                    indicatorNum={indicatorNum}
                    indicatorClassName={indicatorClassName}
                    isLoading={imgSrc && isLoading ? true : false}
                    indicatorIcon={indicatorIcon}
                    indicatorIconAltText={indicatorIconAltText}
                    indicatorIconTitle={indicatorIconTitle}
                    onIndicatorClick={onIndicatorClick}
                    hasError={hasError}
                    mirrorInRtl={mirrorInRtl}
                    appIconClassName={appIconClassName}
                />
            );
        };

        return (
            <Tooltip title={title} placement={placement}>
                <Button
                    onClick={onClick}
                    onMouseDown={mouseHandler}
                    id={id}
                    disabled={isDisabled || (imgSrc && isLoading)}
                    loading={!imgSrc && isLoading ? true : false}
                    icon={imgSrc ? icon() : ''}
                    htmlType={htmlType}
                    shape={shape}
                    block={block}
                    ref={ref}
                    {...restProps}
                    className={`${btnClassName} ${restProps.className ? restProps.className : ''
                        }`}
                    style={{
                        borderColor: borderColor ? borderColor : '',
                        ...restProps.style,
                    }}
                // TODO: rename btnClassName to className to avoid override
                >
                    {children && (
                        <span id={`${id}_txt`} className={`btn__text ${txtClassName}`}>
                            {children}
                        </span>
                    )}
                </Button>
            </Tooltip>
        );
    }
);

AppButton.propTypes = {
    id: PropTypes.string,
    title: PropTypes.string,
    onClick: PropTypes.func,
    onIndicatorClick: PropTypes.func,
    btnClassName: PropTypes.string,
    imgClassName: PropTypes.string,
    txtClassName: PropTypes.string,
    imgSrc: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    altText: PropTypes.string,
    isDisabled: PropTypes.bool,
    isLoading: PropTypes.bool,
    indicatorIconTitle: PropTypes.string,
    indicatorIcon: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    indicatorIconAltText: PropTypes.string,
    indicatorNum: PropTypes.number,
    indicatorClassName: PropTypes.string,
    shape: PropTypes.string,
    block: PropTypes.bool,
    hasError: PropTypes.bool,
    borderColor: PropTypes.string,
    appIconClassName: PropTypes.string
};

AppButton.defaultProps = {
    id: '',
    btnClassName: '',
    imgClassName: '',
    txtClassName: '',
    indicatorClassName: '',
    appIconClassName: ''
};

export default React.memo(AppButton);
