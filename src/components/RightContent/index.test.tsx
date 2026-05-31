import { render, screen } from '@testing-library/react';
import { SelectLang } from './index';

const React = require('react');
void React.version;

const mockLocales = [
  { lang: 'en-US', label: 'English' },
  { lang: 'zh-CN', label: '简体中文' },
  { lang: 'ja-JP', label: '日本語' },
];

jest.mock('@umijs/max', () => ({
  SelectLang: ({ postLocalesData }: any) => {
    const React = require('react');
    const locales = postLocalesData
      ? postLocalesData(mockLocales)
      : mockLocales;

    return React.createElement(
      'div',
      { 'data-testid': 'umi-lang' },
      locales.map((locale: any) => locale.lang).join(','),
    );
  },
}));

describe('RightContent SelectLang', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps default locale list when EXTRA.LANGUAGE is missing', () => {
    render(<SelectLang />);

    expect(screen.getByTestId('umi-lang').textContent).toBe(
      'en-US,zh-CN,ja-JP',
    );
  });

  it('filters locale list by EXTRA.LANGUAGE values', () => {
    localStorage.setItem(
      'unfazed_app_settings',
      JSON.stringify({ extra: { LANGUAGE: ['zh-CN', 'ja-JP'] } }),
    );

    render(<SelectLang />);

    expect(screen.getByTestId('umi-lang').textContent).toBe('zh-CN,ja-JP');
  });

  it('hides language selector when only one language is allowed', () => {
    localStorage.setItem(
      'unfazed_app_settings',
      JSON.stringify({ extra: { LANGUAGE: ['en-US'] } }),
    );

    render(<SelectLang />);

    expect(screen.queryByTestId('umi-lang')).toBeNull();
  });

  it('supports multiple locale values together', () => {
    localStorage.setItem(
      'unfazed_app_settings',
      JSON.stringify({ extra: { LANGUAGE: ['en-US', 'zh-CN'] } }),
    );

    render(<SelectLang />);

    expect(screen.getByTestId('umi-lang').textContent).toBe('en-US,zh-CN');
  });
});
