// Libaries
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

// Utils & Services
import { AngularComponent, getAngularLoader } from 'app/core/services/AngularLoader';
import { appEvents } from 'app/core/app_events';
import { PlaylistSrv } from 'app/features/playlist/playlist_srv';

// Components
import { DashNavButton } from './DashNavButton';
import { DashNavTimeControls } from './DashNavTimeControls';
import { Tooltip } from '@grafana/ui';

// State
import { updateLocation } from 'app/core/actions';

// Types
import { DashboardModel } from '../../state';
import { StoreState } from 'app/types';

//Save as pdf
const html2canvas = require('html2canvas');
//const jsPDF = require('jsPDF');
import { saveAs } from 'file-saver';

export interface OwnProps {
  dashboard: DashboardModel;
  editview: string;
  isEditing: boolean;
  isFullscreen: boolean;
  $injector: any;
  updateLocation: typeof updateLocation;
  onAddPanel: () => void;
}

export interface StateProps {
  location: any;
}

type Props = StateProps & OwnProps;

interface State {
  showAll: boolean;
}

export class DashNav extends PureComponent<Props, State> {
  timePickerEl: HTMLElement;
  timepickerCmp: AngularComponent;
  playlistSrv: PlaylistSrv;
  serverRequest: any;

  constructor(props: Props) {
    super(props);
    this.playlistSrv = this.props.$injector.get('playlistSrv');
    this.state = {
      showAll: false,
    };
  }

  componentDidMount() {
    this.serverRequest = $.ajax({
      type: 'GET',
      dataType: 'json',
      url: 'public/setting.json?v=' + Math.random(),
      success: (result: any) => {
        this.setState({
          showAll: result.showAll,
        });
      },
    });

    const loader = getAngularLoader();
    const template =
      '<gf-time-picker class="gf-timepicker-nav" dashboard="dashboard" ng-if="!dashboard.timepicker.hidden" />';
    const scopeProps = { dashboard: this.props.dashboard };

    this.timepickerCmp = loader.load(this.timePickerEl, scopeProps, template);
  }

  componentWillUnmount() {
    this.serverRequest.abort();
    if (this.timepickerCmp) {
      this.timepickerCmp.destroy();
    }
  }

  onSaveAsPDF = () => {
    const { dashboard } = this.props;
    const pageContainer = $('.scroll-canvas--dashboard .dashboard-container .dashboard-container-inner');
    const outerWidth = pageContainer.outerWidth();
    const outerHeight = pageContainer.outerHeight();
    let pdfTitle = dashboard.title;
    if (pdfTitle === '' || pdfTitle === null || pdfTitle === undefined) {
      pdfTitle = Math.floor(Math.random() * 100000000000).toString();
    }

    html2canvas(pageContainer[0], {
      width: outerWidth,
      height: outerHeight,
      onclone: clone => {
        $(clone)
          .find('.scroll-canvas--dashboard .dashboard-container .dashboard-container-inner')
          .css('background-color', '#161719');
      },
    }).then(canvas => {
      canvas.toBlob(blob => {
        saveAs(blob, `${pdfTitle}.png`);
      }, 'image/png');
    });

    /*const pageContainer = $('.scroll-canvas--dashboard .dashboard-container .dashboard-container-inner');
    let pdfTitle = "test";
    if (pdfTitle === '' || pdfTitle === null || pdfTitle === undefined) {
      pdfTitle = Math.floor(Math.random() * 100000000000).toString();
    }

    html2canvas(pageContainer[0]).then(canvas => {
      // 要输出的 PDF 每页的宽高尺寸，单位是 pt
      const pageWidth = 592.28;  //841.89
      const pageHeight =  841.89; //592.28
      // 要打印内容，转换成 canvas 图片后的宽高尺寸
      const contentWidth =  canvas.width * 3 / 4;
      const contentHeight = canvas.height * 3 / 4;
      // 将要打印内容的图片，等比例缩放至宽度等于输出时 PDF 每页的宽度，此时的图片宽
      const imgWidth = pageWidth;
      // 将要打印内容的图片，等比例缩放至宽度等于输出时 PDF 每页的宽度，此时的图片高
      const imgHeight = pageWidth / contentWidth * contentHeight;
      // 起始内容截取位置
      let position = 0;
      // 剩余未打印内容的高度
      let leftHeight = imgHeight;
      // 获取打印内容 canvas 图片元素
      const pageData = canvas.toDataURL('image/jpeg', 1.0);
      // 初始化 pdf 容器，三个参数分别是：纸张方向(填'',则是横向)、打印单位、纸张尺寸
      const PDF = new jsPDF('', 'pt', 'a4');
      // 循环截取打印内容并添加进容器
      if (leftHeight < pageHeight) {
        PDF.addImage(pageData, 'JPEG', 0, 0, imgWidth, imgHeight);
      } else {
        while (leftHeight > 0) {
          PDF.addImage(pageData, 'JPEG', 0, position, imgWidth, imgHeight);
          leftHeight -= pageHeight;
          position -= pageHeight;
          if (leftHeight > 0) {
            PDF.addPage();
          }
        }
      }
      PDF.save(`${pdfTitle}.pdf`);
    });*/
  };

  onDahboardNameClick = () => {
    appEvents.emit('show-dash-search');
  };

  onFolderNameClick = () => {
    appEvents.emit('show-dash-search', {
      query: 'folder:current',
    });
  };

  onClose = () => {
    if (this.props.editview) {
      this.props.updateLocation({
        query: { editview: null },
        partial: true,
      });
    } else {
      this.props.updateLocation({
        query: { panelId: null, edit: null, fullscreen: null, tab: null },
        partial: true,
      });
    }
  };

  onToggleTVMode = () => {
    appEvents.emit('toggle-kiosk-mode');
  };

  onSave = () => {
    const { $injector } = this.props;
    const dashboardSrv = $injector.get('dashboardSrv');
    dashboardSrv.saveDashboard();
  };

  onOpenSettings = () => {
    this.props.updateLocation({
      query: { editview: 'settings' },
      partial: true,
    });
  };

  onStarDashboard = () => {
    const { dashboard, $injector } = this.props;
    const dashboardSrv = $injector.get('dashboardSrv');

    dashboardSrv.starDashboard(dashboard.id, dashboard.meta.isStarred).then(newState => {
      dashboard.meta.isStarred = newState;
      this.forceUpdate();
    });
  };

  onPlaylistPrev = () => {
    this.playlistSrv.prev();
  };

  onPlaylistNext = () => {
    this.playlistSrv.next();
  };

  onPlaylistStop = () => {
    this.playlistSrv.stop();
    this.forceUpdate();
  };

  onOpenShare = () => {
    const $rootScope = this.props.$injector.get('$rootScope');
    const modalScope = $rootScope.$new();
    modalScope.tabIndex = 0;
    modalScope.dashboard = this.props.dashboard;

    appEvents.emit('show-modal', {
      src: 'public/app/features/dashboard/components/ShareModal/template.html',
      scope: modalScope,
    });
  };

  renderDashboardTitleSearchButton() {
    const { dashboard } = this.props;

    const folderTitle = dashboard.meta.folderTitle;
    const haveFolder = dashboard.meta.folderId > 0;

    return (
      <>
        <div>
          <div className="navbar-page-btn">
            {!this.isInFullscreenOrSettings && <i className="gicon gicon-dashboard" />}
            {haveFolder && (
              <>
                <a className="navbar-page-btn__folder" onClick={this.onFolderNameClick}>
                  {folderTitle}
                </a>
                <i className="fa fa-chevron-right navbar-page-btn__folder-icon" />
              </>
            )}
            <a onClick={this.onDahboardNameClick}>
              {dashboard.title} <i className="fa fa-caret-down navbar-page-btn__search" />
            </a>
          </div>
        </div>
        {this.isSettings && <span className="navbar-settings-title">&nbsp;/ Settings</span>}
        <div className="navbar__spacer" />
      </>
    );
  }

  get isInFullscreenOrSettings() {
    return this.props.editview || this.props.isFullscreen;
  }

  get isSettings() {
    return this.props.editview;
  }

  renderBackButton() {
    return (
      <div className="navbar-edit">
        <Tooltip content="Go back (Esc)">
          <button className="navbar-edit__back-btn" onClick={this.onClose}>
            <i className="fa fa-arrow-left" />
          </button>
        </Tooltip>
      </div>
    );
  }

  render() {
    const { dashboard, onAddPanel, location } = this.props;
    const { canStar, canSave, canShare, showSettings, isStarred } = dashboard.meta;
    const { snapshot } = dashboard;
    const snapshotUrl = snapshot && snapshot.originalUrl;
    const { showAll } = this.state;
    return (
      <div className="navbar">
        {this.isInFullscreenOrSettings && this.renderBackButton()}
        {this.renderDashboardTitleSearchButton()}

        {this.playlistSrv.isPlaying && showAll && (
          <div className="navbar-buttons navbar-buttons--playlist">
            <DashNavButton
              tooltip="Go to previous dashboard"
              classSuffix="tight"
              icon="fa fa-step-backward"
              onClick={this.onPlaylistPrev}
            />
            <DashNavButton
              tooltip="Stop playlist"
              classSuffix="tight"
              icon="fa fa-stop"
              onClick={this.onPlaylistStop}
            />
            <DashNavButton
              tooltip="Go to next dashboard"
              classSuffix="tight"
              icon="fa fa-forward"
              onClick={this.onPlaylistNext}
            />
          </div>
        )}

        <div className="navbar-buttons navbar-buttons--actions">
          {
            <DashNavButton
              tooltip="导出图片"
              classSuffix="save-to-pdf"
              icon="fa fa-file-image-o"
              onClick={this.onSaveAsPDF}
            />
          }

          {canSave && showAll && (
            <DashNavButton
              tooltip="Add panel"
              classSuffix="add-panel"
              icon="gicon gicon-add-panel"
              onClick={onAddPanel}
            />
          )}

          {canStar && showAll && (
            <DashNavButton
              tooltip="Mark as favorite"
              classSuffix="star"
              icon={`${isStarred ? 'fa fa-star' : 'fa fa-star-o'}`}
              onClick={this.onStarDashboard}
            />
          )}

          {canShare && showAll && (
            <DashNavButton
              tooltip="Share dashboard"
              classSuffix="share"
              icon="fa fa-share-square-o"
              onClick={this.onOpenShare}
            />
          )}

          {canSave && showAll && (
            <DashNavButton tooltip="Save dashboard" classSuffix="save" icon="fa fa-save" onClick={this.onSave} />
          )}

          {snapshotUrl && showAll && (
            <DashNavButton
              tooltip="Open original dashboard"
              classSuffix="snapshot-origin"
              icon="gicon gicon-link"
              href={snapshotUrl}
            />
          )}

          {showSettings && showAll && (
            <DashNavButton
              tooltip="Dashboard settings"
              classSuffix="settings"
              icon="gicon gicon-cog"
              onClick={this.onOpenSettings}
            />
          )}
        </div>

        <div className="navbar-buttons navbar-buttons--tv">
          <DashNavButton
            tooltip="Cycle view mode"
            classSuffix="tv"
            icon="fa fa-desktop"
            onClick={this.onToggleTVMode}
          />
        </div>

        {!dashboard.timepicker.hidden && (
          <div className="navbar-buttons">
            <div className="gf-timepicker-nav" ref={element => (this.timePickerEl = element)} />
            <DashNavTimeControls dashboard={dashboard} location={location} updateLocation={updateLocation} />
          </div>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state: StoreState) => ({
  location: state.location,
});

const mapDispatchToProps = {
  updateLocation,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DashNav);
