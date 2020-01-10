// Libraries
import React, { Component } from 'react';
import config from 'app/core/config';
import { getTitleFromNavModel } from 'app/core/selectors/navModel';

// Components
import PageHeader from '../PageHeader/PageHeader';
import Footer from '../Footer/Footer';
import PageContents from './PageContents';
import { CustomScrollbar, NavModel } from '@grafana/ui';
import { isEqual } from 'lodash';

interface Props {
  children: JSX.Element[] | JSX.Element;
  navModel: NavModel;
}

class Page extends Component<Props> {
  static Header = PageHeader;
  static Contents = PageContents;

  componentDidMount() {
    this.updateTitle();
  }

  componentDidUpdate(prevProps: Props) {
    if (!isEqual(prevProps.navModel, this.props.navModel)) {
      this.updateTitle();
    }
  }

  updateTitle = () => {
    let title = this.getPageTitle;
    title =
      title === 'Alerting: Alert Rules'
        ? '告警规则'
        : title === 'Configuration: Data Sources'
        ? '配置: 数据源'
        : title === 'Configuration: Users'
        ? '配置: 用户'
        : title === 'Configuration: Teams'
        ? '配置: 团队'
        : title === 'Configuration: Plugins'
        ? '配置: 插件'
        : title === 'Configuration: Preferences'
        ? '配置: 首选项'
        : title === 'Configuration: API Keys'
        ? '配置: API关键字'
        : title === 'Server Admin: Settings'
        ? '服务器管理员: 设置'
        : title === 'Server Admin: Stats'
        ? '服务器管理员: 统计'
        : title;
    document.title = title ? title + ' - ElasticStor 存储管理系统' : 'ElasticStor 存储管理系统';
  };

  get getPageTitle() {
    const { navModel } = this.props;
    if (navModel) {
      return getTitleFromNavModel(navModel) || undefined;
    }
    return undefined;
  }

  render() {
    const { navModel } = this.props;
    const { buildInfo } = config;
    return (
      <div className="page-scrollbar-wrapper">
        <CustomScrollbar autoHeightMin={'100%'} className="custom-scrollbar--page">
          <div className="page-scrollbar-content">
            <PageHeader model={navModel} />
            {this.props.children}
            <Footer
              appName="Grafana"
              buildCommit={buildInfo.commit}
              buildVersion={buildInfo.version}
              newGrafanaVersion={buildInfo.latestVersion}
              newGrafanaVersionExists={buildInfo.hasUpdate}
            />
          </div>
        </CustomScrollbar>
      </div>
    );
  }
}

export default Page;
