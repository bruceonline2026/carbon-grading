import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Leaf } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { fetchFinancialProducts, mapProduct, type FinancialProduct } from "../api/client";

/** 首页绿色金融兜底数据（原产物 O2 组件兜底逐字迁移） */
const HOME_FALLBACK: FinancialProduct[] = [
  { id: 1, title: "碳挂钩贷款", bank: "绿色资本银行", rate: "年利率 3.2%", rateLabel: "", type: "", requiredRating: "", amount: "", description: "利率与碳减排目标挂钩。实现可持续发展目标的同时，享受更优惠的贷款条件。", features: ["最高1000万元", "5-10年期限", "绩效浮动利率"], iconType: "default", color: "#1A5319", hot: false },
  { id: 2, title: "可持续增长信贷", bank: "生态金融合作伙伴", rate: "年利率 3.8%", rateLabel: "", type: "", requiredRating: "", amount: "", description: "为投资可再生能源和绿色基础设施的企业提供灵活的信贷额度，支持企业绿色转型。", features: ["循环信贷", "快速审批", "税收优惠"], iconType: "default", color: "#003366", hot: false },
  { id: 3, title: "ESG卓越融资", bank: "未来地球银行", rate: "年利率 2.9%", rateLabel: "", type: "", requiredRating: "", amount: "", description: "为顶级绿色企业提供优惠利率。AAA评级企业专享，享受行业最低利率和优先服务。", features: ["最低利率", "优先服务", "全球通用"], iconType: "supply-chain", color: "#1A5319", hot: false },
];

/** 首页（阶段B：hero + 核心入口 + 绿色金融服务区块） */
export default function Home() {
  const [products, setProducts] = useState<FinancialProduct[]>(HOME_FALLBACK);

  useEffect(() => {
    let alive = true;
    // 首页产品（官网首页显示=true 且 非本周推荐）
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
      {/* Hero 区（深蓝 banner，与官网视觉一致） */}
      <section className="bg-gradient-to-r from-[#003366] to-[#0a2a52] text-white">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">企业绿色评级系统</h1>
          <p className="text-blue-200/90 max-w-2xl mb-8">
            专业可持续发展评估平台，为企业提供绿色评级、证书查询与绿色金融服务，
            助力企业低碳转型与绿色金融对接。
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/certificate-query"
              className="bg-[#D4AF37] hover:bg-[#C19B2E] text-[#003366] px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              证书查询
            </Link>
            <Link
              to="/financial-supermarket"
              className="bg-white/10 hover:bg-white/20 border border-white/30 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              金融产品超市
            </Link>
          </div>
        </div>
      </section>

      {/* 核心功能入口 */}
      <section className="max-w-7xl mx-auto px-6 py-14">
        <h2 className="text-2xl font-bold text-[#003366] mb-8 text-center">核心服务</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: "绿色评级", desc: "企业绿色发展水平专业评估", to: "/process" },
            { title: "证书查询", desc: "在线验证绿色评级证书真伪", to: "/certificate-query" },
            { title: "绿色金融", desc: "绿色信贷、绿色债券产品超市", to: "/financial-supermarket" },
          ].map((card) => (
            <Link
              key={card.title}
              to={card.to}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#1A5319] to-[#003366] flex items-center justify-center mb-4">
                <span className="text-white font-bold text-lg">{card.title[0]}</span>
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-1">{card.title}</h3>
              <p className="text-sm text-gray-500">{card.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 绿色金融服务（接口 + 兜底） */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
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

      {/* 服务流程简述 */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-[#003366] mb-6">为什么选择我们</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: "标准", title: "权威标准接入", desc: "评级标准以国家发改委和生态环境部公布的核算方法与报告指南为核心" },
              { icon: "智能", title: "AI智能评估", desc: "70%定量指标 + 30%定性评估，确保评级的专业性和准确性" },
              { icon: "对接", title: "金融场景对接", desc: "直接对接绿色信贷、绿色债券等金融产品场景" },
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
