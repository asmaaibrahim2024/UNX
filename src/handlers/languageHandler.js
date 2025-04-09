import { useEffect } from 'react';

/**
 * @param {object} props
 * @param {string} props.lang: Set Lang of page
 * @param {string} props.dir: Set Page direction
 */
export const useHeaderLanguage = ({ lang, dir }) => {
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => {
    document.documentElement.dir = dir;
  }, [dir]);
};