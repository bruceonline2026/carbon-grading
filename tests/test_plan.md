# 企业绿色评级系统 — 功能测试方案

> 目的：把现有功能固化成可自动执行的回归测试，每次新增/修改功能后一键跑全量，避免再次出现"白屏""结果为空""404"等只能靠人工发现的回归问题。

---

## 一、测试分层

| 层级 | 工具 | 验证什么 | 何时跑 |
|------|------|----------|--------|
| **语法门禁** | `node --check` | 压缩 JS 没有语法错误（白屏根因） | 发布前 + 测试开头 |
| **路由可达性** | `curl` | 首页 / 子路由都返回 200（SPA fallback 配置正确） | 测试开头 |
| **E2E 功能** | Playwright（Python） | 页面渲染、导航改造、查询全流程、滑块同步 | 发布后 |

---

## 二、自动化测试脚本

脚本位置：`tests/e2e_test.py`
一键运行：`bash run_tests.sh`（已包含语法门禁 + 路由检查 + E2E）

### 运行方式

```bash
# 默认测试线上已发布版本
bash run_tests.sh

# 或单独跑 E2E（指定地址）
BASE_URL=https://你的地址 python3 tests/e2e_test.py

# 测试本地预览（先启动 server.js）
BASE_URL=http://127.0.0.1:3000 python3 tests/e2e_test.py
```

### 依赖安装（首次）

```bash
pip install playwright
playwright install chromium
```

---

## 三、测试用例清单

### TC01 首页加载（防白屏）
| 步骤 | 预期 |
|------|------|
| 打开 `/` | HTTP 200 |
| 读取页面标题 | 含"绿色评级/企业绿色" |
| 检查关键内容 | "证书查询"或品牌标题已渲染（非白屏） |
| 监听 `pageerror` | 无 JS 运行时错误 |

### TC02 SPA 子路由（防 404）
| 步骤 | 预期 |
|------|------|
| 直接访问 `/certificate-query` | HTTP 200（**不是 404**） |
| 查找企业名输入框 | 查询表单已渲染 |
| 监听 `pageerror` | 无 JS 错误 |

> ⚠️ 这是踩过的坑：部署平台默认 `python3 -m http.server` 不支持 SPA 回退，已改用 `server.js`（未匹配路径回退 `index.html`）。**若改回静态托管，此项必失败。**

### TC03 导航改造
| 步骤 | 预期 |
|------|------|
| 统计 `a[href*=uat-enterprise.carbon-grading.com/App/Enterprise]` | ≥1（指标申报/登录改为外链） |
| 页面全文检索"能源计算" | 不存在（菜单项已移除） |
| 页面全文检索"演示说明" | 不存在（浮窗已禁用） |

### TC04 证书查询完整流程（核心链路）
| 步骤 | 预期 |
|------|------|
| 填企业名 `沙福科技（上海）有限公司` + 证书编号 `GR-2026-000003` | — |
| 点"立即查询" | **弹出真人验证滑块**（`input[type=range]` 出现） |
| 滑块容器内检索 `transition-all` | 不存在（同步优化生效） |
| 滑块设为 83% 并派发 mouseup | 验证通过 |
| 等待 `window.__certResultData` | API 已调用（≥1 次 `CertificateLookup`） |
| 校验数据字段 | `companyName / grade / region / result / certId / ratingType` 全非空 |
| 检查结果卡片 DOM | 正确显示企业名称与"评级类型"标签及实际值（非空渲染） |
| 监听 `pageerror` | 无 JS 错误 |

> ⚠️ **历史踩坑记录（务必保留这些断言）：**
> 1. **结果为空**：`aA` 组件曾读静态空对象 `sA` 而非 `window.__certResultData`，导致卡片全空。断言 `TC04d~TC04i` 防回归。
> 2. **无网络请求**：查询按钮曾误跳过验证直连 API；也曾因验证滑块阈值窄（≈83.3%）拖不到位导致永不发请求。断言 `TC04a`（弹窗出现）+ `TC04c`（API 发出）防回归。
> 3. **滑块滞后**：根因是验证滑块的**拖拽手柄（thumb）与进度填充条仍带 `transition-all`**，跟随鼠标时有缓动滞后感（早期 framer-motion 拼图块缓动已替换，但原生滑块这两处 `transition-all` 一直残留）。已在压缩产物中精确移除这两处 `transition-all`（不影响页面其他 48 处动画）。断言 `TC04b`（弹窗内无 `transition-all`）防回归。
> 4. **CORS**：浏览器直连后台 API 未触发 CORS 拦截（实测可通），但若后台加同源限制需改为 `server.js` 代理。
> 5. **评级类型缺失**：结果卡片曾在 `aA` 的 grid 中漏渲染 `ratingType`。断言 `TC04h2`（数据非空）+ `TC04i2`（DOM 含"评级类型"标签及实际值）防回归。

### TC05 产品类型动态加载（从接口读取，非硬编码）
| 步骤 | 预期 |
|------|------|
| 打开 `/financial-supermarket` | HTTP 200 |
| 监听请求含 `FinancialProductTypeList` | ≥1 次调用（组件挂载时 `useEffect` 拉取接口） |
| 等待 `window.__productTypes` 被填充 | 数组长度 ≥2 |
| 读取 `window.__productTypes` | 首项为"全部"，且含接口返回的 8 个动态值（其他金融产品 / 绿色金融产品 / 绿色转型金融产品 / 供应链金融产品 / 绿色保险 / 绿色转型保险 / 其他保险产品 / 投资理财），共 9 项 |
| 检查"产品类型"下拉 DOM | 渲染了接口动态值（如"绿色金融产品"） |
| 监听 `pageerror` | 无 JS 错误 |

> ⚠️ **动态加载实现要点（防回归）：**
> - 在 `B2`（金融产品页）组件内 `useEffect` 中 `fetch` `POST .../FinancialProductTypeList`，成功后写入 `window.__productTypes=["全部"].concat(接口返回的数组)` 并 `setState` 触发下拉刷新。
> - 下拉选项读 `window.__productTypes || 静态兜底`，接口失败时退回静态兜底，不白屏。
> - 早期曾因在压缩产物插 `useEffect` 括号失衡失败；现用"精确字符串替换 + `node --check` 校验"的安全注入方式，避免破坏压缩 JS。

### TC06 金融产品动态加载（超市查询结果 + 本周推荐，均来自 `FinancialProductLookup`）
| 步骤 | 预期 |
|------|------|
| 打开 `/financial-supermarket` | HTTP 200 |
| 监听请求含 `FinancialProductLookup` | ≥1 次调用（`useEffect` 拉取接口） |
| 等待 `window.__products` 与 `window.__hotProducts` 被填充 | 两者均 ≥1 条（全量 19 / 本周推荐 9） |
| 主列表 DOM | 含接口返回的产品名（如"AA贷"），页面显示"找到 19 个产品" |
| "本周热门推荐"区块 DOM | 区块内渲染了接口推荐产品（如"浦发绿色贷"） |
| 监听 `pageerror` | 无 JS 错误 |

> ⚠️ **实现要点（防回归）：**
> - `B2` 组件 `useEffect` 内同时拉取两类数据：
>   - 超市全量：`POST FinancialProductLookup`（`官网首页显示=false` + `官网本周热门推荐=false`）→ 写入 `window.__products`
>   - 本周推荐：`官网本周热门推荐=true` → 写入 `window.__hotProducts`
> - 主列表 `N` 与推荐 `S` 改为读全局：`(window.__products&&window.__products.length?window.__products:y).filter(...)` 与 `(window.__hotProducts&&...?window.__hotProducts:y).slice(0,3)`；接口未返回时退回静态兜底 `y`，不白屏。
> - **时序坑**：`window.__products` 置位与 React 提交重渲染非原子，断言需 `wait_for_function` 轮询 DOM（用 `textContent` 而非 `innerText`，避免布局竞态），不要固定 `sleep`。

### TC07 首页金融产品动态加载（来自 `FinancialProductLookup`，`官网首页显示=true`）
| 步骤 | 预期 |
|------|------|
| 打开 `/` | HTTP 200 |
| 监听请求含 `FinancialProductLookup` | ≥1 次调用 |
| 等待 `window.__homeProducts` 被填充 | ≥1 条（首页 10 条） |
| 首页 DOM | 含接口返回的产品名（如"浦发绿色贷"） |
| 强校验 | 硬编码兜底"碳挂钩贷款"已不在 DOM（证明被接口数据替换） |
| 监听 `pageerror` | 无 JS 错误 |

> ⚠️ **实现要点（防回归）：**
> - `O2`（首页金融产品区块）改为读 `window.__homeProducts`：组件内 `useEffect` 拉取 `官网首页显示=true` 写入全局，`e` 变量优先取全局、否则退回原 3 条硬编码兜底。
> - 图标/颜色按 `CPLX` 映射（保险→`$l`、基金→`Od`、债券→`$l`、供应链→`ki`、其他→`Io`；颜色同理派生）。

---

## 四、如何新增功能测试

1. 在 `e2e_test.py` 的 `main()` 里按 TC05、TC06… 顺序新增用例块。
2. 每个用例用 `check("TC0X 描述", 条件, 细节)` 记录断言。
3. 定位元素优先用稳定选择器：
   - 输入框：`input[placeholder="..."]` 或 `input[type="text"]`
   - 按钮：`page.get_by_role("button", name="立即查询")`
   - 外链：`a[href*="关键字"]`
   - 文本：`page.locator("text=...")`
4. 需要等待异步（API/动画）时，用 `page.wait_for_function(...)` 或 `page.wait_for_selector(...)`，**不要**用固定 `sleep`。
5. 新增断言后跑 `bash run_tests.sh` 验证全量通过，再发布。

---

## 五、CI 接入建议

```yaml
# 伪配置：发布后自动跑
steps:
  - run: bash run_tests.sh
  # 退出码非 0 即失败，阻断发布
```

退出码约定：`0` = 全部通过，`1` = 有失败项。
