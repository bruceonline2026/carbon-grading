import { Link } from "react-router-dom";
import { enterpriseUrl } from "../config";

/** 导航菜单项（与官网一致 8 项；无当前页高亮，hover 变色） */
const NAV_ITEMS: { label: string; to?: string; external?: string }[] = [
  { label: "首页", to: "/" },
  { label: "金融市场", to: "/financial-supermarket" },
  { label: "证书查询", to: "/certificate-query" },
  { label: "指标申报", external: enterpriseUrl },
  { label: "流程", to: "/process" },
  { label: "服务", to: "/services" },
  { label: "合作伙伴", to: "/partners" },
  { label: "加入我们", to: "/join-us" },
];

/**
 * 顶部导航栏
 * 样式基线（历次用户反馈修复后的最终结论）：
 * - header: 白底 + shadow-sm，内层 h-20 (80px)
 * - Logo: w-12 h-12 rounded-full（圆形），绿→深蓝渐变，"绿评" text-xl
 * - 菜单: gap-8 text-base font-medium text-gray-700，hover 变绿 #1A5319（无当前页高亮）
 * - 登录按钮: 金色底 #D4AF37 + 深蓝字 #003366，作为 nav 最后一项
 */
export default function NavBar() {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1A5319] to-[#003366] flex items-center justify-center">
            <span className="text-white font-bold text-xl">绿评</span>
          </div>
          <div className="leading-tight">
            <div className="text-[#003366] font-bold text-xl">企业绿色评级系统</div>
            <div className="text-xs text-gray-500">专业可持续发展评估</div>
          </div>
        </Link>

        {/* 菜单（8 项 + 登录按钮） */}
        <nav className="hidden md:flex items-center gap-8 text-base">
          {NAV_ITEMS.map((item) =>
            item.external ? (
              <a
                key={item.label}
                href={item.external}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 font-medium hover:text-[#1A5319] transition-colors"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.label}
                to={item.to!}
                className="text-gray-700 font-medium hover:text-[#1A5319] transition-colors"
              >
                {item.label}
              </Link>
            ),
          )}
          {/* 登录（外链企业后台，金底深蓝字） */}
          <a
            href={enterpriseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#D4AF37] hover:bg-[#C19B2E] text-[#003366] px-6 py-2.5 rounded-lg font-semibold transition-colors shrink-0"
          >
            登录
          </a>
        </nav>
      </div>
    </header>
  );
}
