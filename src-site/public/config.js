// ====== 企业绿色评级系统 · 环境配置（阶段 C：按域名自适应） ======
// 一份 bundle 双环境可用：部署到 uat.carbon-grading.com 用 uat 域名，test.tiici.com 用 test 域名
// 本地开发（localhost）默认连 uat 后台
//
// ⚠️ 临时说明（2026-08-16）：test-enterprise.tiici.com 后端尚未部署（HTTP 000）。
//    test 环境暂时连 uat 后台 API；待 test 后端部署后，把 test 分支的 __entUrl__ 改为 test-enterprise 即可。
(function () {
  const host = window.location.hostname;

  if (host.includes('carbon-grading.com')) {
    // UAT 环境
    window.__entUrl__ = "https://uat-enterprise.carbon-grading.com";  // 企业后台 API
    window.__cgUrl__  = "https://uat.carbon-grading.com";             // 官网前端
  } else if (host.includes('tiici.com')) {
    // TEST 环境（当前上线测试）
    // TODO: test 后端部署后改 __entUrl__ = "https://test-enterprise.tiici.com"
    window.__entUrl__ = "https://uat-enterprise.carbon-grading.com";  // 临时：连 uat 后台
    window.__cgUrl__  = "https://test.tiici.com";                     // 官网前端
  } else {
    // 本地开发 / 其他环境 → 默认连 uat 后台（API 可用）
    window.__entUrl__ = "https://uat-enterprise.carbon-grading.com";
    window.__cgUrl__  = window.location.origin;
  }
})();