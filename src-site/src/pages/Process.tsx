import PagePlaceholder from "../components/PagePlaceholder";

/** 流程（阶段A 骨架） */
export default function Process() {
  const steps = ["企业申请", "材料审核", "现场评估", "评级公示", "证书颁发"];
  return (
    <PagePlaceholder title="评级流程" subtitle="五步完成企业绿色评级，全流程透明可追踪。">
      <div className="flex flex-col md:flex-row gap-4">
        {steps.map((s, i) => (
          <div key={s} className="flex-1 border border-gray-100 rounded-xl p-5 bg-gray-50/50 text-center">
            <div className="w-8 h-8 mx-auto rounded-full bg-gradient-to-br from-[#1A5319] to-[#003366] text-white flex items-center justify-center text-sm font-bold mb-3">
              {i + 1}
            </div>
            <div className="font-semibold text-sm">{s}</div>
          </div>
        ))}
      </div>
    </PagePlaceholder>
  );
}
