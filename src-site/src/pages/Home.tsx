import { Link } from "react-router-dom";

/** 首页（阶段A 骨架：hero + 核心入口 + 金融区块占位） */
export default function Home() {
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

      {/* 金融产品区块（阶段B 接入 FinancialProductLookup 接口） */}
      <section className="max-w-7xl mx-auto px-6 pb-14">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#003366]">本周推荐产品</h2>
            <Link to="/financial-supermarket" className="text-sm text-[#1A5319] hover:underline">
              查看全部 →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-5 bg-gray-50/50">
                <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
                <div className="h-3 w-full bg-gray-100 rounded" />
                <div className="h-3 w-2/3 bg-gray-100 rounded mt-2" />
                <div className="mt-4 text-xs text-gray-400">产品数据 · 阶段B接入接口</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
