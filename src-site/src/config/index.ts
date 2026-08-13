/**
 * 环境配置读取
 * 统一从 window.__entUrl__ / __cgUrl__ 读取（由 public/config.js 注入），
 * 杜绝硬编码域名 —— 这是源码化后"改配置即可换环境"的核心机制。
 */
export const entUrl: string = (
  window.__entUrl__ || "https://uat-enterprise.carbon-grading.com"
).replace(/\/+$/, "");

export const cgUrl: string = (
  window.__cgUrl__ || window.location.origin
).replace(/\/+$/, "");

/** 企业后台登录 / 指标申报入口 */
export const enterpriseUrl: string = `${entUrl}/App/Enterprise`;
