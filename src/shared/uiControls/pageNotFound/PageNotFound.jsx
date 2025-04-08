// L10N
import { useLocalization } from 'app/handlers/useLocalization';
import enStrings from './locale/pageNotFound.locale.en.json';
import arStrings from './locale/pageNotFound.locale.ar.json';
import frStrings from './locale/pageNotFound.locale.fr.json';
import { Result } from 'app/components/externalComponents';

import { ReactComponent as PageNotFoundIcon } from 'app/style/images/mg-page-not-found.svg';

import './PageNotFound.scss';

const PageNotFound = () => {
  const { t } = useLocalization({
    enStrings,
    arStrings,
    frStrings,
  });

  return (
    <Result
      className="page-not-found"
      title="404"
      icon={<PageNotFoundIcon />}
      subTitle={t('notFound')}
    />
  );
};

export default PageNotFound;
