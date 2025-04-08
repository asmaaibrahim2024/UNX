import { useEffect } from 'react';
import { addProxyRules } from './esriMapHandler';

//Add proxy rules from config
export const useEsriProxy = (config) => {
    useEffect(() => {
        if (config?.httpProxy?.useProxy) {
            if (config.httpProxy.rules) {
                addProxyRules(config.httpProxy.rules);
            }
        }
    }, [config]);
};
