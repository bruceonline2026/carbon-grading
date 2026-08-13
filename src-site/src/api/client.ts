import { entUrl } from "../config";

/**
 * API 客户端封装
 * 四个接口统一走企业后台域名（__entUrl__），与静态前端完全解耦。
 */
const API_BASE = `${entUrl}/DataServices/OfficialWebsiteAPI`;

/** 通用请求 */
async function request<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}/${path}`, {
    method: body !== undefined ? "POST" : "GET",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`API ${path} 请求失败: HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

/* ---------------- 证书查询 ---------------- */
export interface CertificateQueryParams {
  /** 企业名称 */
  enterpriseName: string;
  /** 证书编号 */
  certificateNo: string;
}

export interface CertificateRecord {
  enterpriseName?: string;
  certificateNo?: string;
  [key: string]: unknown;
}

/**
 * 证书查询（原实现为 XHR + FormData + 滑块验证阈值，阶段B迁移交互细节）
 */
export function lookupCertificate(params: CertificateQueryParams): Promise<CertificateRecord> {
  return request<CertificateRecord>("CertificateLookup", params);
}

/* ---------------- 金融产品 ---------------- */
export interface FinancialProduct {
  productId?: string;
  productName?: string;
  productType?: string;
  [key: string]: unknown;
}

export interface ProductListParams {
  productType?: string;
  pageIndex?: number;
  pageSize?: number;
  [key: string]: unknown;
}

/** 金融产品列表（金融超市 + 首页本周推荐） */
export function lookupFinancialProducts(params: ProductListParams): Promise<FinancialProduct[]> {
  return request<FinancialProduct[]>("FinancialProductLookup", params);
}

/** 金融产品类型列表（下拉） */
export function lookupFinancialProductTypes(): Promise<string[]> {
  return request<string[]>("FinancialProductTypeList", {});
}

/* ---------------- 合作申请 ---------------- */
export interface CooperationApplication {
  enterpriseName: string;
  unifiedSocialCreditCode: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  institutionType: string;
  region: string;
  website?: string;
  remark?: string;
}

/** 合作申请提交（join-us 表单） */
export function submitCooperationApplication(data: CooperationApplication): Promise<{ Message?: string }> {
  return request<{ Message?: string }>("CooperationApplication", data);
}
