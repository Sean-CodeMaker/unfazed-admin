import { history, useIntl } from '@umijs/max';
import { Button, Card, Result } from 'antd';
import React from 'react';
import { PATH_PREFIX } from '../../config/constants';

const NoFoundPage: React.FC = () => (
  <Card variant="borderless">
    <Result
      status="404"
      title="404"
      subTitle={useIntl().formatMessage({ id: 'pages.404.subTitle' })}
      extra={
        <Button type="primary" onClick={() => history.push(`/${PATH_PREFIX}/`)}>
          {useIntl().formatMessage({ id: 'pages.404.buttonText' })}
        </Button>
      }
    />
  </Card>
);

export default NoFoundPage;
