import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, ChevronDown, Leaf, ShieldCheck, Sparkles } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { fetchFinancialProducts, mapProduct, type FinancialProduct } from "../api/client";

/** 首页绿色金融兜底数据（原产物 O2 组件兜底逐字迁移） */
const HOME_FALLBACK: FinancialProduct[] = [
  { id: 1, title: "碳挂钩贷款", bank: "绿色资本银行", rate: "年利率 3.2%", rateLabel: "", type: "", requiredRating: "", amount: "", description: "利率与碳减排目标挂钩。实现可持续发展目标的同时，享受更优惠的贷款条件。", features: ["最高1000万元", "5-10年期限", "绩效浮动利率"], iconType: "default", color: "#1A5319", hot: false },
  { id: 2, title: "可持续增长信贷", bank: "生态金融合作伙伴", rate: "年利率 3.8%", rateLabel: "", type: "", requiredRating: "", amount: "", description: "为投资可再生能源和绿色基础设施的企业提供灵活的信贷额度，支持企业绿色转型。", features: ["循环信贷", "快速审批", "税收优惠"], iconType: "default", color: "#003366", hot: false },
  { id: 3, title: "ESG卓越融资", bank: "未来地球银行", rate: "年利率 2.9%", rateLabel: "", type: "", requiredRating: "", amount: "", description: "为顶级绿色企业提供优惠利率。AAA评级企业专享，享受行业最低利率和优先服务。", features: ["最低利率", "优先服务", "全球通用"], iconType: "supply-chain", color: "#1A5319", hot: false },
];

/** 星空点装饰（纯 box-shadow，无图依赖；30 颗随机分布） */
const STARS = Array.from({ length: 36 }, (_, i) => ({
  top: `${(i * 73) % 100}%`,
  left: `${(i * 137) % 100}%`,
  size: i % 5 === 0 ? 2.5 : i % 3 === 0 ? 1.8 : 1.2,
  opacity: 0.4 + ((i * 17) % 60) / 100,
  delay: `${(i % 7) * 0.4}s`,
}));

/** 首页 */
export default function Home() {
  const [products, setProducts] = useState<FinancialProduct[]>(HOME_FALLBACK);

  useEffect(() => {
    let alive = true;
    fetchFinancialProducts({ 官网首页显示: "true", 官网本周热门推荐: "false" }).then((raw) => {
      if (!alive) return;
      const mapped = raw.map(mapProduct);
      if (mapped.length) setProducts(mapped.slice(0, 3));
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div>
      {/* ========== Hero 区（深蓝星空 + 地球弧线，对照 uat 站视觉） ========== */}
      <section className="relative bg-gradient-to-br from-[#001a3d] via-[#003366] to-[#1A5319] text-white overflow-hidden min-h-[560px] flex items-center">
        {/* 星空点 */}
        {STARS.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              top: s.top,
              left: s.left,
              width: `${s.size}px`,
              height: `${s.size}px`,
              opacity: s.opacity,
              animationDelay: s.delay,
            }}
          />
        ))}

        {/* 顶部柔光（模拟星云） */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#1A5319]/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#003366]/40 blur-3xl" />

        {/* 地球弧线（底部） */}
        <svg
          className="absolute bottom-0 left-0 w-full h-[200px] pointer-events-none"
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
          aria-hidden
        >
          {/* 大气光晕 */}
          <defs>
            <radialGradient id="glow" cx="50%" cy="100%" r="50%">
              <stop offset="0%" stopColor="#1A5319" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#1A5319" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="earth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a2540" />
              <stop offset="100%" stopColor="#001a3d" />
            </linearGradient>
          </defs>
          {/* 地球球体下半圆（地平线弧） */}
          <path d="M -50 200 Q 720 60 1490 200 Z" fill="url(#earth)" />
          {/* 地球辉光（边缘亮线） */}
          <path d="M -50 200 Q 720 60 1490 200" stroke="url(#glow)" strokeWidth="3" fill="none" />
          {/* 大气光 */}
          <path d="M -50 200 Q 720 80 1490 200" stroke="#1A5319" strokeWidth="1" strokeOpacity="0.5" fill="none" />
          {/* 表面地形线（点缀城市灯光感） */}
          <g opacity="0.35">
            {Array.from({ length: 8 }, (_, i) => (
              <circle key={i} cx={120 + i * 180 + (i % 3) * 25} cy={180 - i * 3} r="1.2" fill="#D4AF37" />
            ))}
          </g>
        </svg>

        {/* Hero 内容 */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 w-full">
          <div className="max-w-3xl">
            {/* 徽章 */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 mb-6 text-sm">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span>专业可持续发展评估平台</span>
            </div>

            {/* 主标题 */}
            <h1 className="text-4xl md:text-6xl font-bold mb-3 leading-tight">
              企业绿色评级系统
            </h1>
            <p className="text-blue-200/90 text-lg md:text-xl mb-2 tracking-wide">
              Enterprise Green Rating System
            </p>
            <p className="text-white/80 text-base md:text-lg max-w-2xl mb-10 leading-relaxed">
              为企业提供绿色评级、证书查询与绿色金融对接服务，
              <br className="hidden md:block" />
              助力企业低碳转型与可持续发展。
            </p>

            {/* CTA 按钮组 */}
            <div className="flex flex-wrap gap-4">
              <Link
                to="/certificate-query"
                className="inline-flex items-center gap-2 bg-[#D4AF37] hover:bg-[#C19B2E] text-[#003366] px-7 py-3.5 rounded-lg font-bold transition-all hover:shadow-2xl hover:-translate-y-0.5"
              >
                <BadgeCheck className="w-5 h-5" /> 证书查询
              </Link>
              <Link
                to="/financial-supermarket"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur text-white px-7 py-3.5 rounded-lg font-semibold transition-all"
              >
                <ShieldCheck className="w-5 h-5" /> 金融产品超市
              </Link>
            </div>

            {/* 信任标识 */}
            <div className="flex flex-wrap items-center gap-6 mt-12 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-[#1A5319]" />
                国家发改委标准
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#1A5319]" />
                央行金融目录
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-[#1A5319]" />
                证监会认证
              </div>
            </div>
          </div>
        </div>

        {/* 滚动指示器 */}
        <a
          href="#features"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 text-white/60 hover:text-white text-xs animate-bounce"
        >
          <span>向下滚动</span>
          <ChevronDown className="w-5 h-5" />
        </a>
      </section>

      {/* ========== 核心服务（3 卡）========== */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-[#003366] mb-3 text-center">核心服务</h2>
        <p className="text-center text-gray-500 mb-10">为绿色转型全链路提供专业支撑</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: "绿色评级", desc: "企业绿色发展水平专业评估", to: "/process", icon: BadgeCheck },
            { title: "证书查询", desc: "在线验证绿色评级证书真伪", to: "/certificate-query", icon: ShieldCheck },
            { title: "绿色金融", desc: "绿色信贷、绿色债券产品超市", to: "/financial-supermarket", icon: Leaf },
          ].map((card) => (
            <Link
              key={card.title}
              to={card.to}
              className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-7 hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1A5319] to-[#003366] flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform">
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-2">{card.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
              <div className="mt-4 text-sm text-[#1A5319] font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                了解更多 <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ========== 绿色金融服务（接口 + 兜底）========== */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#003366] mb-4">绿色金融服务</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">来自合作金融机构的专属融资产品</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {products.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              to="/financial-supermarket"
              className="inline-flex items-center gap-2 bg-[#1A5319] hover:bg-[#0d3a14] text-white px-8 py-3.5 rounded-lg font-semibold transition-colors"
            >
              进入金融超市 <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========== 平台保障 ========== */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-[#003366] mb-6">为什么选择我们</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "权威标准接入", desc: "评级标准以国家发改委和生态环境部公布的核算方法与报告指南为核心" },
              { title: "AI智能评估", desc: "70%定量指标 + 30%定性评估，确保评级的专业性和准确性" },
              { title: "金融场景对接", desc: "直接对接绿色信贷、绿色债券、碳金融等产品场景" },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#1A5319] to-[#003366] flex items-center justify-center shrink-0">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
