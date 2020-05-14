import React, { Component } from 'react';
import _ from 'lodash';
import TopSectionItem from './TopSectionItem';
import config from '../../config';

class TopSection extends Component {
  settingsRequest: any;
  state = {
    showAll: false,
    legalLicense: true,
    licenseMessage: '',
  };
  render() {
    const navTree = _.cloneDeep(config.bootData.navTree);
    //const mainLinks = _.filter(navTree, item => !item.hideFromMenu);
    const mainLinks = _.filter(navTree, item => !item.hideFromMenu && item.id !== 'explore');

    //remove item
    if (!this.state.showAll) {
      _.remove(mainLinks, link => {
        return (
          link.id === 'create' ||
          link.id === 'dashboards' ||
          link.id === 'alerting' ||
          link.id === 'cfg' ||
          link.id === 'admin'
        );
      });
    }

    //translate
    _.forEach(mainLinks, link => {
      switch (link.id) {
        // case "explore":
        //   break;
        case 'create':
          link.text = '创建';
          _.forEach(link.children, child => {
            switch (child.id) {
              case 'folder':
                child.text = '文件夹'; //Folder
                break;
              case 'import':
                child.text = '导入'; //Import
                break;
            }
            if (child.text === 'Dashboard') {
              child.text = '面板'; //Dashboard
            }
          });
          break;
        case 'dashboards':
          link.text = '面板'; //Dashboards
          _.forEach(link.children, child => {
            switch (child.id) {
              case 'home':
                child.text = '主页'; //Home
                break;
              case 'divider':
                child.text = '分频器'; //???Divider
                break;
              case 'manage-dashboards':
                child.text = '管理'; //Manage
                break;
              case 'playlists':
                child.text = '播放列表'; //???Playlists
                break;
              case 'snapshots':
                child.text = '快照'; //Snapshots
                break;
            }
          });
          break;
        case 'profile':
          link.text = '管理员'; //admin
          _.forEach(link.children, child => {
            switch (child.id) {
              case 'profile-settings':
                child.text = '首选项'; //Preferences
                break;
              case 'change-password':
                child.text = '修改密码'; //Change Password
                break;
              case 'sign-out':
                child.text = '退出'; //Sign out
                break;
            }
          });
          break;
        case 'alerting':
          link.text = '告警'; //Alerting
          _.forEach(link.children, child => {
            switch (child.id) {
              case 'alert-list':
                child.text = '告警规则'; //Alert Rules
                break;
              case 'channels':
                child.text = '通知频道'; //Notification channels
                break;
            }
          });
          break;
        case 'cfg':
          link.text = '配置'; //Configuration
          _.forEach(link.children, child => {
            switch (child.id) {
              case 'datasources':
                child.text = '数据源'; //Data Sources
                break;
              case 'users':
                child.text = '用户'; //Users
                break;
              case 'teams':
                child.text = '团队'; //Teams
                break;
              case 'plugins':
                child.text = '插件'; //Plugins
                break;
              case 'org-settings':
                child.text = '首选项'; //Preferences
                break;
              case 'apikeys':
                child.text = 'API关键字'; //API Keys
                break;
            }
          });
          break;
        case 'admin':
          link.text = '服务器管理员'; //Server Admin
          _.forEach(link.children, child => {
            switch (child.id) {
              case 'global-users':
                child.text = '用户'; //Users
                break;
              case 'global-orgs':
                child.text = '组织'; //Orgs
                break;
              case 'server-settings':
                child.text = '设置'; //Settings
                break;
              case 'server-stats':
                child.text = '统计'; //Stats
                break;
            }
          });
          break;
        case 'help':
          link.text = '帮助'; //Help
          link.subTitle = '';
          _.forEach(link.children, child => {
            switch (child.text) {
              case 'Keyboard shortcuts':
                child.text = '快捷键';
            }
          });
          break;
      }
    });

    return (
      <div className="sidemenu__top">
        {mainLinks.map((link, index) => {
          return <TopSectionItem link={link} key={`${link.id}-${index}`} />;
        })}
      </div>
    );
  }

  showButtons() {
    this.settingsRequest = $.ajax({
      type: 'GET',
      dataType: 'json',
      url: 'public/setting.json?v=' + Math.random(),
      success: (result: any) => {
        this.setState({
          showAll: result.showAll,
        });
      },
    });
  }

  componentDidMount() {
    this.showButtons();
  }

  componentWillUnmount() {
    this.settingsRequest.abort();
  }
}

export default TopSection;
