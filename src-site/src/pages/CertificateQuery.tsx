import PagePlaceholder from "../components/PagePlaceholder";

/** 证书查询（阶段A 骨架；阶段B 迁移滑块验证 + CertificateLookup 全链路） */
export default function CertificateQuery() {
  return (
    <PagePlaceholder
      title="证书查询"
      subtitle="输入企业名称与证书编号，在线验证绿色评级证书真伪。"
    >
      <div className="max-w-xl space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">企业名称</label>
          <input
            type="text"
            placeholder="请输入企业名称"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5319]/30"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">证书编号</label>
          <input
            type="text"
            placeholder="请输入证书编号"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5319]/30"
          />
        </div>
        <div className="border border-dashed border-gray-200 rounded-lg p-4 text-center text-xs text-gray-400">
          滑块验证区 · 阶段B迁移（阈值算法 + mouseup/touchend 交互）
        </div>
        <button
          type="button"
          className="w-full bg-[#1A5319] hover:bg-[#0d3a14] text-white py-3 rounded-lg font-semibold text-sm transition-colors"
        >
          查 询
        </button>
      </div>
    </PagePlaceholder>
  );
}
