import React from 'react';
import _ from 'lodash';
import SignIn from './SignIn';
import BottomNavLinks from './BottomNavLinks';
import { contextSrv } from 'app/core/services/context_srv';
import config from '../../config';

export default function BottomSection() {
  const navTree: any = _.cloneDeep(config.bootData.navTree);
  const bottomNav: any = _.filter(navTree, item => item.hideFromMenu);
  const isSignedIn = contextSrv.isSignedIn;
  const user = contextSrv.user;

  if (user && user.orgCount > 1) {
    const profileNode: any = _.find(bottomNav, { id: 'profile' });
    if (profileNode) {
      profileNode.showOrgSwitcher = true;
    }
  }
  _.some(bottomNav, link => {
    if (link.id === 'help') {
      _.remove(link.children, (child: any) => {
        switch (child.text) {
          case 'Community site':
          case 'Documentation':
            return true;
          default:
            return false;
        }
      });
      return true;
    }
    return false;
  });

  _.forEach(bottomNav, link => {
    switch (link.id) {
      case 'explore':
        break;
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
        link.subTitle = '辰栖科技';
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
    <div className="sidemenu__bottom">
      {!isSignedIn && <SignIn />}
      {bottomNav.map((link, index) => {
        return <BottomNavLinks link={link} user={user} key={`${link.url}-${index}`} />;
      })}
    </div>
  );
}
