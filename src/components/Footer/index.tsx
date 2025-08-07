import { GithubOutlined } from '@ant-design/icons';
import { DefaultFooter } from '@ant-design/pro-components';
import React from 'react';

const Footer: React.FC = () => {
  return (
    <DefaultFooter
      style={{
        background: 'none',
      }}
      copyright="Powered by Unfazed Eco"
      links={[
        {
          key: 'Unfazed Eco',
          title: 'Unfazed Eco',
          href: 'https://unfazed.eco',
          blankTarget: true,
        },
        {
          key: 'github',
          title: <GithubOutlined />,
          href: 'https://github.com/unfazed-eco/unfazed-admin',
          blankTarget: true,
        },
        {
          key: 'Unfazed Admin',
          title: 'Unfazed Admin',
          href: 'https://unfazed-eco.github.io/',
          blankTarget: true,
        },
      ]}
    />
  );
};

export default Footer;
