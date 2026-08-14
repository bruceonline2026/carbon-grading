import { entUrl } from "../config";

/**
 * API 客户端封装（与原压缩产物行为一致：FormData + text 解析）
 * 四个接口统一走企业后台域名（__entUrl__），与静态前端完全解耦。
 */
const API_BASE = `${entUrl}/DataServices/OfficialWebsiteAPI`;

/** FormData POST，返回解析后的 JSON（失败返回 null） */
async function postForm<T>(path: string, body?: Record<string, string>): Promise<T | null> {
  try {
    const fd = new FormData();
    if (body) {
      for (const k of Object.keys(body)) fd.append(k, body[k]);
    }
    const res = await fetch(`${API_BASE}/${path}`, { method: "POST", body: fd });
    const text = await res.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

/* ---------------- 证书查询 ---------------- */
export interface CertificateQueryParams {
  /** 企业全称 */
  enterpriseName: string;
  /** 证书编号 */
  certificateCode: string;
}

/** 证书查询结果（与原产物 __certResultData 结构一致） */
export interface CertificateResult {
  companyName: string;
  certId: string;
  status: string;
  grade: string;
  region: string;
  industry: string;
  year: string;
  result: string;
  ratingType: string;
}

/**
 * 证书查询（原实现：XHR + FormData(EnterpriseName/CertificateCode)）
 * 返回 null 表示未查询到记录
 */
export async function lookupCertificate(
  params: CertificateQueryParams,
): Promise<CertificateResult | null> {
  const r = await postForm<Record<string, unknown>>("CertificateLookup", {
    EnterpriseName: params.enterpriseName,
    CertificateCode: params.certificateCode,
  });
  // 原逻辑：CNProvince 非空视为查到
  if (!r || r.CNProvince === undefined || r.CNProvince === null || r.CNProvince === "") {
    return null;
  }
  const grade = (r.Grade as string) || "AAA";
  return {
    companyName: params.enterpriseName,
    certId: params.certificateCode,
    status: (r.Valid as string) || "有效",
    grade,
    region: `${r.CNProvince ?? ""} / ${r.CNCity ?? ""} / ${r.CNArea ?? ""}`,
    industry: (r.Industry as string) || "",
    year: `${String(r.NF)}年度`,
    result: ["A", "AA", "AAA"].includes(grade) ? "合格" : "不合格",
    ratingType: (r.RatingType as string) || "",
  };
}

/* ---------------- 金融产品 ---------------- */
export interface RawFinancialProduct {
  CPMC?: string;
  JGMC?: string;
  Class?: string;
  CPLX?: string;
  FLFW?: string;
  LLFW?: string;
  GradeShow?: string;
  Keyword1?: string;
  [key: string]: unknown;
}

export interface FinancialProduct {
  id: number;
  title: string;
  bank: string;
  rate: string;
  rateLabel: string;
  type: string;
  requiredRating: string;
  amount: string;
  description: string;
  features: string[];
  iconType: "insurance" | "fund" | "bond" | "supply-chain" | "default";
  color: string;
  hot: boolean;
}

/** 产品图标类型映射（原产物：保险/基金/债券/供应链 正则） */
export function productIconType(cplx: string): FinancialProduct["iconType"] {
  if (/保险/.test(cplx)) return "insurance";
  if (/基金/.test(cplx)) return "fund";
  if (/债券/.test(cplx)) return "bond";
  if (/供应链/.test(cplx)) return "supply-chain";
  return "default";
}

/** 产品颜色映射（原产物逐字） */
export function productColor(type: string): string {
  if (/保险/.test(type)) return "#0E7490";
  if (/基金/.test(type)) return "#1A5319";
  if (/债券/.test(type)) return "#92400E";
  if (/供应链/.test(type)) return "#5B21B6";
  return "#003366";
}

/** 评级等级归一化：接口 GradeShow 返回数字（1/2/3），兜底数据是中文标签
 *   3 / AAA → AAA级专属（最高）
 *   2 / AA  → AA级及以上
 *   1 / A   → A级及以上
 */
export function ratingLabel(r: unknown): string {
  const s = String(r ?? "").trim();
  if (s === "3" || s === "AAA" || s === "AAA级专属") return "AAA级专属";
  if (s === "2" || s === "AA" || s === "AA级及以上") return "AA级及以上";
  if (s === "1" || s === "A" || s === "A级及以上") return "A级及以上";
  return s; // 其他值原样保留（兼容未知格式）
}

/** 原始产品 → 展示产品（原产物 mp 函数逐字迁移 + 评级归一化） */
export function mapProduct(p: RawFinancialProduct, i: number): FinancialProduct {
  const cplx = p.CPLX || "";
  const cls = p.Class || "";
  return {
    id: i + 1,
    title: p.CPMC || "",
    bank: p.JGMC || "",
    rate: cls === "保险" ? p.FLFW || "" : p.LLFW || "",
    rateLabel: cls === "保险" ? "年费率" : "年利率",
    type: cplx || cls,
    requiredRating: ratingLabel(p.GradeShow),   // 数字 → 中文等级标签
    amount: "",
    description: p.Keyword1 || "",
    features: (p.Keyword1 || "").split(/[、,，]/).slice(0, 3),
    iconType: productIconType(cplx),
    color: productColor(cplx),
    hot: false,
  };
}

/** 金融产品查询（FormData POST FinancialProductLookup） */
export async function fetchFinancialProducts(params: {
  "官网首页显示"?: string;
  "官网本周热门推荐"?: string;
}): Promise<RawFinancialProduct[]> {
  const r = await postForm<RawFinancialProduct[] | Record<string, unknown>>("FinancialProductLookup", params);
  return Array.isArray(r) ? r : [];
}

/** 产品类型下拉（POST FinancialProductTypeList） */
export async function fetchProductTypes(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/FinancialProductTypeList`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const d = (await res.json()) as unknown;
    return Array.isArray(d) ? (d as string[]) : [];
  } catch {
    return [];
  }
}

/* ---------------- 合作申请 ---------------- */
export interface CooperationForm {
  EnterpriseName: string;
  EnterpriseCode: string;
  Linkman: string;
  Post: string;
  Tel: string;
  EMail: string;
  OfficiaWebsiteUrl: string;
  Memo: string;
  OrgType: string;
  Region: string;
}

/**
 * 合作申请提交（原实现：FormData(form) → POST CooperationApplication）
 * 返回 { ok, message } —— Message 非空为失败提示，否则成功
 */
export async function submitCooperation(
  data: CooperationForm,
): Promise<{ ok: boolean; message?: string }> {
  const r = await postForm<{ Message?: string }>("CooperationApplication", { ...data });
  if (r && r.Message) return { ok: false, message: r.Message };
  return { ok: true };
}
