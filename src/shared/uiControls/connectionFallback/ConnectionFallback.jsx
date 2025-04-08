import { useLocalization } from 'app/handlers/useLocalization';
import { useResponsiveConfig } from 'app/handlers/useResponsiveConfig';
import { authIsOnlineSelector } from 'app/redux/auth/authSelector';
import React from 'react';
import { useSelector } from 'react-redux';
import Skeleton from '../skeleton/Skeleton';
import enStrings from './locale/connectionFallback.locale.en.json';
import arStrings from './locale/connectionFallback.locale.ar.json';
import frStrings from './locale/connectionFallback.locale.fr.json';
import './ConnectionFallback.scss';

const ConnectionFallback = ({ children }) => {
  const isConnected = useSelector(authIsOnlineSelector);

  const { width, targetRef } = useResponsiveConfig({ breakPoints: [] });

  const { t } = useLocalization({
    enStrings,
    arStrings,
    frStrings,
  });

  if (isConnected) return <>{children}</>;

  return (
    <div className="connection-fallback" ref={targetRef}>
      <h1 className="connection-fallback__text">
        {width > 25 ? t('connectionError') : '!'}
      </h1>
      <div className="connection-fallback__skeleton">
        <Skeleton type="square" width="90%" height="80%" />
      </div>
    </div>
  );
};

export default ConnectionFallback;
