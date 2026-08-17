import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
  Award,
  Brain,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileCheck2,
  Handshake,
  Landmark,
  ShieldCheck,
} from "lucide-react";
import ProductCard from "../components/ProductCard";
import { entUrl } from "../config";
import { fetchFinancialProducts, mapProduct, type FinancialProduct } from "../api/client";

/** 首页绿色金融兜底数据（原产物 O2 组件兜底逐字迁移） */
const HOME_FALLBACK: FinancialProduct[] = [
  { id: 1, title: "碳挂钩贷款", bank: "绿色资本银行", rate: "年利率 3.2%", rateLabel: "", type: "", requiredRating: "", amount: "", description: "利率与碳减排目标挂钩。实现可持续发展目标的同时，享受更优惠的贷款条件。", features: ["最高1000万元", "5-10年期限", "绩效浮动利率"], iconType: "default", color: "#1A5319", hot: false },
  { id: 2, title: "可持续增长信贷", bank: "生态金融合作伙伴", rate: "年利率 3.8%", rateLabel: "", type: "", requiredRating: "", amount: "", description: "为投资可再生能源和绿色基础设施的企业提供灵活的信贷额度，支持企业绿色转型。", features: ["循环信贷", "快速审批", "税收优惠"], iconType: "default", color: "#003366", hot: false },
  { id: 3, title: "ESG卓越融资", bank: "未来地球银行", rate: "年利率 2.9%", rateLabel: "", type: "", requiredRating: "", amount: "", description: "为顶级绿色企业提供优惠利率。AAA评级企业专享，享受行业最低利率和优先服务。", features: ["最低利率", "优先服务", "全球通用"], iconType: "supply-chain", color: "#1A5319", hot: false },
];

const BANNER_URL = "/images/banner5.jpg";

/* ================= hero（原产物 L2 组件） ================= */
function Hero() {
  return (
    <section id="home" className="relative h-[700px] flex items-center overflow-hidden">
      {/* 背景图 + 遮罩 */}
      <div className="absolute inset-0 z-0">
        <img src={BANNER_URL} alt="企业绿色评级系统" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60 md:hidden pointer-events-none" />
        <div className="absolute inset-0 hidden md:block bg-gradient-to-r from-black/50 via-black/25 via-30% to-transparent to-50% pointer-events-none" />
      </div>
      {/* 内容（左对齐） */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        <div className="pl-8">
          <h1
            className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-white text-left max-w-2xl"
            style={{ textShadow: "0 1px 6px rgba(0, 0, 0, 0.12)" }}
          >
            绿色评级，
            <br />
            定义未来价值
          </h1>
          <p
            className="text-lg md:text-xl mb-10 opacity-95 text-white text-left max-w-2xl"
            style={{ textShadow: "0 1px 5px rgba(0, 0, 0, 0.1)" }}
          >
            基于国家标准与AI大数据，
            <br />
            提供权威、可信的企业绿色资信评估
          </p>
          <div className="text-left">
            <a href={`${entUrl}/#EnterpriseRegistration@1`}>
              <button className="bg-white hover:bg-[#4ADE80] text-[#1A5319] px-12 py-4 rounded-lg transition-all duration-300 shadow-2xl hover:shadow-[0_20px_50px_rgba(74,222,128,0.4)] font-semibold text-lg hover:-translate-y-1 hover:scale-105">
                立即注册
              </button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================= 绿色金融服务（原产物 O2 组件） ================= */
function GreenFinance({ products }: { products: FinancialProduct[] }) {
  return (
    <section id="marketplace" className="py-24 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-[#003366] mb-4">绿色金融服务</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">来自合作金融机构的专属融资产品</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {products.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
        <div className="text-center mt-12">
          <Link
            to="/financial-supermarket"
            className="inline-flex items-center gap-2 bg-[#1A5319] hover:bg-[#0d3a14] text-white px-10 py-4 rounded-lg font-semibold transition-colors"
          >
            查看全部产品 <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ================= 流程化评级体系（原产物 _2 组件） ================= */
const PROCESS_STEPS = [
  { icon: ClipboardList, title: "提交数据", desc: "注册并填报企业信息", details: ["注册企业账户", "填报结构化信息", "获取填报指引"] },
  { icon: Brain, title: "AI分析", desc: "智能评估与建模", details: ["数据清洗与标准化", "智能模型评估", "生成初步评级"] },
  { icon: FileCheck2, title: "生成报告和证书", desc: "专业成果交付", details: ["报告自动生成", "证书签发与核验", "成果交付与应用"] },
  { icon: Handshake, title: "金融对接", desc: "开启绿色金融机遇", details: ["金融产品智能匹配", "一键启动对接", "持续服务与优化"] },
];

function ProcessSection() {
  const [hovered, setHovered] = useState<number | null>(null);
  return (
    <section id="process" className="pt-32 pb-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-[#003366] mb-4">流程化评级体系</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">四个简单步骤，开启绿色金融机遇</p>
        </div>
        <div className="relative">
          {/* 桌面：4 列 */}
          <div className="hidden md:block">
            <div className="grid grid-cols-4 gap-8 relative">
              {PROCESS_STEPS.map((step, i) => (
                <div key={step.title} className="relative">
                  <div
                    className={
                      "relative flex flex-col items-center transition-all duration-300 cursor-pointer " +
                      (hovered === i ? "transform -translate-y-2" : "")
                    }
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <div
                      className={
                        "w-32 h-32 rounded-full flex items-center justify-center mb-6 shadow-xl relative z-10 transition-all duration-300 " +
                        (i % 2 === 0 ? "bg-[#1A5319]" : "bg-[#003366]") +
                        (hovered === i ? " shadow-2xl scale-110 ring-4 ring-[#4ADE80]/30" : "")
                      }
                    >
                      <step.icon className="w-12 h-12 text-white" />
                    </div>
                    <div className="text-sm font-semibold text-[#D4AF37] mb-2">第 {i + 1} 步</div>
                    <h4
                      className={
                        "text-lg font-semibold text-center mb-2 transition-colors duration-300 " +
                        (hovered === i ? "text-[#1A5319]" : "text-[#003366]")
                      }
                    >
                      {step.title}
                    </h4>
                    <p className="text-sm text-gray-600 text-center mb-4">{step.desc}</p>
                    <div
                      className={
                        "transition-all duration-300 overflow-hidden " +
                        (hovered === i ? "max-h-48 opacity-100" : "max-h-0 opacity-0")
                      }
                    >
                      <div className="bg-white rounded-lg p-4 shadow-lg border border-gray-100 mt-2">
                        {step.details.map((d) => (
                          <div key={d} className="flex items-start gap-2 mb-2 last:mb-0">
                            <CheckCircle2 className="w-4 h-4 text-[#1A5319] flex-shrink-0 mt-0.5" />
                            <span className="text-xs text-gray-700 leading-relaxed">{d}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {i < PROCESS_STEPS.length - 1 && (
                    <div className="absolute top-16 -right-4 z-0 hidden xl:block">
                      <ChevronDown className="w-8 h-8 text-[#D4AF37] rotate-[-90deg]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* 移动端：纵向列表 */}
          <div className="md:hidden space-y-6">
            {PROCESS_STEPS.map((step, i) => (
              <div key={step.title} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-start gap-4">
                  <div
                    className={
                      "w-16 h-16 rounded-full flex items-center justify-center shadow-lg flex-shrink-0 " +
                      (i % 2 === 0 ? "bg-[#1A5319]" : "bg-[#003366]")
                    }
                  >
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-[#D4AF37] mb-1">第 {i + 1} 步</div>
                    <h4 className="text-lg font-semibold mb-2 text-[#003366]">{step.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{step.desc}</p>
                    <div className="space-y-2 pl-2 border-l-2 border-[#1A5319]/20">
                      {step.details.map((d) => (
                        <div key={d} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#1A5319] flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-gray-700 leading-relaxed">{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================= 核心价值主张（原产物 F2 组件） ================= */
const VALUES = [
  { icon: Award, title: "权威标准接入", color: "#1A5319", desc: "评级标准以国家发改委和生态环境部公布的《企业温室气体排放核算方法与报告指南》为核心，以中国人民银行、金融监管总局、中国证监会发布的《绿色金融支持项目目录（2025年版）》为绿色导向。" },
  { icon: Brain, title: "AI智能评估", color: "#003366", desc: "严谨的评估方法，结合70%定量指标（碳排放、能源效率）和30%定性评估（管理实践、公司治理），确保评级的专业性和准确性。" },
  { icon: Landmark, title: "金融场景对接", color: "#1A5319", desc: "直接对接绿色信贷和可持续融资渠道。与合作银行建立联系，享受优惠贷款条件和投资机会，助力企业绿色发展。" },
  { icon: ShieldCheck, title: "安全可信", color: "#003366", desc: "军事级加密数据存储和法律级电子合同管理。您的敏感商业信息受到企业级安全协议的全方位保护，确保数据安全无忧。" },
];

function ValueSection() {
  return (
    <section id="services" className="pt-32 pb-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-[#003366] mb-4">核心价值主张</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            践行“标准+技术+金融”三位一体协同模式，构建企业可持续卓越发展的综合平台。
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-t-4 hover:-translate-y-1"
              style={{ borderTopColor: v.color }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
                style={{ backgroundColor: `${v.color}15` }}
              >
                <v.icon className="w-8 h-8" style={{ color: v.color }} />
              </div>
              <h3 className="text-2xl font-semibold mb-4" style={{ color: v.color }}>
                {v.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================= 合作机构（原产物 I2 组件） ================= */
const PARTNERS = [
  { nameCN: "上海环境能源交易所", nameEN: "Shanghai Environment and Energy Exchange", abbreviation: "SEEE", logo: "/images/seee_logo.png" },
  { nameCN: "中国节能协会", nameEN: "China Energy Conservation Association (CECA)", abbreviation: "CECA" },
  { nameCN: "SGS", nameEN: "SGS SA", abbreviation: "SGS" },
  { nameCN: "中国农业银行", nameEN: "Agricultural Bank of China (ABC)", abbreviation: "ABC" },
  { nameCN: "民生银行", nameEN: "China Minsheng Bank (CMBC)", abbreviation: "CMBC" },
  { nameCN: "光大银行", nameEN: "China Everbright Bank", abbreviation: "CEB" },
  { nameCN: "广发银行", nameEN: "China Guangfa Bank", abbreviation: "CGB" },
  { nameCN: "上海银行", nameEN: "Bank of Shanghai", abbreviation: "BOS" },
  { nameCN: "浙商银行", nameEN: "CZBANK", abbreviation: "CZB" },
  { nameCN: "浦发银行", nameEN: "SPD BANK", abbreviation: "SPDB" },
  { nameCN: "上海农商银行", nameEN: "Shanghai Rural Commercial Bank (SRCB)", abbreviation: "SRCB" },
  { nameCN: "杭州银行", nameEN: "Bank of Hangzhou", abbreviation: "BOH" },
  { nameCN: "平安财产保险", nameEN: "Ping An Property & Casualty Insurance", abbreviation: "PAPC" },
  { nameCN: "太平洋财产保险", nameEN: "China Pacific Property Insurance (CPIC)", abbreviation: "CPIC" },
];

function PartnerSection() {
  const [hovered, setHovered] = useState<number | null>(null);
  return (
    <section id="partners" className="pt-32 pb-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-[#003366] mb-4">合作机构</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">携手权威机构，共建绿色金融生态</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {PARTNERS.map((p, i) => (
            <div
              key={p.nameCN}
              className={
                "bg-white rounded-xl p-6 border border-gray-200 shadow-sm transition-all duration-300 flex flex-col items-center text-center cursor-pointer " +
                (hovered === i
                  ? "shadow-xl -translate-y-2 border-[#1A5319] bg-gradient-to-b from-white to-gray-50"
                  : "hover:shadow-lg hover:-translate-y-1")
              }
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <div
                className={
                  "w-full h-20 flex items-center justify-center mb-4 transition-all duration-300 rounded-lg " +
                  (hovered === i ? "scale-105 bg-[#1A5319]/5 ring-2 ring-[#1A5319]/30" : "bg-gray-50")
                }
              >
                {p.logo ? (
                  <img src={p.logo} alt={p.nameCN} className="max-w-full max-h-full object-contain px-2" style={{ maxWidth: "140px", maxHeight: "64px" }} />
                ) : (
                  <span
                    className={
                      "font-bold text-xl transition-colors duration-300 " +
                      (hovered === i ? "text-[#1A5319]" : "text-[#003366]")
                    }
                  >
                    {p.abbreviation}
                  </span>
                )}
              </div>
              <h3
                className={
                  "text-base font-semibold mb-2 leading-tight transition-colors duration-300 min-h-[44px] flex items-center justify-center " +
                  (hovered === i ? "text-[#1A5319]" : "text-[#003366]")
                }
              >
                {p.nameCN}
              </h3>
              <p
                className={
                  "text-xs leading-snug transition-colors duration-300 min-h-[32px] " +
                  (hovered === i ? "text-gray-700" : "text-gray-500")
                }
              >
                {p.nameEN}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================= 首页主组件（原产物 V2） ================= */
export default function Home() {
  const [products, setProducts] = useState<FinancialProduct[]>(HOME_FALLBACK);
  const location = useLocation();

  // 支持锚点定位（菜单"流程/服务/合作伙伴" → /#process /#services /#partners）
  // 用 useLocation 监听路由变化（hashchange 事件在 React Router 跳转中不一定会触发）
  useEffect(() => {
    const hash = location.hash;
    if (!hash) return;
    const el = document.querySelector(hash) as HTMLElement | null;
    if (el) {
      // CSS scroll-margin-top 自动补偿 sticky NavBar 高度
      setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    }
  }, [location.pathname, location.hash]);

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
    <div className="min-h-screen bg-white">
      <Hero />
      <GreenFinance products={products} />
      <ProcessSection />
      <ValueSection />
      <PartnerSection />
    </div>
  );
}
