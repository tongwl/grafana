import React, { PureComponent } from 'react';
import appEvents from '../../app_events';
import TopSection from './TopSection';
import BottomSection from './BottomSection';
import config from 'app/core/config';

const homeUrl = config.appSubUrl || '/';

export class SideMenu extends PureComponent {
  toggleSideMenuSmallBreakpoint = () => {
    appEvents.emit('toggle-sidemenu-mobile');
  };

  render() {
    return [
      <a href={homeUrl} className="sidemenu__logo" key="logo" title="辰栖科技">
        <img src="public/img/cx/cx_logo.svg" alt="辰栖科技" />
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
