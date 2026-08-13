import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronDown, Flame, Search, X } from "lucide-react";
import ProductCard from "../components/ProductCard";
import {
  fetchFinancialProducts,
  fetchProductTypes,
  mapProduct,
  type FinancialProduct,
} from "../api/client";

/** 金融超市兜底数据（原产物 y array 逐字迁移：12 个产品） */
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

/** 筛选器（原产物 T 组件） */
function Filter({ label, value, onChange, options }: {
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
      <ChevronDown className="absolute right-3 top-11 w-5 h-5 text-gray-400 pointer-events-none" />
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

    // 类型下拉（接口失败保持兜底选项）
    fetchProductTypes().then((d) => {
      if (alive && d.length) setTypes(["全部"].concat(d));
    });

    // 全量产品
    fetchFinancialProducts({ 官网首页显示: "false", 官网本周热门推荐: "false" }).then((raw) => {
      if (!alive) return;
      const mapped = raw.map(mapProduct);
      if (mapped.length) setProducts(mapped);
    });

    // 热门推荐（本周）
    fetchFinancialProducts({ 官网首页显示: "false", 官网本周热门推荐: "true" }).then((raw) => {
      if (!alive) return;
      const mapped = raw.map(mapProduct);
      if (mapped.length) setHotProducts(mapped.slice(0, 3));
    });

    // 至少展示一次 loading 状态（1.2s 后无论接口如何都展示数据）
    const t = setTimeout(() => alive && setLoading(false), 1200);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, []);

  /** 5 维筛选（原产物 filter 逻辑逐字迁移） */
  const filtered = useMemo(() => {
    return products.filter((p) => {
      const kwMatch =
        p.title.toLowerCase().includes(keyword.toLowerCase()) ||
        p.bank.toLowerCase().includes(keyword.toLowerCase());
      const typeMatch = type === "全部" || p.type === type;
      const ratingMatch = rating === "全部" || p.requiredRating === rating;
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
      {/* 页头 */}
      <header className="bg-gradient-to-r from-[#003366] to-[#1A5319] text-white py-8 shadow-lg">
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
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* 本周热门推荐 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-[#003366] mb-6 flex items-center gap-2">
            <Flame className="w-6 h-6 text-[#D4AF37]" /> 本周热门推荐
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {hotProducts.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>

        {/* 筛选区 */}
        <section className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-800">全部产品</h2>
            <button
              onClick={reset}
              className="text-sm text-[#1A5319] hover:underline flex items-center gap-1"
            >
              <X className="w-4 h-4" /> 重置筛选
            </button>
          </div>
          {/* 搜索 */}
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="搜索产品名称或机构…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5319] focus:border-transparent text-sm"
            />
          </div>
          {/* 维度筛选 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Filter label="产品类型" value={type} onChange={setType} options={types} />
            <Filter label="适用评级" value={rating} onChange={setRating} options={RATING_OPTIONS} />
            <Filter label="融资规模" value={amount} onChange={setAmount} options={AMOUNT_OPTIONS} />
            <Filter label="金融机构" value={bank} onChange={setBank} options={BANK_OPTIONS} />
          </div>
        </section>

        {/* 产品列表 */}
        <section>
          {loading ? (
            <div className="grid md:grid-cols-3 gap-8">
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
                重置筛选
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {filtered.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
