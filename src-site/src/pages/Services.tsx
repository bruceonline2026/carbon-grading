import PagePlaceholder from "../components/PagePlaceholder";

/** 服务（阶段A 骨架） */
export default function Services() {
  const services = ["绿色评级评估", "绿色金融对接", "碳数据管理", "可持续发展咨询"];
  return (
    <PagePlaceholder title="服务体系" subtitle="面向企业与机构的专业绿色服务。">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((s) => (
          <div key={s} className="border border-gray-100 rounded-xl p-5 bg-gray-50/50">
            <div className="font-semibold mb-1">{s}</div>
            <div className="text-xs text-gray-400">服务详情 · 阶段B补充</div>
          </div>
        ))}
      </div>
    </PagePlaceholder>
  );
}
