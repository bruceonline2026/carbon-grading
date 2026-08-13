import PagePlaceholder from "../components/PagePlaceholder";

/** 合作伙伴（阶段A 骨架） */
export default function Partners() {
  const partners = ["合作伙伴 A", "合作伙伴 B", "合作伙伴 C", "合作伙伴 D"];
  return (
    <PagePlaceholder title="合作伙伴" subtitle="携手共进，共建绿色金融生态。">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {partners.map((p) => (
          <div key={p} className="border border-gray-100 rounded-xl p-6 bg-gray-50/50 text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-gray-200 mb-3" />
            <div className="text-sm font-medium text-gray-500">{p}</div>
          </div>
        ))}
      </div>
    </PagePlaceholder>
  );
}
