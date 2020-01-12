import React, { PureComponent } from 'react';
import appEvents from '../../app_events';
import TopSection from './TopSection';
import BottomSection from './BottomSection';
import config from 'app/core/config';

export class SideMenu extends PureComponent {
  licenseRequest: any;
  state = {
    homeUrl: config.appSubUrl || '/',
  };

  toggleSideMenuSmallBreakpoint = () => {
    appEvents.emit('toggle-sidemenu-mobile');
  };

  componentDidMount() {
    this.licenseRequest = $.ajax({
      type: 'GET',
      dataType: 'json',
      url: '/license/information',
      success: (license: any) => {
        if (license && license['授权状态'] !== '授权信息正常') {
          this.setState({
            homeUrl: 'license/list',
          });
        }
      },
      error: () => {},
    });
  }

  componentWillUnmount() {
    this.licenseRequest.abort();
  }

  render() {
    return [
      <a href={this.state.homeUrl} className="sidemenu__logo" key="logo" title="ElasticStor 存储管理系统">
        <img src="public/img/cx/cx_logo.svg" alt="ElasticStor 存储管理系统" />
      </a>,
      <div className="sidemenu__logo_small_breakpoint" onClick={this.toggleSideMenuSmallBreakpoint} key="hamburger">
        <i className="fa fa-bars" />
        <span className="sidemenu__close">
          <i className="fa fa-times" />
          &nbsp;Close
        </span>
      </div>,
      <TopSection key="topsection" />,
      <BottomSection key="bottomsection" />,
    ];
  }
}
