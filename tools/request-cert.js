// 企业绿色评级系统 · Let's Encrypt 证书申请（acme-client auto() 版，最终修正）
// auto() 返回 PEM 字符串（证书链）——之前误当对象用导致 undefined
const fs = require('fs');
const path = require('path');
const { Client, crypto } = require('acme-client');
const forge = require('node-forge');

const DOMAIN = 'test.tiici.com';
const EMAIL = 'admin@tiici.com';
const WEBROOT = 'C:/WebServer/Test';
const CERT_DIR = 'C:/acme-node';
const PFX_PASSWORD = 'testpass2026';
const ACCOUNT_KEY_FILE = path.join(CERT_DIR, 'account.key');
const DOMAIN_KEY_FILE = path.join(CERT_DIR, 'domain.key');

(async () => {
  fs.mkdirSync(CERT_DIR, { recursive: true });

  // 账户密钥（复用）
  let accountKey;
  if (fs.existsSync(ACCOUNT_KEY_FILE)) accountKey = fs.readFileSync(ACCOUNT_KEY_FILE);
  else { accountKey = await crypto.createPrivateKey(); fs.writeFileSync(ACCOUNT_KEY_FILE, accountKey); }

  // 域名密钥（复用，避免每次慢速 RSA 生成）
  let keys;
  if (fs.existsSync(DOMAIN_KEY_FILE)) {
    const pem = fs.readFileSync(DOMAIN_KEY_FILE, 'utf8');
    keys = { privateKey: forge.pki.privateKeyFromPem(pem) };
    keys.publicKey = forge.pki.rsa.setPublicKey(keys.privateKey.n, keys.privateKey.e);
  } else {
    keys = forge.pki.rsa.generateKeyPair(2048);
    fs.writeFileSync(DOMAIN_KEY_FILE, forge.pki.privateKeyToPem(keys.privateKey));
  }

  // CSR
  const csr = forge.pki.createCertificationRequest();
  csr.publicKey = keys.publicKey;
  csr.setSubject([{ name: 'commonName', value: DOMAIN }]);
  csr.sign(keys.privateKey, forge.md.sha256.create());

  const client = new Client({ directoryUrl: 'https://acme-v02.api.letsencrypt.org/directory', accountKey });

  console.log('=== auto() 申请（返回 PEM 字符串链）===');
  const pemChain = await client.auto({
    csr: forge.pki.certificationRequestToPem(csr),
    email: EMAIL,
    termsOfServiceAgreed: true,
    challengePriority: ['http-01'],
    challengeCreate: async (a, c, ka) => {
      fs.mkdirSync(path.join(WEBROOT, '.well-known', 'acme-challenge'), { recursive: true });
      fs.writeFileSync(path.join(WEBROOT, '.well-known', 'acme-challenge', c.token), ka);
      console.log('  验证文件: ' + c.token);
    },
    challengeRemove: async (a, c) => {
      try { fs.unlinkSync(path.join(WEBROOT, '.well-known', 'acme-challenge', c.token)); } catch (e) {}
    },
  });

  console.log('=== 处理证书链 ===');
  // pemChain 是 PEM 字符串，可能含多个 CERTIFICATE
  const certBlocks = pemChain.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g) || [];
  if (certBlocks.length === 0) throw new Error('PEM 链中未找到证书');
  const leafPem = certBlocks[0];
  const chainPem = certBlocks.slice(1).join('\n');

  // 保存 fullchain + key
  fs.writeFileSync(path.join(CERT_DIR, DOMAIN + '.crt'), certBlocks.join('\n'));
  fs.writeFileSync(path.join(CERT_DIR, DOMAIN + '.key'), forge.pki.privateKeyToPem(keys.privateKey));

  // 打包 PFX（leaf + 私钥）
  const certPemObj = forge.pki.certificateFromPem(leafPem);
  const pfxAsn1 = forge.pkcs12.toPkcs12Asn1(certPemObj, keys.privateKey, PFX_PASSWORD);
  const pfxDer = forge.asn1.toDer(pfxAsn1);
  const pfxPath = path.join(CERT_DIR, DOMAIN + '.pfx');
  fs.writeFileSync(pfxPath, Buffer.from(pfxDer.getBytes(), 'binary'));

  console.log('\n🎉 证书申请成功！');
  console.log('  证书块数: ' + certBlocks.length);
  console.log('  CRT: ' + path.join(CERT_DIR, DOMAIN + '.crt'));
  console.log('  KEY: ' + path.join(CERT_DIR, DOMAIN + '.key'));
  console.log('  PFX: ' + pfxPath + ' (密码: ' + PFX_PASSWORD + ')');
  console.log('DONE');
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
