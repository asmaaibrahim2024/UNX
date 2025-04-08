import React, { Component } from 'react';

import './ErrorBoundary.scss';
import { localizationHOC } from 'app/handlers/localizationHOC';

import { ReactComponent as ErrorIcon } from 'app/style/images/mg-somethingWrong.svg';

import enStrings from './locale/errorBoundary.locale.en.json';
import arStrings from './locale/errorBoundary.locale.ar.json';
import frStrings from './locale/errorBoundary.locale.fr.json';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  componentDidCatch(error, errorInfo) {
    console.log(error, errorInfo);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error.message };
  }

  static defaultProps = {
    fallback: ({ errorMessage, t }) => {
      return (
        <div className="error-boundary__msg">
          <ErrorIcon className="error-boundary__icon" />
          <h1>{t('somethingWentWrong')}</h1>
        </div>
      );
    },
  };

  render() {
    if (this.state.hasError) {
      return (
        <></>
      );
    }

    return this.props.children;
  }
}

export default localizationHOC(ErrorBoundary, {
  enStrings,
  arStrings,
  frStrings,
});
