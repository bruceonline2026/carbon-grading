import { Link } from "react-router-dom";
import { enterpriseUrl } from "../config";

export default function Footer() {
  return (
    <footer className="bg-[#0d3a14] text-white/80 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1A5319] to-[#003366] flex items-center justify-center">
                <span className="text-white font-bold text-sm">绿评</span>
              </div>
              <span className="font-bold text-white">企业绿色评级系统</span>
            </div>
            <p className="text-sm text-white/60">专业可持续发展评估平台 · 绿色金融产品超市</p>
          </div>
          <div className="flex gap-8 text-sm text-white/70">
            <div className="space-y-2">
              <div className="text-white font-semibold mb-1">快捷入口</div>
              <Link to="/certificate-query" className="block hover:text-white">证书查询</Link>
              <Link to="/financial-supermarket" className="block hover:text-white">金融市场</Link>
              <Link to="/join-us" className="block hover:text-white">加入我们</Link>
              <Link to="/about" className="block hover:text-white">关于我们</Link>
            </div>
            <div className="space-y-2">
              <div className="text-white font-semibold mb-1">企业服务</div>
              <a href={enterpriseUrl} target="_blank" rel="noopener noreferrer" className="block hover:text-white">指标申报</a>
              <a href={enterpriseUrl} target="_blank" rel="noopener noreferrer" className="block hover:text-white">企业登录</a>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-4 text-xs text-white/40 text-center">
          © 2026 企业绿色评级系统 · 本网站基于 React 源码工程构建（阶段A）
        </div>
      </div>
    </footer>
  );
}
