import React, { PureComponent } from 'react';

import { FormLabel, Select } from '@grafana/ui';
import { getBackendSrv, BackendSrv } from 'app/core/services/backend_srv';

import { DashboardSearchHit, DashboardSearchHitType } from 'app/types';

export interface Props {
  resourceUri: string;
}

export interface State {
  homeDashboardId: number;
  theme: string;
  timezone: string;
  dashboards: DashboardSearchHit[];
}

const themes = [{ value: '', label: '默认' }, { value: 'dark', label: '黑色' }, { value: 'light', label: '亮色' }];

const timezones = [
  { value: '', label: '默认' },
  { value: 'browser', label: '本地时间' },
  { value: 'utc', label: 'UTC' },
];

export class SharedPreferences extends PureComponent<Props, State> {
  backendSrv: BackendSrv = getBackendSrv();

  constructor(props) {
    super(props);

    this.state = {
      homeDashboardId: 0,
      theme: '',
      timezone: '',
      dashboards: [],
    };
  }

  async componentDidMount() {
    const prefs = await this.backendSrv.get(`/api/${this.props.resourceUri}/preferences`);
    const dashboards = await this.backendSrv.search({ starred: true });
    const defaultDashboardHit: DashboardSearchHit = {
      id: 0,
      title: '默认',
      tags: [],
      type: '' as DashboardSearchHitType,
      uid: '',
      uri: '',
      url: '',
      folderId: 0,
      folderTitle: '',
      folderUid: '',
      folderUrl: '',
      isStarred: false,
      slug: '',
    };

    if (prefs.homeDashboardId > 0 && !dashboards.find(d => d.id === prefs.homeDashboardId)) {
      const missing = await this.backendSrv.search({ dashboardIds: [prefs.homeDashboardId] });
      if (missing && missing.length > 0) {
        dashboards.push(missing[0]);
      }
    }

    this.setState({
      homeDashboardId: prefs.homeDashboardId,
      theme: prefs.theme,
      timezone: prefs.timezone,
      dashboards: [defaultDashboardHit, ...dashboards],
    });
  }

  onSubmitForm = async event => {
    event.preventDefault();

    const { homeDashboardId, theme, timezone } = this.state;

    await this.backendSrv.put(`/api/${this.props.resourceUri}/preferences`, {
      homeDashboardId,
      theme,
      timezone,
    });
    window.location.reload();
  };

  onThemeChanged = (theme: string) => {
    this.setState({ theme });
  };

  onTimeZoneChanged = (timezone: string) => {
    this.setState({ timezone });
  };

  onHomeDashboardChanged = (dashboardId: number) => {
    this.setState({ homeDashboardId: dashboardId });
  };

  render() {
    const { theme, timezone, homeDashboardId, dashboards } = this.state;

    return (
      <form className="section gf-form-group" onSubmit={this.onSubmitForm}>
        <h3 className="page-heading">首选项</h3>
        <div className="gf-form">
          <span className="gf-form-label width-11">界面风格</span>
          <Select
            isSearchable={false}
            value={themes.find(item => item.value === theme)}
            options={themes}
            onChange={theme => this.onThemeChanged(theme.value)}
            width={20}
          />
        </div>
        <div className="gf-form">
          <FormLabel width={11} tooltip="找不到想要的面板？在您想要设置的面板界面加注星标后即可在本处设置。">
            主页面板
          </FormLabel>
          <Select
            value={dashboards.find(dashboard => dashboard.id === homeDashboardId)}
            getOptionValue={i => i.id}
            getOptionLabel={i => i.title}
            onChange={(dashboard: DashboardSearchHit) => this.onHomeDashboardChanged(dashboard.id)}
            options={dashboards}
            placeholder="选择默认面板"
            width={20}
          />
        </div>
        <div className="gf-form">
          <label className="gf-form-label width-11">时区</label>
          <Select
            isSearchable={false}
            value={timezones.find(item => item.value === timezone)}
            onChange={timezone => this.onTimeZoneChanged(timezone.value)}
            options={timezones}
            width={20}
          />
        </div>
        <div className="gf-form-button-row">
          <button type="submit" className="btn btn-primary">
            保存
          </button>
        </div>
      </form>
    );
  }
}

export default SharedPreferences;
