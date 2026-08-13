import PagePlaceholder from "../components/PagePlaceholder";

/** 加入我们（阶段A 骨架；阶段B 迁移权益卡片 + 合作申请表单 + CooperationApplication 提交） */
export default function JoinUs() {
  const benefits = ["官方授权资质", "专属数据平台", "专业培训支持", "业务协同资源", "市场推广赋能"];
  return (
    <PagePlaceholder title="加入我们 · 合作伙伴计划" subtitle="成为官方授权合作伙伴，共享绿色评级市场机遇。">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
        {/* 左：权益（2/5） */}
        <div className="lg:col-span-2 bg-gradient-to-br from-[#1A5319] to-[#003366] rounded-2xl p-8 text-white">
          <h3 className="text-xl font-bold mb-6">合作伙伴权益</h3>
          <ul className="space-y-4">
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span className="w-2 h-2 mt-2 rounded-full bg-[#D4AF37] shrink-0" />
                <span className="font-medium">{b}</span>
              </li>
            ))}
          </ul>
        </div>
        {/* 右：表单（3/5） */}
        <div className="lg:col-span-3 bg-gray-50/50 border border-gray-100 rounded-2xl p-8">
          <h3 className="font-bold text-[#003366] mb-4">合作申请表</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "企业全称",
              "统一社会信用代码",
              "联系人",
              "联系电话",
              "邮箱",
              "机构类型",
            ].map((f) => (
              <div key={f}>
                <label className="block text-sm text-gray-500 mb-1.5">
                  {f} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={`请输入${f}`}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5319]/30"
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            className="mt-6 w-full md:w-auto bg-[#1A5319] hover:bg-[#0d3a14] text-white px-10 py-3 rounded-lg font-semibold text-sm transition-colors"
          >
            提交申请
          </button>
        </div>
      </div>
    </PagePlaceholder>
  );
}
