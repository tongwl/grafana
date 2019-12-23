export default function (msg) {
  "use strict";
  if ($('.window-main-cover').length === 0) {
    var defaultOpts = {
      bodyClass: 'window-body-cover',
      mainClass: 'window-main-cover',
      alertClass: 'window-alert-cover'
    };
    var _body = $('body');
    var _wrap = $('<div></div>');
    var _coverCotent = $('<div><div class="window-alert-close"><div class="window-alert-title">温馨提示</div><i class="fa fa-close"></i></div><div class="content"></div></div>');
    _body.addClass(defaultOpts.bodyClass);
    _body.append(_wrap);
    _wrap.addClass(defaultOpts.mainClass);
    _body.append(_coverCotent);
    _coverCotent.addClass(defaultOpts.alertClass);
    _coverCotent.find('.content').html(msg);
    _coverCotent.fadeIn('500');
    $(_coverCotent.find('i')).unbind().bind('click', function () {
      _close();
    });
    var _close = function () {
      _coverCotent.fadeOut('300', function () {
        _body.removeClass(defaultOpts.bodyClass);
        _wrap.remove();
        _coverCotent.remove();
      });
    }
  }
}
