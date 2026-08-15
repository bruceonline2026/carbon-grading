// 企业绿色评级系统 · SSL 证书申请（Let's Encrypt + ZeroSSL 双 CA 自动切换）
// - 优先 Let's Encrypt（HTTP-01，需要 80 端口外网可达）
// - 失败/被 rate limit 自动切换到 ZeroSSL（DNS-01，需提供 DNS provider API key）
// - auto() 返回 PEM 字符串链（不是对象）
const fs = require('fs');
const path = require('path');
const { Client, crypto } = require('acme-client');
const forge = require('node-forge');

const DOMAIN = 'test.tiici.com';
const EMAIL = 'admin@tiici.com';
const WEBROOT = 'C:/WebServer/Test';
const PFX_PASSWORD = 'testpass2026';

const ACCOUNT_KEY_FILE = path.join(__dirname, 'account.key');
const DOMAIN_KEY_FILE = path.join(__dirname, 'domain.key');
const EAB_KID_FILE = path.join(__dirname, 'zerossl-eab-kid.txt');
const EAB_HMAC_FILE = path.join(__dirname, 'zerossl-eab-hmac.txt');

const nodeCrypto = require('crypto'); // node 内置 crypto（KeyObject 加载/生成）

function log(...args) {
  console.log(new Date().toISOString().slice(11, 19), ...args);
}

/** 读取已有 PEM 私钥或生成新的 RSA 2048（node 内置 crypto；acme-client 的 crypto.createPrivateKey 不支持 PEM 加载） */
function loadOrCreatePrivateKey(file) {
  if (fs.existsSync(file)) {
    log(`读取已有密钥: ${file}`);
    return nodeCrypto.createPrivateKey(fs.readFileSync(file, 'utf8'));
  }
  log(`生成新密钥: ${file}（约 30~90 秒，请耐心）`);
  const { privateKey } = nodeCrypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  fs.writeFileSync(file, privateKey.export({ type: 'pkcs8', format: 'pem' }));
  return privateKey;
}

function writeExit(reason) {
  fs.writeFileSync(path.join(__dirname, 'exit.log'), reason + '\n');
  console.log('exit.log:', reason);
}

async function tryIssue(caName, opts) {
  log(`\n========== 尝试 ${caName} ==========`);
  // accountKey：acme-client v5 接受 PEM 字符串（不传 KeyObject）
  if (!fs.existsSync(ACCOUNT_KEY_FILE)) {
    log(`生成 ACME 账户密钥...`);
    const { privateKey } = nodeCrypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    fs.writeFileSync(ACCOUNT_KEY_FILE, privateKey.export({ type: 'pkcs8', format: 'pem' }));
  }
  const accountKeyPem = fs.readFileSync(ACCOUNT_KEY_FILE, 'utf8');
  // domainKey：node KeyObject（用于 CSR，保证证书/私钥匹配）
  const domainKey = loadOrCreatePrivateKey(DOMAIN_KEY_FILE);

  const client = new Client({
    directoryUrl: opts.directoryUrl,
    accountKey: accountKeyPem,
    ...(opts.eab ? { eab: opts.eab } : {}),
  });

  log(`注册账户 ${caName}...`);
  await client.createAccount({
    termsOfServiceAgreed: true,
    contact: [`mailto:${EMAIL}`],
  });

  log(`提交订单 ${DOMAIN} ...`);
  const order = await client.createOrder({ identifiers: [{ type: 'dns', value: DOMAIN }] });

  const authzs = await client.getAuthorizations(order);
  const authz = authzs[0];
  const challenge = authz.challenges.find((c) => c.type === opts.challengeType);

  if (opts.challengeType === 'http-01') {
    const keyAuth = await client.getChallengeKeyAuthorization(challenge);
    fs.mkdirSync(WEBROOT + '/.well-known/acme-challenge', { recursive: true });
    const tokenFile = path.join(WEBROOT, '.well-known', 'acme-challenge', challenge.token);
    fs.writeFileSync(tokenFile, keyAuth);
    log(`写入 webroot: ${tokenFile}`);

    await client.completeChallenge(challenge);
    log(`等待 ${caName} 访问验证（30~120 秒）...`);
    await client.waitForValidStatus(authz);
    fs.unlinkSync(tokenFile);
  } else if (opts.challengeType === 'dns-01') {
    const keyAuth = await client.getChallengeKeyAuthorization(challenge);
    log(`===== 请到 DNS 提供商添加 TXT 记录 =====`);
    log(`   主机记录: _acme-challenge.${DOMAIN}`);
    log(`   记录类型: TXT`);
    log(`   记录值:   ${keyAuth}`);
    log(`===== 添加完成后按 Enter 继续 =====`);
    await new Promise((resolve) => {
      const rl = require('readline').createInterface({ input: process.stdin, output: process.stdout });
      rl.question('', () => { rl.close(); resolve(); });
    });
    await client.completeChallenge(challenge);
    log(`等待 DNS 传播（30~120 秒）...`);
    await client.waitForValidStatus(authz);
  }

  log(`生成 CSR（使用 domain.key 对应私钥，保证证书/私钥匹配）...`);
  // node KeyObject → PKCS1 PEM → forge privateKey → CSR
  const domainPem = domainKey.export({ type: "pkcs1", format: "pem" });
  const forgeKey = forge.pki.privateKeyFromPem(domainPem);
  // 关键：forge 的 privateKeyFromPem 不填充 publicKey 属性（只有 n/e/d 等），
  // csr.sign 内部访问 forgeKey.publicKey 会 undefined → 手动用 n/e 构造
  forgeKey.publicKey = forge.pki.setRsaPublicKey(forgeKey.n, forgeKey.e);
  const csr = forge.pki.createCertificationRequest();
  csr.publicKey = forgeKey.publicKey;
  csr.setSubject([{ name: "commonName", value: DOMAIN }]);
  csr.sign(forgeKey, forge.md.sha256.create());
  const csrPem = forge.pki.certificationRequestToPem(csr);

  log(`下载证书...`);
  const cert = await client.finalizeOrder(order, csrPem);
  const pem = await client.getCertificate(cert);
  fs.writeFileSync(path.join(__dirname, `${DOMAIN}.crt`), pem);

  log(`生成 PFX（密码: ${PFX_PASSWORD}）...`);
  // 用 node-forge 生成 PKCS12（跳板机无 openssl 命令）
  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(
    forgeKey,
    [pem],
    PFX_PASSWORD,
    { algorithm: "3des", friendlyName: DOMAIN },
  );
  const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
  const pfxFile = path.join(__dirname, `${DOMAIN}.pfx`);
  fs.writeFileSync(pfxFile, Buffer.from(p12Der, "binary"));
  fs.writeFileSync(path.join(__dirname, `${DOMAIN}.key`), domainPem);
  log(`✅ ${caName} 证书申请成功`);
  log(`   证书: ${DOMAIN}.crt`);
  log(`   私钥: ${DOMAIN}.key`);
  log(`   PFX:  ${pfxFile}（密码 ${PFX_PASSWORD}）`);

  log(`导入 IIS 证书库（LocalMachine\\My）...`);
  execSync(`certutil -f -p "${PFX_PASSWORD}" -importPFX "${pfxFile}" NoRoot`, { cwd: __dirname });
  const thumbprint = execSync(`powershell -NoProfile -Command "(Get-ChildItem Cert:\\LocalMachine\\My | Where-Object { $_.Subject -match 'CN=${DOMAIN}' } | Sort-Object NotAfter -Descending | Select-Object -First 1).Thumbprint"`).toString().trim();
  log(`   Thumbprint: ${thumbprint}`);

  log(`绑定 IIS Test 网站（替换现有 https 绑定）...`);
  const siteName = 'Test';
  const oldBindings = execSync(`powershell -NoProfile -Command "Get-WebBinding -Name '${siteName}' -Protocol https -HostHeader '${DOMAIN}' | ForEach-Object { $_.BindingInformation }"`, { stdio: 'pipe' }).toString().trim().split('\n').filter(Boolean);
  for (const b of oldBindings) {
    try { execSync(`powershell -NoProfile -Command "Remove-WebBinding -Name '${siteName}' -BindingInformation '${b.trim()}'"`); } catch {}
  }
  execSync(`powershell -NoProfile -Command "New-WebBinding -Name '${siteName}' -Protocol https -Port 443 -HostHeader '${DOMAIN}' -SslFlags 1"`);
  execSync(`powershell -NoProfile -Command "Get-WebBinding -Name '${siteName}' -Protocol https -HostHeader '${DOMAIN}' | Add-SslCertificate -Thumbprint '${thumbprint}' -StoreName My -Location LocalMachine"`);
  // netsh 全局兜底
  try {
    execSync(`netsh http delete sslcert ipport=0.0.0.0:443 2>nul`);
  } catch {}
  execSync(`netsh http add sslcert ipport=0.0.0.0:443 certhash=${thumbprint} appid={2147E514-1234-5678-90AB-CDEF12345678} certstorename=MY`);

  log(`配置 HTTP→HTTPS 重定向...`);
  execSync(`powershell -NoProfile -Command "Set-WebConfigurationProperty -Filter '/system.webServer/httpRedirect' -Name 'enabled' -Value 'true' -PSPath 'IIS:\\Sites\\${siteName}'"`);
  execSync(`powershell -NoProfile -Command "Set-WebConfigurationProperty -Filter '/system.webServer/httpRedirect' -Name 'destination' -Value 'https://${DOMAIN}/' -PSPath 'IIS:\\Sites\\${siteName}'"`);

  writeExit(`OK ${caName}`);
}

async function main() {
  try {
    // 优先 Let's Encrypt（HTTP-01）
    await tryIssue("Let's Encrypt", {
      directoryUrl: 'https://acme-v02.api.letsencrypt.org/directory',
      challengeType: 'http-01',
    });
  } catch (e) {
    log(`❌ Let's Encrypt 失败: ${e.message || e}`);
    if (e.stack) log(e.stack.split('\n').slice(0, 8).join('\n'));
    const msg = (e.message || '').toLowerCase();
    if (msg.includes('429') || msg.includes('rate') || msg.includes('rateLimited')) {
      log(`检测到 rate limit，自动切换 ZeroSSL（DNS-01，需要 DNS provider API）...`);
      // ZeroSSL 注册：https://app.zerossl.com/developer 获取 EAB kid + hmac
      if (!fs.existsSync(EAB_KID_FILE) || !fs.existsSync(EAB_HMAC_FILE)) {
        log(`请先到 https://app.zerossl.com/developer 注册免费 EAB 凭据（kid + hmac）`);
        log(`将 kid 写入: ${EAB_KID_FILE}`);
        log(`将 hmac 写入: ${EAB_HMAC_FILE}`);
        writeExit('NEED_EAB');
        return;
      }
      const eab = {
        kid: fs.readFileSync(EAB_KID_FILE, 'utf8').trim(),
        hmac: fs.readFileSync(EAB_HMAC_FILE, 'utf8').trim(),
      };
      try {
        await tryIssue("ZeroSSL", {
          directoryUrl: 'https://acme.zerossl.com/v2/DV90',
          challengeType: 'dns-01',
          eab,
        });
      } catch (e2) {
        log(`❌ ZeroSSL 也失败: ${e2.message || e2}`);
        writeExit(`FAIL ${e2.message || e2}`);
      }
    } else {
      writeExit(`FAIL ${e.message || e}`);
    }
  }
}

main();