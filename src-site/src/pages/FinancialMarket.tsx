import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Filter, Flame, Search, SlidersHorizontal, X } from "lucide-react";
import { ProductIcon } from "../components/ProductCard";
import {
  fetchFinancialProducts,
  fetchProductTypes,
  mapProduct,
  type FinancialProduct,
} from "../api/client";

/* 金融超市 12 兜底产品（与 uat B2 y 数组逐字一致） */
const FALLBACK_PRODUCTS: FinancialProduct[] = [
  { id: 1, title: "碳挂钩贷款", bank: "绿色资本银行", rate: "3.2%", rateLabel: "年利率", type: "绿色贷款", requiredRating: "AA级及以上", amount: "最高1000万元", description: "", features: ["最高1000万元", "5-10年期限", "绩效浮动利率"], iconType: "default", color: "#1A5319", hot: true },
  { id: 2, title: "可持续增长信贷", bank: "生态金融合作伙伴", rate: "3.8%", rateLabel: "年利率", type: "绿色贷款", requiredRating: "A级及以上", amount: "500万-2000万", description: "", features: ["循环信贷", "快速审批", "税收优惠"], iconType: "default", color: "#003366", hot: false },
  { id: 3, title: "ESG卓越融资", bank: "未来地球银行", rate: "2.9%", rateLabel: "年利率", type: "绿色贷款", requiredRating: "AAA级专属", amount: "2000万以上", description: "", features: ["最低利率", "优先服务", "全球通用"], iconType: "supply-chain", color: "#1A5319", hot: true },
  { id: 4, title: "节能改造专项贷", bank: "中国银行", rate: "3.5%", rateLabel: "年利率", type: "绿色贷款", requiredRating: "AA级及以上", amount: "500万以下", description: "", features: ["专项用途", "灵活还款", "政策补贴"], iconType: "default", color: "#003366", hot: false },
  { id: 5, title: "绿色债券发行支持", bank: "浦发银行", rate: "4.2%", rateLabel: "年利率", type: "绿色债券", requiredRating: "AAA级专属", amount: "2000万以上", description: "", features: ["全程辅导", "发行担保", "市场认购"], iconType: "bond", color: "#1A5319", hot: true },
  { id: 6, title: "碳中和转型基金", bank: "建设银行", rate: "预期收益 6.5%", rateLabel: "预期收益", type: "碳中和基金", requiredRating: "A级及以上", amount: "500万-2000万", description: "", features: ["专业管理", "分散风险", "ESG筛选"], iconType: "fund", color: "#003366", hot: false },
  { id: 7, title: "绿能抵押融资", bank: "绿色资本银行", rate: "3.1%", rateLabel: "年利率", type: "绿色贷款", requiredRating: "AA级及以上", amount: "500万-2000万", description: "", features: ["设备抵押", "快速放款", "利率优惠"], iconType: "default", color: "#1A5319", hot: false },
  { id: 8, title: "小微绿色直通车", bank: "生态金融合作伙伴", rate: "4.5%", rateLabel: "年利率", type: "绿色贷款", requiredRating: "A级及以上", amount: "500万以下", description: "", features: ["无抵押", "30分钟审批", "当日放款"], iconType: "default", color: "#003366", hot: true },
  { id: 9, title: "碳减排支持工具对接贷款", bank: "未来地球银行", rate: "2.5%", rateLabel: "年利率", type: "绿色贷款", requiredRating: "AA级及以上", amount: "2000万以上", description: "", features: ["央行支持", "超低利率", "长期稳定"], iconType: "default", color: "#1A5319", hot: true },
  { id: 10, title: "可再生能源项目债券", bank: "中国银行", rate: "3.9%", rateLabel: "年利率", type: "绿色债券", requiredRating: "AAA级专属", amount: "2000万以上", description: "", features: ["项目专用", "税收减免", "政府背书"], iconType: "bond", color: "#003366", hot: false },
  { id: 11, title: "ESG主题投资基金", bank: "浦发银行", rate: "预期收益 7.2%", rateLabel: "预期收益", type: "碳中和基金", requiredRating: "AA级及以上", amount: "500万-2000万", description: "", features: ["国际标准", "透明披露", "长期回报"], iconType: "fund", color: "#1A5319", hot: false },
  { id: 12, title: "绿色供应链金融", bank: "建设银行", rate: "3.6%", rateLabel: "年利率", type: "绿色贷款", requiredRating: "A级及以上", amount: "500万-2000万", description: "", features: ["链式授信", "应收账款融资", "灵活周转"], iconType: "supply-chain", color: "#003366", hot: false },
];

const TYPE_OPTIONS = ["全部", "其他金融产品", "绿色金融产品", "绿色转型金融产品", "供应链金融产品", "绿色保险", "绿色转型保险", "其他保险产品", "投资理财"];
const RATING_OPTIONS = ["全部", "AAA级专属", "AA级及以上", "A级及以上"];
const AMOUNT_OPTIONS = ["全部", "500万以下", "500万-2000万", "2000万以上"];
const BANK_OPTIONS = ["全部", "绿色资本银行", "生态金融合作伙伴", "未来地球银行", "中国银行", "浦发银行", "建设银行"];

/* 评级等级：数字越大等级越高（接口 GradeShow 返回 1/2/3；1=A 级，2=AA 级，3=AAA 级）
 * 选 N 级及以上 = 匹配所有等级 >= N 的产品（阶梯语义，用数字比较而非字符串包含） */
const RATING_LEVEL: Record<string, number> = {
  "AAA级专属": 3,
  "AA级及以上": 2,
  "A级及以上": 1,
};

/** 产品评级等级 → 数字（用于 >= 比较） */
function ratingLevelValue(r: string): number {
  if (r === "AAA级专属") return 3;
  if (r === "AA级及以上") return 2;
  if (r === "A级及以上") return 1;
  return 0;
}

/* 筛选器（原产物 T 组件） */
function FilterSelect({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-[#1A5319] focus:border-transparent cursor-pointer text-sm"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <SlidersHorizontal className="absolute right-3 top-11 w-5 h-5 text-gray-400 pointer-events-none" />
    </div>
  );
}

/* uat B2 风格产品卡：绿/蓝交替顶部 + HOT 徽章 + 圆形图标 + 特性列表 */
function B2ProductCard({ p, idx }: { p: FinancialProduct; idx: number }) {
  const isEven = idx % 2 === 1;
  const headerColor = isEven ? "#1A5319" : "#003366";
  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1">
      {/* 顶部色块 */}
      <div className="p-6 text-white relative" style={{ background: `linear-gradient(135deg, ${headerColor} 0%, ${headerColor}dd 100%)` }}>
        {p.hot && (
          <div className="absolute top-3 right-3 bg-[#D4AF37] text-white text-xs font-bold px-2 py-1 rounded">
            HOT
          </div>
        )}
        <div className="flex items-center justify-between mb-4">
          <ProductIcon type={p.iconType} className="w-10 h-10" />
          <div className="text-right">
            <div className="text-3xl font-bold">{p.rate}</div>
            <div className="text-xs opacity-90">{p.rateLabel}</div>
          </div>
        </div>
        <h3 className="text-xl font-bold mb-1">{p.title}</h3>
        <div className="text-sm opacity-90">{p.bank}</div>
      </div>
      {/* 内容区 */}
      <div className="p-6">
        {p.requiredRating && (
          <div className="inline-block mb-4 px-3 py-1 bg-[#1A5319]/10 text-[#1A5319] text-xs font-semibold rounded-full">
            需 {p.requiredRating}
          </div>
        )}
        <ul className="space-y-2 mb-6">
          {p.features.map((f, i) => (
            <li key={i} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-sm text-gray-700">{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function FinancialMarket() {
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState("全部");
  const [rating, setRating] = useState("全部");
  const [amount, setAmount] = useState("全部");
  const [bank, setBank] = useState("全部");

  const [products, setProducts] = useState<FinancialProduct[]>(FALLBACK_PRODUCTS);
  const [hotProducts, setHotProducts] = useState<FinancialProduct[]>(FALLBACK_PRODUCTS.slice(0, 3));
  const [types, setTypes] = useState<string[]>(TYPE_OPTIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    fetchProductTypes().then((d) => {
      if (alive && d.length) setTypes(["全部"].concat(d));
    });

    fetchFinancialProducts({ 官网首页显示: "false", 官网本周热门推荐: "false" }).then((raw) => {
      if (!alive) return;
      const mapped = raw.map(mapProduct);
      if (mapped.length) setProducts(mapped);
    });

    fetchFinancialProducts({ 官网首页显示: "false", 官网本周热门推荐: "true" }).then((raw) => {
      if (!alive) return;
      const mapped = raw.map(mapProduct);
      if (mapped.length) setHotProducts(mapped.slice(0, 3));
    });

    const t = setTimeout(() => alive && setLoading(false), 1200);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, []);

  /** 5 维筛选（原产物 filter 逻辑改造）
 * - 产品类型：包含匹配（CPLX 字段可能是 "绿色金融产品,绿色转型金融产品,供应链金融产品" 逗号分隔）
 * - 评级：选 N 级及以上 = 匹配所有等级 ≥ N 的产品（阶梯匹配，不是简单 === 或 includes）
 */
  const filtered = useMemo(() => {
    return products.filter((p) => {
      const kwMatch =
        p.title.toLowerCase().includes(keyword.toLowerCase()) ||
        p.bank.toLowerCase().includes(keyword.toLowerCase());
      // 产品类型：包含匹配
      const typeMatch = type === "全部" || (p.type || "").includes(type);
      // 评级：数字等级比较（接口 GradeShow 为 1/2/3；选 N 级及以上 = 匹配 >=N）
      const ratingMatch =
        rating === "全部" ||
        ratingLevelValue(p.requiredRating) >= (RATING_LEVEL[rating] || 0);
      const amountMatch = amount === "全部" || p.amount.includes(amount.replace("万", ""));
      const bankMatch = bank === "全部" || p.bank === bank;
      return kwMatch && typeMatch && ratingMatch && amountMatch && bankMatch;
    });
  }, [products, keyword, type, rating, amount, bank]);

  const reset = () => {
    setKeyword("");
    setType("全部");
    setRating("全部");
    setAmount("全部");
    setBank("全部");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ========== Hero（深绿底 + 大标题 + 搜索框在内）========== */}
      <header className="bg-gradient-to-r from-[#1A5319] to-[#0d3a14] text-white py-8 shadow-lg">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">绿色金融超市</h1>
              <p className="text-lg opacity-90">精选绿色金融产品，助力企业可持续发展</p>
            </div>
            <Link
              to="/"
              className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-300 flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" /> 返回首页
            </Link>
          </div>
          {/* 搜索框（hero 内） */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="搜索金融机构或绿色产品名称..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
        </div>
      </header>

      {/* ========== 主体（左右两列）========== */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* ========== 左 aside（筛选 + 本周热门推荐小卡）========== */}
          <aside className="w-80 flex-shrink-0">
            {/* 筛选条件卡 */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-[#1A5319]" />
                  <h2 className="text-xl font-bold text-[#003366]">筛选条件</h2>
                </div>
                <button
                  onClick={reset}
                  className="text-sm text-gray-500 hover:text-[#1A5319] transition-colors flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> 重置
                </button>
              </div>
              <div className="space-y-4">
                <FilterSelect label="产品类型" value={type} onChange={setType} options={types} />
                <FilterSelect label="适用评级" value={rating} onChange={setRating} options={RATING_OPTIONS} />
                <FilterSelect label="融资额度" value={amount} onChange={setAmount} options={AMOUNT_OPTIONS} />
                <FilterSelect label="所属银行" value={bank} onChange={setBank} options={BANK_OPTIONS} />
              </div>
            </div>
            {/* 本周热门推荐小卡（绿色渐变） */}
            <div className="bg-gradient-to-br from-[#1A5319] to-[#003366] rounded-xl shadow-md p-6 text-white">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Flame className="w-5 h-5" /> 本周热门推荐
              </h3>
              <div className="space-y-3">
                {hotProducts.map((h) => (
                  <div
                    key={h.id}
                    className="bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-all cursor-pointer"
                  >
                    <div className="font-semibold text-sm mb-1">{h.title}</div>
                    <div className="text-xs opacity-75">{h.bank}</div>
                    <div className="text-xl font-bold mt-2">年利率 {h.rate}</div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* ========== 右 main（产品网格）========== */}
          <main className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <div className="text-gray-600">
                找到 <span className="font-bold text-[#003366]">{filtered.length}</span> 个产品
              </div>
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
                    <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
                    <div className="h-3 w-full bg-gray-100 rounded" />
                    <div className="h-3 w-2/3 bg-gray-100 rounded mt-2" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Search className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-1">未找到匹配产品</h3>
                <p className="text-sm text-gray-500 mb-4">尝试调整筛选条件或搜索关键词</p>
                <button
                  onClick={reset}
                  className="px-6 py-2.5 bg-[#1A5319] hover:bg-[#0d3a14] text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  重置筛选条件
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((p, idx) => (
                  <B2ProductCard key={p.id} p={p} idx={idx} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}