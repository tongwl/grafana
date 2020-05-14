import coreModule from 'app/core/core_module';
import config from 'app/core/config';
import _ from 'lodash';
import { NavModel } from '@grafana/ui';

export class NavModelSrv {
  navItems: any;

  /** @ngInject */
  constructor() {
    this.navItems = config.bootData.navTree;
  }

  getCfgNode() {
    return _.find(this.navItems, { id: 'cfg' });
  }

  getNav(...args) {
    let children = this.navItems;
    if (
      _.every(children, link => {
        return link.id !== 'license';
      })
    ) {
      //if top: push, else bottom: unshift
      children.unshift({
        children: [
          {
            icon: 'gicon gicon-apikeys',
            id: 'license-list',
            text: '授权管理',
            url: '/license/list',
          },
        ],
        hideFromMenu: true,
        icon: 'gicon gicon-apikeys',
        id: 'license',
        subTitle: '授权',
        text: '授权',
        url: '/license/list',
        legalLicense: true,
        licenseMessage: '',
      });
    }

    _.forEach(children, link => {
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

    const nav = {
      breadcrumbs: [],
    } as NavModel;

    for (const id of args) {
      // if its a number then it's the index to use for main
      if (_.isNumber(id)) {
        nav.main = nav.breadcrumbs[id];
        break;
      }

      const node: any = _.find(children, { id: id });
      nav.breadcrumbs.push(node);
      nav.node = node;
      nav.main = node;
      children = node.children;
    }

    if (nav.main.children) {
      for (const item of nav.main.children) {
        item.active = false;

        if (item.url === nav.node.url) {
          item.active = true;
        }
      }
    }

    return nav;
  }

  getNotFoundNav() {
    return getNotFoundNav(); // the exported function
  }
}

export function getNotFoundNav(): NavModel {
  return getWarningNav('Page not found', '404 Error');
}

export function getWarningNav(text: string, subTitle?: string): NavModel {
  const node = {
    text,
    subTitle,
    icon: 'fa fa-fw fa-warning',
  };
  return {
    breadcrumbs: [node],
    node: node,
    main: node,
  };
}

coreModule.service('navModelSrv', NavModelSrv);
