import { saveAs } from 'file-saver';
import angular from 'angular';
import moment from 'moment';
export default class LicenseCtrl {
  navModel: any;
  isLoading = true;
  isLegalLicenseInfo: any = {
    showAlert: false,
    alertMessage: null,
    loadLicenseFail: false,
    parseLicenseFail: false,
    licenseExpired: false,
    installedClusterMismatch: false,
    clusterSizeMismatch: false,
    serverAPIError: false,
  };
  licenseInfo: any = {
    company: null,
    installedID: null,
    actualID: null,
    actualScale: null,
    licenseDays: null,
    licenseKey: null,
    activeTime: null,
    systemTime: null,
    clusterSize: null,
  };
  /** @ngInject */
  constructor(private backendSrv, navModelSrv) {
    this.navModel = navModelSrv.getNav('license', 'license-list', 0);
    this.isLegalLicense();
    this.getLicenseInfo();
  }

  isLegalLicense() {
    this.backendSrv.get('/license/information').then(
      license => {
        this.initIsLegalLicenseInfo();
        if (license) {
          if (license['授权状态'] === '授权信息正常') {
            this.isLegalLicenseInfo.showAlert = false;
          } else {
            this.isLegalLicenseInfo.showAlert = true;
            switch (license['授权状态']) {
              case '加载授权信息失败':
                this.isLegalLicenseInfo.alertMessage = `很抱歉，${license['授权状态']}，请联系管理员！`;
                this.isLegalLicenseInfo.loadLicenseFail = true;
                break;
              case '授权信息解析失败':
                this.isLegalLicenseInfo.alertMessage = `很抱歉，解析授权信息失败，请联系管理员！`;
                this.isLegalLicenseInfo.parseLicenseFail = true;
                break;
              case '授权信息过期':
                this.isLegalLicenseInfo.alertMessage = `很抱歉，您当前的授权信息已过期，请联系管理员！`;
                this.isLegalLicenseInfo.licenseExpired = true;
                break;
              case '安装集群不符':
                this.isLegalLicenseInfo.alertMessage = `很抱歉，您所安装的集群和授权集群不符，请检查！`;
                this.isLegalLicenseInfo.installedClusterMismatch = true;
                break;
              case '集群规模不符':
                this.isLegalLicenseInfo.alertMessage = `很抱歉，您所安装的集群规模和授权规模不符，请检查！`;
                this.isLegalLicenseInfo.clusterSizeMismatch = true;
                break;
            }
          }
        } else {
          this.isLegalLicenseInfo.showAlert = true;
          this.isLegalLicenseInfo.alertMessage = '很抱歉，加载授权信息失败，请联系管理员！';
          this.isLegalLicenseInfo.serverAPIError = true;
        }
        this.isLoading = false;
      },
      () => {
        this.isLoading = false;
        this.initIsLegalLicenseInfo();
        this.isLegalLicenseInfo.showAlert = true;
        this.isLegalLicenseInfo.alertMessage = '很抱歉，加载授权信息失败，请联系管理员！';
        this.isLegalLicenseInfo.serverAPIError = true;
      }
    );
  }

  getLicenseInfo() {
    this.backendSrv.get('/license/informationverbose').then(
      license => {
        if (license) {
          this.licenseInfo = {
            company: license['单位'],
            installedID: license['安装ID'],
            actualID: license['实际安装ID'],
            actualScale: license['实际规模'],
            licenseDays: license['授权天数'],
            licenseKey: license['授权码'],
            activeTime: moment(license['激活时间'] * 1000).format('YYYY-MM-DD'),
            systemTime: moment(license['系统时间'] * 1000).format('YYYY-MM-DD'),
            clusterSize: license['集群规模'],
          };

          if (license['激活时间'] > 0) {
            const days =
              license['授权天数'] - moment(license['系统时间'] * 1000).diff(moment(license['激活时间'] * 1000), 'day');
            if (days <= 45) {
              this.isLegalLicenseInfo.showAlert = true;
              this.isLegalLicenseInfo.alertMessage = `亲爱的用户，您的授权码将于${days}天后(
                ${moment(license['激活时间'] * 1000)
                  .add(license['授权天数'], 'day')
                  .format('YYYY-MM-DD')}
                 )到期，请及时续费。`;
            }
          }
        } else {
          this.initIsLegalLicenseInfo();
          this.isLegalLicenseInfo.showAlert = true;
          this.isLegalLicenseInfo.alertMessage = '很抱歉，加载授权信息失败，请联系管理员！';
          this.isLegalLicenseInfo.serverAPIError = true;
        }
      },
      () => {
        this.initIsLegalLicenseInfo();
        this.isLegalLicenseInfo.showAlert = true;
        this.isLegalLicenseInfo.alertMessage = '很抱歉，加载授权信息失败，请联系管理员！';
        this.isLegalLicenseInfo.serverAPIError = true;
      }
    );
  }

  downloadLicense() {
    this.backendSrv.get('/license/informationverbose').then(license => {
      const blob = new Blob(
        [
          angular.toJson(
            {
              actualID: license['实际安装ID'],
            },
            true
          ),
        ],
        {
          type: 'application/json;charset=utf-8',
        }
      );
      saveAs(blob, 'license.json');
    });
  }

  private initIsLegalLicenseInfo(): void {
    this.isLegalLicenseInfo = {
      showAlert: false,
      alertMessage: null,
      loadLicenseFail: false,
      parseLicenseFail: false,
      licenseExpired: false,
      installedClusterMismatch: false,
      clusterSizeMismatch: false,
      getServerAPIFail: false,
    };
  }
}
