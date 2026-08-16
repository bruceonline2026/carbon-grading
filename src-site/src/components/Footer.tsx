import { Link } from "react-router-dom";
import { Globe, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { enterpriseUrl } from "../config";

/* ============================================================
 * Footer · 对照 uat.carbon-grading.com 真实产物 (ic 组件) 还原
 *
 * 注意：测试环境保留视觉结构（4 列 + 金色小标题 + 深蓝背景 + 备案区），
 *       备案号/电话/邮箱/地址用占位，上线前替换为真实信息。
 * ============================================================ */

const QUICK_LINKS = [
  { label: "关于我们", to: "/about" },
  { label: "评级方法", to: "/process" },
  { label: "金融产品", to: "/financial-supermarket" },
  { label: "合作网络", to: "/partners" },
  { label: "资源中心", to: "/about" },
];

const SERVICES = [
  { label: "ESG评估", to: enterpriseUrl },
  { label: "碳足迹分析", to: enterpriseUrl },
  { label: "绿色认证", to: enterpriseUrl },
  { label: "金融匹配", to: "/financial-supermarket" },
  { label: "合规支持", to: enterpriseUrl },
];

export default function Footer() {
  return (
    <footer className="bg-[#003366] text-white py-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* ========== 4 列主区 ========== */}
        <div className="grid md:grid-cols-4 gap-16 mb-16">
          {/* 列 1：品牌 */}
          <div>
            <h3 className="text-2xl font-bold mb-6 text-[#D4AF37]">企业绿色评级</h3>
            <p className="text-gray-300 text-base leading-relaxed mb-6">
              通过专业评级和金融对接，引领企业可持续商业转型。
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                aria-label="联系我们"
                className="w-11 h-11 rounded-full bg-[#1A5319] hover:bg-[#D4AF37] transition-colors flex items-center justify-center"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href="#"
                aria-label="网站"
                className="w-11 h-11 rounded-full bg-[#1A5319] hover:bg-[#D4AF37] transition-colors flex items-center justify-center"
              >
                <Globe className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* 列 2：快速链接 */}
          <div>
            <h4 className="font-semibold text-lg mb-6 text-[#D4AF37]">快速链接</h4>
            <ul className="space-y-3.5">
              {QUICK_LINKS.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-gray-300 hover:text-[#D4AF37] transition-colors text-base"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 列 3：服务项目 */}
          <div>
            <h4 className="font-semibold text-lg mb-6 text-[#D4AF37]">服务项目</h4>
            <ul className="space-y-3.5">
              {SERVICES.map((l) => (
                <li key={l.label}>
                  {l.to.startsWith("/") ? (
                    <Link
                      to={l.to}
                      className="text-gray-300 hover:text-[#D4AF37] transition-colors text-base"
                    >
                      {l.label}
                    </Link>
                  ) : (
                    <a
                      href={l.to}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-[#D4AF37] transition-colors text-base"
                    >
                      {l.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* 列 4：联系我们 */}
          <div>
            <h4 className="font-semibold text-lg mb-6 text-[#D4AF37]">联系我们</h4>
            <ul className="space-y-5">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-1" />
                <span className="text-gray-300 text-base leading-relaxed">
                  可持续发展大道 123 号
                  <br />
                  绿色科技园区, 100001
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />
                <span className="text-gray-300 text-base">400-123-4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />
                <a
                  href="mailto:service@carbon-grading.com"
                  className="text-gray-300 hover:text-[#D4AF37] transition-colors text-base"
                >
                  service@carbon-grading.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* ========== 版权 + 备案 + 政策 ========== */}
        <div className="pt-10 border-t border-[#1A5319]/50">
          {/* 桌面端 */}
          <div className="hidden md:block text-center space-y-5">
            <p className="text-gray-400 text-base">
              © 2026 瑞鼎燊隆（上海）科技有限公司 | 瑞鼎燊隆碳等级评估服务
            </p>
            <div className="flex items-center justify-center gap-6 text-base">
              <a
                href="https://beian.miit.gov.cn/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#D4AF37] transition-colors"
              >
                沪ICP备2025151615号
              </a>
              <span className="text-gray-600">|</span>
              <a
                href="https://www.beian.gov.cn/portal/registerSystemInfo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#D4AF37] transition-colors inline-flex items-center gap-2"
              >
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1A5319] text-white text-xs font-bold">
                  盾
                </span>
                沪公网安备31011502404964号
              </a>
            </div>
            <div className="flex items-center justify-center gap-8 text-base pt-4">
              <a href="#" className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                隐私政策
              </a>
              <span className="text-gray-600">·</span>
              <a href="#" className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                服务条款
              </a>
              <span className="text-gray-600">·</span>
              <a href="#" className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                Cookie政策
              </a>
            </div>
          </div>
          {/* 移动端 */}
          <div className="md:hidden flex flex-col gap-6 text-center">
            <p className="text-gray-400 text-sm">
              © 2026 瑞鼎燊隆（上海）科技有限公司
              <br />
              瑞鼎燊隆碳等级评估服务
            </p>
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#D4AF37] transition-colors text-sm"
            >
              沪ICP备2025151615号
            </a>
            <a
              href="https://www.beian.gov.cn/portal/registerSystemInfo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#D4AF37] transition-colors text-sm inline-flex items-center justify-center gap-2"
            >
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1A5319] text-white text-xs font-bold">
                盾
              </span>
              沪公网安备31011502404964号
            </a>
            <div className="flex flex-wrap items-center justify-center gap-5 text-sm pt-4 border-t border-[#1A5319]/30">
              <a href="#" className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                隐私政策
              </a>
              <a href="#" className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                服务条款
              </a>
              <a href="#" className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                Cookie政策
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}