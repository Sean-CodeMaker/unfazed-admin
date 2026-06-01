import { SelectLang as UmiSelectLang } from '@umijs/max';
import React from 'react';
import { getExtraSettings } from '@/utils/settings';

export type SiderTheme = 'light' | 'dark';

export const SelectLang: React.FC<{ languages?: string[] }> = ({
  languages: languagesProp,
}) => {
  const languages = languagesProp ?? getExtraSettings().LANGUAGE;
  const allowedLocales =
    Array.isArray(languages) && languages.length > 0
      ? new Set(
          languages.filter(
            (language): language is string => typeof language === 'string',
          ),
        )
      : undefined;
  const postLocalesData = allowedLocales
    ? (locales: { lang: string }[]) =>
        locales.filter((locale) => allowedLocales.has(locale.lang))
    : undefined;

  if (allowedLocales && allowedLocales.size <= 1) {
    return null;
  }

  return (
    <UmiSelectLang
      postLocalesData={postLocalesData}
      style={{
        padding: 4,
      }}
    />
  );
};
