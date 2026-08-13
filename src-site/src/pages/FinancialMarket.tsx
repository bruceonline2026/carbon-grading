import PagePlaceholder from "../components/PagePlaceholder";

/** 金融市场（阶段A 骨架；阶段B 接入 FinancialProductLookup/TypeList 接口） */
export default function FinancialMarket() {
  return (
    <PagePlaceholder
      title="金融市场 · 绿色金融产品超市"
      subtitle="汇聚绿色信贷、绿色债券、绿色保险等产品，助力企业绿色融资。"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="border border-gray-100 rounded-xl p-5 bg-gray-50/50">
            <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
            <div className="h-3 w-full bg-gray-100 rounded" />
            <div className="h-3 w-2/3 bg-gray-100 rounded mt-2" />
            <div className="mt-4 text-xs text-gray-400">产品卡片占位 · 阶段B接入接口数据</div>
          </div>
        ))}
      </div>
    </PagePlaceholder>
  );
}
