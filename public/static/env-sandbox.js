/* 시험환경 분리 스크립트 (가장 먼저 로드)
 * - 시험환경 여부: 쿠키 amk_env=sbx (서버 Caddy 가 이 쿠키가 있을 때만 /api 를 시험 서버로 보냄)
 * - 시험 중에는 로그인·발권 요청 관련 저장 키에 'sbx:' 접두어를 붙여 운영 로그인 정보와 섞이지 않게 한다.
 *   (사이트 데이터 전체 삭제 없이 분리. 프린터 인증코드·창구/프린터 설정은 같은 PC 장치 정보이므로 공유)
 * - 쿠키가 없으면 아무것도 하지 않는다 → 운영 동작 그대로.
 */
(function () {
  'use strict';
  var COOKIE = 'amk_env=sbx';
  var on = (document.cookie || '').split(/;\s*/).indexOf(COOKIE) !== -1;
  window.AMK_SANDBOX_ENV = {
    active: on,
    enter: function () { document.cookie = COOKIE + '; Path=/; Max-Age=28800; SameSite=Lax; Secure'; },
    leave: function () { document.cookie = 'amk_env=; Path=/; Max-Age=0; SameSite=Lax; Secure'; }
  };
  if (!on) return;
  var RE = /^(amk_admin_|amk_imp$|amk_fail_count$|amk_lock_time$|amk_instant_perm$|amk-res-filter$|amk-issue-|amk-reprint-)/;
  ['localStorage', 'sessionStorage'].forEach(function (name) {
    var st; try { st = window[name]; } catch (e) { return; }
    var proto = Object.getPrototypeOf(st);
    ['getItem', 'setItem', 'removeItem'].forEach(function (fn) {
      var orig = proto[fn];
      proto[fn] = function (k) {
        var a = arguments;
        if (this === st && typeof k === 'string' && RE.test(k)) { a = Array.prototype.slice.call(arguments); a[0] = 'sbx:' + k; }
        return orig.apply(this, a);
      };
    });
  });
})();
