# 企业绿色评级系统 · 架构说明

> 本文档基于对工作空间 `开发代码/Code` 目录下全部源码的静态分析编写，描述系统的技术形态、模块组成、数据流与运维方式。

---

## 1. 项目概述

企业绿色评级系统是一个**面向公众的官网 + 证书查询 + 绿色金融产品超市**站点，定位为"企业绿色资信评估"的门户入口。系统本身**不包含业务后端**，而是以「静态托管的 React 单页应用（SPA）」形态部署，业务数据（评级结果、金融产品）全部实时拉取自已有的企业后台系统（Carbon-Grading 平台）对外开放的 HTTP 接口。

**核心特征：**

| 维度 | 说明 |
|------|------|
| 技术形态 | 构建产物直部署的 React SPA（无本地构建流程，`package.json` 为空壳） |
| 前端框架 | React（`ReactDOM` 渲染）+ React Router（data router，`window.__reactRouterVersion`） |
| 样式 | Tailwind CSS v4（`assets/index.css` 为编译产物，含 Tailwind v4.1.12 标记） |
| 数据来源 | 外部企业后台的 `DataServices/OfficialWebsiteAPI/*` 系列接口（跨域直连，未代理） |
| 托管方式 | 轻量静态服务器（Node `server.js` 或 Python `server.py`），SPA fallback 路由 |
| 运维方式 | 配置文件脚本化 + 三层自动化回归测试（语法门禁 / 路由检查 / Playwright E2E） |

---

## 2. 总体架构

```
┌──────────────────────────────────────────────────────────────┐
│                      访问入口（浏览器）                        │
└───────────────────────────────┬──────────────────────────────┘
                                │ HTTP(S)
┌───────────────────────────────▼──────────────────────────────┐
│                     托管层：静态文件服务器                      │
│   server.js (Node, 默认 8080) / server.py (Python 备选)       │
│   · 静态资源直出：/assets/index.js、/assets/index.css         │
│   · SPA fallback：未匹配路径一律回退 index.html（防 404）       │
│   · 目录路由：访问目录自动补 /index.html                       │
└───────────────────────────────┬──────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐   ┌───────────────────┐   ┌───────────────────────┐
│ 官网 SPA 页面  │   │ 独立静态页         │   │ 配置层                │
│ index.html    │   │ join-us/index.html│   │ assets/config.js      │
│ → React 渲染   │   │ 合作伙伴申请表单    │   │ window.__entUrl__     │
│ → 证书查询      │   │ → CooperationApp- │   │ （企业后台基域名）      │
│ → 金融产品超市   │   │   lication 接口   │   │ 由 setup-config.sh 生成│
└───────┬───────┘   └───────────────────┘   └───────────────────────┘
        │ 前端直连（跨域，浏览器 CORS 直调）
        ▼
┌──────────────────────────────────────────────────────────────┐
│               数据接口层：企业后台 Carbon-Grading             │
│   POST {__entUrl__}/DataServices/OfficialWebsiteAPI/         │
│   ├─ CertificateLookup         证书查询（XHR + FormData）     │
│   ├─ FinancialProductLookup    金融产品查询/首页推荐           │
│   ├─ FinancialProductTypeList  产品类型下拉                   │
│   └─ CooperationApplication    合作伙伴申请（join-us 页）      │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│               测试与运维层（不参与运行时）                     │
│   run_tests.sh        一键回归（三层门禁）                     │
│   tests/e2e_test.py   Playwright E2E（TC01~TC07）            │
│   tests/test_plan.md  测试方案文档                            │
└──────────────────────────────────────────────────────────────┘
```

**关键设计点：** 站点只做"展示 + 转发"，所有业务数据在浏览器端实时请求后台接口；前台与后台之间**没有中间业务服务**，属于典型的"静态前端 + 平台 API"轻架构。

---

## 3. 目录结构

```
Code/
├── index.html              官网 SPA 入口（挂载 #root，加载 config.js + 压缩 JS/CSS）
├── join-us/
│   └── index.html          「加入我们」独立静态页（Tailwind CDN + 原生 fetch 提交）
├── assets/
│   ├── config.js           可配置项：window.__entUrl__（企业后台基域名）
│   ├── index.js            React 压缩构建产物（~560KB，单文件，含全部页面与逻辑）
│   ├── index.css           Tailwind CSS 编译产物（~130KB）
│   ├── index.js.bak        index.js 历史备份（供回滚）
│   ├── index.js.slider_bak 滑块优化前备份
│   └── index.js.orig       最初构建产物的 index.html 备份（含哈希文件名引用）
├── server.js               Node 静态服务器（SPA fallback，生产/预览主用）
├── server.py               Python 静态服务器（SPA fallback，备选）
├── setup-config.sh         交互式配置脚本（写入 config.js）
├── run_tests.sh            一键回归测试脚本
├── package.json / package-lock.json   空壳（仅记录项目名，无依赖）
└── tests/
    ├── e2e_test.py         Playwright 端到端测试（TC01~TC07）
    └── test_plan.md        测试方案与历史踩坑记录
```

> 注：`package.json` 无任何依赖、目录内无源码/构建配置，说明**本目录是构建产物部署目录**，前端源码工程（Vite + React + Tailwind 源码）不在本工作空间内。对前端的功能改动采用"直接修改压缩产物 + 语法校验"的方式完成（见 §6 动态加载模式与 §8 测试体系）。

---

## 4. 前端架构（SPA）

### 4.1 技术栈

- **渲染**：React（`ReactDOM.createRoot` 挂载 `#root`）
- **路由**：React Router（data router 形态，运行时暴露 `window.__reactRouterDataRouter` 等全局标记）
- **样式**：Tailwind CSS v4（原子类内联在 JSX 产物中；`index.css` 为编译后全量样式）
- **形态**：单文件压缩 JS（`index.js`，函数名已被压缩混淆，如 `Jw`、`aA` 等）

### 4.2 页面与导航

导航菜单项（压缩产物中可检索到）：

| 菜单 | 行为 |
|------|------|
| 首页 | SPA 内路由（含金融产品区块，接口动态加载） |
| 证书查询 | SPA 内路由 `/certificate-query`，核心业务页 |
| 绿色金融超市 | SPA 内路由 `/financial-supermarket`，金融产品列表 + 本周推荐 |
| 金融产品 | 入口指向超市页 |
| 加入我们 | 指向 `join-us/index.html` 独立页面 |
| 关于我们 | SPA 内页 |
| 指标申报 / 企业登录 | **外链**到 `{__entUrl__}/App/Enterprise`（企业后台），注册外链 `{__entUrl__}/#EnterpriseRegistration@1` |

**导航改造记录**（TC03 回归项）：
- "指标申报 / 登录"由站内跳转改为 UAT 企业后台外链；
- 菜单项"能源计算"已移除；
- 浮窗"演示说明"已禁用。

### 4.3 证书查询流程（核心链路）

```
用户输入企业全称 + 证书编号
        │
        ▼
点击「立即查询」→ 弹出真人验证滑块（原生 <input type="range">）
        │
        ▼
滑块拖至阈值（≈83.3%，Math.abs(i/100*240-200)<10）→ mouseup/touchend 触发验证通过
        │
        ▼
XHR POST {__entUrl__}/DataServices/OfficialWebsiteAPI/CertificateLookup
        │  FormData: EnterpriseName / CertificateCode
        ▼
响应写入 window.__certResultData（companyName/grade/region/result/certId/ratingType…）
        │
        ▼
结果卡片组件读取全局数据渲染评级结果
```

**实现要点：**
- 接口调用使用 **XHR（非 fetch）**，`responseType="text"` + 手动 JSON 解析；
- 验证滑块无 `transition-all` 过渡（早期存在拖拽滞后的性能问题，已在产物中移除，TC04b 防回归）；
- 查询按钮**必须**先通过滑块验证才发起请求（曾踩坑：按钮误跳过验证直连 API，TC04a/TC04c 防回归）。

---

## 5. 配置机制

**配置文件：** `assets/config.js`（唯一运行时配置点）

```js
window.__entUrl__ = "https://uat-enterprise.carbon-grading.com";
```

**用途：**
- 导航外链基址（`/App/Enterprise`、`/#EnterpriseRegistration@1`）；
- 证书查询 API 基址（`API_BASE_URL = window.__entUrl__`）；
- join-us 页面提交基址（优先 `window.__apiUrl__`，回退 `window.__entUrl__`）。

**配置工具：** `setup-config.sh`（bash，交互式）
- 读取当前值作为默认值 → 提示输入基域名 → 确认后重写 `config.js`；
- 支持 UAT / 正式环境域名切换，改后需重新部署生效。

> 注意：金融产品两个接口（`FinancialProductLookup` / `FinancialProductTypeList`）在产物中**硬编码为 `https://uat.carbon-grading.com`**，不随 `__entUrl__` 切换；正式环境上线前需同步修改此两处。

---

## 6. 动态数据加载模式（前端插桩）

由于前端是压缩产物直部署，动态数据采用「**组件挂载时拉接口 → 写入 `window.__xxx` 全局 → 渲染读全局（失败退回静态兜底）**」的模式：

| 全局变量 | 数据来源接口 | 用途 | 兜底 |
|----------|-------------|------|------|
| `window.__certResultData` | `CertificateLookup` | 证书查询结果渲染 | 静态空对象 |
| `window.__productTypes` | `FinancialProductTypeList` | 超市页产品类型下拉 | 静态类型数组 |
| `window.__products` | `FinancialProductLookup`（官网显示=false） | 超市全量产品列表 | 静态兜底数组 |
| `window.__hotProducts` | `FinancialProductLookup`（本周推荐=true） | 本周热门推荐区块 | 静态兜底数组 |
| `window.__homeProducts` | `FinancialProductLookup`（首页显示=true） | 首页金融产品区块 | 原 3 条硬编码 |

**实现要点（压缩产物安全注入）：**
- 在对应组件 `useEffect` 内用 `fetch`/`XHR` 拉取，成功后写全局并 `setState` 刷新 UI；
- 接口失败时**回退静态兜底，不白屏**；
- 由于产物是单行压缩 JS，注入采用"精确字符串替换 + `node --check` 校验"方式，避免括号失衡破坏语法；
- 渲染层优先读全局（`(window.__xxx && window.__xxx.length ? window.__xxx : fallback)`）；
- 首页产品图标/颜色按产品类型映射（保险→蓝色、基金→橙色、债券→蓝色、供应链→绿色、其他→灰）。

---

## 7. 托管服务器

### server.js（Node.js，主用）
- 零依赖，仅用 `http`/`fs`/`path`；
- 监听 `0.0.0.0`，端口取 `process.env.PORT`，默认 **8080**；
- MIME 表覆盖 html/js/css/json/图片/woff2；
- **SPA fallback**：文件不存在时一律回退返回 `index.html`（保证 `/certificate-query` 等前端路由直达不 404）；
- 目录访问自动补 `index.html`。

### server.py（Python 备选）
- `http.server.SimpleHTTPRequestHandler` 子类，行为一致（存在文件正常出、否则回退 `index.html`）；
- 静默日志，端口取命令行参数，默认 8080。

> 历史踩坑：部署平台默认 `python3 -m http.server` 不支持 SPA 回退（子路由 404），已改用上述带 fallback 的服务器。**若改回裸静态托管，TC02 必失败。**

---

## 8. 数据接口层（外部依赖）

所有接口为 `POST`，位于企业后台 `DataServices/OfficialWebsiteAPI/` 命名空间：

| 接口 | 调用方 | 入参 | 说明 |
|------|--------|------|------|
| `CertificateLookup` | 证书查询页（XHR+FormData） | EnterpriseName, CertificateCode | 返回评级详情（等级/区域/结果/编号/类型） |
| `FinancialProductLookup` | 超市页 + 首页（fetch） | 官网首页显示 / 官网本周热门推荐 等布尔过滤 | 产品列表，按标记区分全量/推荐/首页 |
| `FinancialProductTypeList` | 超市页（fetch） | — | 产品类型枚举（8 类 + "全部"） |
| `CooperationApplication` | join-us 页（fetch+FormData） | 企业名称/信用代码/联系人/电话/邮箱/机构类型/大区… | 合作伙伴申请提交 |

**调用约束：**
- 证书查询走 **XHR**；金融产品与申请表单走 **fetch**；
- 浏览器直连后台接口，当前未触发 CORS 拦截（实测可通）；若后台日后加同源限制，需改为经 `server.js` 代理；
- 金融产品接口硬编码 UAT 域名（见 §5 风险）。

---

## 9. 测试与运维体系

### 9.1 一键回归 `run_tests.sh`

| 步骤 | 手段 | 验证点 |
|------|------|--------|
| [1/3] 语法门禁 | 下载线上 JS → `node --check` | 压缩 JS 无语法错误（防白屏根因） |
| [2/3] 路由可达性 | `curl` 首页 + `/certificate-query` | 均返回 200（SPA fallback 正确） |
| [3/3] E2E 功能 | Playwright 运行 `tests/e2e_test.py` | TC01~TC07 全量功能断言 |

默认目标 `https://a6724c73bfd2fc747.gz3.agentos-app.net`（线上），可用 `BASE_URL` 覆盖，支持本地预览（如 `http://127.0.0.1:3000`）。

### 9.2 E2E 用例清单（TC01~TC07）

| 用例 | 覆盖点 | 防回归要点 |
|------|--------|-----------|
| TC01 | 首页加载 | 防白屏、无 JS 运行时错误 |
| TC02 | SPA 子路由 | `/certificate-query` 直达不 404 |
| TC03 | 导航改造 | 外链 ≥1、无"能源计算/演示说明" |
| TC04 | 证书查询全流程 | 滑块弹出 → API 发出 → 结果数据/卡片完整（含评级类型） |
| TC05 | 产品类型动态加载 | 接口调用 + 9 项下拉（全部+8） |
| TC06 | 超市产品 + 本周推荐 | 两全局填充 + DOM 渲染 API 产品名 |
| TC07 | 首页产品动态加载 | 替换硬编码兜底（"碳挂钩贷款"不得出现） |

**测试设计规范：** 异步等待一律用 `wait_for_function`/`wait_for_selector` 轮询（不用固定 `sleep`）；DOM 文本校验用 `textContent`（避免 `innerText` 布局竞态）。

### 9.3 CI 建议

`run_tests.sh` 退出码 0=通过 / 1=失败，可直接挂发布后自动执行，失败阻断发布。

---

## 10. 部署流程

```
1. bash setup-config.sh        # 交互配置企业后台基域名（写入 config.js）
2. 上传本目录全部文件至静态托管平台 / 自建服务器
3. 服务器需具备 SPA fallback：
   · 自建：node server.js（或 python3 server.py）
   · 平台：确认托管支持未匹配路径回退 index.html
4. bash run_tests.sh           # 三层回归全绿后放量
```

---

## 11. 已知约束与风险

| # | 事项 | 影响 | 建议 |
|---|------|------|------|
| 1 | 无前端源码工程在本目录，功能修改直接改压缩产物 | 可维护性低、易出错 | 保留源码工程，产物由构建生成；当前依赖"精确替换 + node --check"保护 |
| 2 | 金融产品两接口硬编码 UAT 域名 | 正式环境可能打不到生产接口 | 改为读取 `__entUrl__` 或新增独立配置项 |
| 3 | 浏览器直连后台 API（CORS 依赖后台放行） | 后台策略变化即中断 | 预留 server.js 反向代理方案 |
| 4 | `config.js` 中域名与产物内 UAT 域名不一致 | 导航/证书查询与金融产品数据源可能不同环境 | 部署时脚本统一校验 |
| 5 | 依赖全局变量 `window.__xxx` 作为跨组件通信 | 属非标准做法，重构时易被遗漏 | 测试用例已固化关键全局，作为安全网 |
| 6 | `index.js.bak`/`slider_bak`/`orig` 备份文件随包部署 | 冗余文件（可被公网下载） | 部署时排除 `*.bak`/`*.orig` |

---

*文档版本：v1.0 · 生成日期：2026-08-11 · 分析对象：`开发代码/Code` 工作空间全量代码*
