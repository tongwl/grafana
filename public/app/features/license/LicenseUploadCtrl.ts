import angular from 'angular';
import appEvents from '../../core/app_events';

export default class LicenseUploadCtrl {
  /** @ngInject */
  constructor($location, $scope, $rootScope, backendSrv, navModelSrv) {
    $scope.navModel = navModelSrv.getNav('license', 'license-list', 0);
    $scope.licenseKey = '';
    $scope.licenseError = false;
    $scope.errorMessage = '';

    $scope.update = () => {
      if ($scope.licenseKey) {
        backendSrv.post('/license/information', { 授权码: $scope.licenseKey }).then(
          response => {
            if (response && response.status === '授权信息更新成功') {
              $rootScope.appEvent('alert-success', ['更新授权码成功', '']);
              $location.path('/license/list');
            } else {
              $rootScope.appEvent('alert-error', ['更新授权码失败', '']);
            }
          },
          () => {
            $rootScope.appEvent('alert-error', ['更新授权码失败', '']);
          }
        );
      }
    };

    angular.element('#upload-license-key').on('change', evt => {
      const wnd: any = window;
      if (!(wnd.File && wnd.FileReader && wnd.FileList && wnd.Blob)) {
        appEvents.emit('alert-error', ['您使用的浏览器并不支持文件上传，请手动输入授权码', '']);
        return;
      }
      const file = evt.target['files'][0];
      const readerOnload = () => {
        return e => {
          let dash;
          try {
            dash = JSON.parse(e.target.result);
            $scope.licenseKey = dash['授权码'];
            $scope.$apply();
          } catch (err) {
            appEvents.emit('alert-error', ['解析失败', '请重试或手动输入授权码']);
            return;
          }
        };
      };
      const reader = new FileReader();
      reader.onload = readerOnload();
      reader.readAsText(file);
      angular.element('#upload-license-key').val('');
    });
  }
}
