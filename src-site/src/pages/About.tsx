import { Award, Cpu, Globe2, Leaf, ShieldCheck, Target } from "lucide-react";

/** 关于我们 */
export default function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页头 */}
      <header className="bg-gradient-to-r from-[#003366] to-[#1A5319] text-white py-12 shadow-lg">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
            <Globe2 className="w-9 h-9" /> 关于我们
          </h1>
          <p className="text-blue-100/90 text-lg">了解企业绿色评级系统的使命与价值</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        {/* 使命 */}
        <section className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-7 h-7 text-[#1A5319]" />
            <h2 className="text-2xl font-bold text-[#003366]">我们的使命</h2>
          </div>
          <p className="text-gray-600 leading-relaxed mb-4">
            企业绿色评级系统致力于构建权威、专业、透明的企业绿色发展评估体系，
            以国家发改委和生态环境部公布的《企业温室气体排放核算方法与报告指南》为核心标准，
            以中国人民银行、金融监管总局、中国证监会发布的《绿色金融支持项目目录》为绿色导向，
            助力企业低碳转型与绿色金融对接。
          </p>
          <p className="text-gray-600 leading-relaxed">
            我们连接评级机构、金融机构与企业，打造"评估—认证—融资"的绿色金融服务闭环，
            推动实体经济可持续发展。
          </p>
        </section>

        {/* 核心优势 */}
        <section>
          <h2 className="text-2xl font-bold text-[#003366] mb-6">核心优势</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Award, title: "权威标准接入", desc: "评级标准以国家发改委和生态环境部公布的核算方法与报告指南为核心" },
              { icon: Cpu, title: "AI智能评估", desc: "70%定量指标 + 30%定性评估，确保评级专业性与准确性" },
              { icon: Leaf, title: "金融场景对接", desc: "直接对接绿色信贷、绿色债券、碳金融等产品场景" },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <f.icon className="w-9 h-9 text-[#1A5319] mb-4" />
                <h3 className="font-bold text-gray-800 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 平台保障 */}
        <section className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 flex items-start gap-4">
          <ShieldCheck className="w-8 h-8 text-[#1A5319] shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-bold text-[#003366] mb-2">平台保障</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              所有评级证书均通过官方认证数据核验，查询结果真实可溯；
              企业数据严格保密，仅用于评级评估与金融服务对接用途。
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
