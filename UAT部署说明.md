# UAT 环境部署说明（自动化 + 手动）

> 部署包：`deploy-uat-20260817.zip`（由 `tools/build_uat_package.py` 构建）
> 本次变更：
> - 阶段 A/B/C 全部源码工程产物（首页、金融超市、证书查询、加入我们、关于我们）
> - Footer 底部对齐 uat：真实备案号 + 官方公安备案图标 + 跳转自动填充 recordcode
> - 新增 `tools/deploy_uat_server.ps1`：服务器端一键自动备份、解压、验证

---

## 一、部署前准备

| 项目 | 值 |
|------|-----|
| UAT 目标机 | `47.116.206.131`（Windows + IIS 10） |
| 登录账号 | `Dev_Deploy` |
| 密码 | `XuPeng!2026` |
| 登录方式 | 远程桌面（RDP，端口 3389） |
| 网站域名 | 通过 IIS 站点访问，80 端口 |
| 网站根目录 | `C:\inetpub\wwwroot`（若不同请修改脚本参数） |

---

## 二、推荐方式：服务器端一键脚本（2 分钟）

### 1. 把部署包传到服务器

RDP 登录后，把 `deploy-uat-20260817.zip` 放到服务器任意位置，例如：

```
C:\Users\Public\deploy-uat-20260817.zip
```

### 2. 以管理员身份运行 PowerShell，执行

```powershell
C:\Users\Public\deploy_uat_server.ps1 -ZipPath "C:\Users\Public\deploy-uat-20260817.zip"
```

脚本会自动完成：
1. 备份现有站点到 `C:\inetpub\backup-uat-<时间戳>`
2. 清空 `C:\inetpub\wwwroot`（保留 backup 目录）
3. 解压部署包到网站根目录
4. 验证 4 个关键路径：首页、金融超市、证书查询、加入我们，全部 HTTP 200

### 3. 如果网站根目录不是默认路径

```powershell
C:\Users\Public\deploy_uat_server.ps1 `
  -ZipPath "C:\Users\Public\deploy-uat-20260817.zip" `
  -WebRoot "D:\WebRoot\uat"
```

---

## 三、回滚

脚本已自动创建备份目录，例如 `C:\inetpub\backup-uat-20260817-143022`。

如果部署后需要回滚，把备份目录里的内容复制回网站根目录覆盖即可：

```powershell
$backup = "C:\inetpub\backup-uat-20260817-143022"
$webroot = "C:\inetpub\wwwroot"
Get-ChildItem $backup -Force | Copy-Item -Destination $webroot -Recurse -Force
```

---

## 四、手动部署方式（备用）

如果一键脚本无法运行，按以下步骤手动操作：

1. **备份**：复制 `C:\inetpub\wwwroot` 里的 `index.html`、`assets`、`join-us` 到备份目录。
2. **清理**：删除上述文件/文件夹。
3. **解压**：把 `deploy-uat-20260817.zip` 解压到 `C:\inetpub\wwwroot`，覆盖同名文件。
4. **确认目录结构**：

```
网站根目录/
├── index.html
├── web.config          ← 必须有（SPA fallback + HTTP→HTTPS 跳转）
├── assets/
│   ├── config.js
│   ├── index.js
│   └── index.css
└── join-us/
    └── index.html
```

5. **验证浏览器访问**：
   - http://47.116.206.131/
   - http://47.116.206.131/financial-supermarket
   - http://47.116.206.131/certificate-query
   - http://47.116.206.131/join-us/

> ⚠️ 若访问子路由报 500.19 错误，说明 IIS 缺少 URL Rewrite 模块，请联系运维安装 Microsoft URL Rewrite Module for IIS。

---

## 五、生成新的部署包

开发端运行：

```bash
python tools/build_uat_package.py
```

该脚本会执行 `npm run build` 并打包 `dist/` + `join-us/` + `web.config` + 部署脚本，生成 `deploy-uat-<日期>.zip`。

---

*生成时间：2026-08-17 · 部署包：deploy-uat-20260817.zip*
