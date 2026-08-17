import {
  Landmark,
  Leaf,
  Link2,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import type { FinancialProduct } from "../api/client";

/** 按 iconType 映射图标（原产物 $l/Od/ki/Io 的 lucide 对应） */
export function ProductIcon({ type, className }: { type: FinancialProduct["iconType"]; className?: string }) {
  switch (type) {
    case "insurance":
      return <ShieldCheck className={className} />;
    case "fund":
      return <TrendingUp className={className} />;
    case "bond":
      return <Landmark className={className} />;
    case "supply-chain":
      return <Link2 className={className} />;
    default:
      return <Leaf className={className} />;
  }
}

/** 产品卡片（首页 + 金融超市复用；风格对齐原产物）
 *  若传入 index，头部按深蓝(#003366)/深绿(#1A5319)交替，与金融超市 B2ProductCard 保持一致
 */
export default function ProductCard({ p, index }: { p: FinancialProduct; index?: number }) {
  const headerColor =
    index !== undefined ? (index % 2 === 1 ? "#1A5319" : "#003366") : p.color;
  return (
    <div className="bg-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
      {/* 头部色块 */}
      <div className="p-6 text-white" style={{ background: `linear-gradient(135deg, ${headerColor} 0%, ${headerColor}dd 100%)` }}>
        <div className="flex items-center justify-between mb-4">
          <ProductIcon type={p.iconType} className="w-10 h-10" />
          <div className="text-right">
            <div className="text-3xl font-bold">{p.rate}</div>
            <div className="text-sm opacity-90">{p.rateLabel}</div>
          </div>
        </div>
        <h3 className="text-xl font-bold mb-1">{p.title}</h3>
        <div className="text-sm opacity-90">{p.bank}</div>
      </div>
      {/* 内容区 */}
      <div className="p-6">
        {p.description && (
          <p className="text-gray-600 mb-5 leading-relaxed text-sm">{p.description}</p>
        )}
        {/* 标签行 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {p.type && (
            <span className="px-2.5 py-1 bg-[#1A5319]/10 text-[#1A5319] text-xs rounded-full font-medium">
              {p.type}
            </span>
          )}
          {p.requiredRating && (
            <span className="px-2.5 py-1 bg-[#D4AF37]/15 text-[#92400E] text-xs rounded-full font-medium">
              {p.requiredRating}
            </span>
          )}
          {p.amount && (
            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
              {p.amount}
            </span>
          )}
        </div>
        {/* 特性列表 */}
        {p.features.length > 0 && (
          <ul className="space-y-2">
            {p.features.map((f, i) => (
              <li key={i} className="flex items-start gap-2">
                <Leaf className="w-4 h-4 text-[#1A5319] flex-shrink-0 mt-0.5" />
                <span className="text-xs text-gray-700 leading-relaxed">{f}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
