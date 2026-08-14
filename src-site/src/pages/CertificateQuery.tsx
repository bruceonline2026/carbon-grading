import { useState } from "react";
import {
  AlertCircle,
  Award,
  Building2,
  FileSearch,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import SliderCaptcha from "../components/SliderCaptcha";
import { lookupCertificate, type CertificateResult } from "../api/client";

type QueryStatus = "idle" | "loading" | "success" | "failure";

/** 信息项（原产物 Sl 组件） */
function InfoItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="group">
      <div className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5 uppercase tracking-wide">
        {label}
      </div>
      <div
        className={
          "font-medium text-gray-800 text-base md:text-lg " +
          (highlight ? "text-[#1A5319] font-bold" : "")
        }
      >
        {value || "-"}
      </div>
    </div>
  );
}

/** 查询结果卡片（原产物 aA 组件） */
function ResultCard({ data }: { data: CertificateResult }) {
  return (
    <div className="bg-white rounded-xl shadow-lg border-l-8 border-[#1A5319] overflow-hidden">
      <div className="p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-100 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-[#003366]">{data.companyName}</h2>
              <div className="px-3 py-1 bg-[#1A5319]/10 text-[#1A5319] text-xs rounded-full font-bold border border-[#1A5319]/20 flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#1A5319] animate-pulse" />
                {data.status}
              </div>
            </div>
            <p className="text-gray-500 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-[#D4AF37]" />
              证书编号：
              <span className="font-mono text-gray-700">{data.certId}</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <div className="text-xs text-gray-400">评级等级</div>
              <div className="text-sm font-bold text-[#D4AF37]">ESG Rating</div>
            </div>
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#D4AF37] to-[#B8860B] rounded-lg shadow-lg flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform">
              <span className="text-2xl md:text-3xl font-serif font-bold text-white shadow-sm drop-shadow-md">
                {data.grade}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-y-10">
          <div className="flex flex-wrap gap-x-8">
            <div className="flex-1 min-w-[120px]">
              <InfoItem label="评级年度" value={data.year} />
            </div>
            <div className="flex-[1.6] min-w-[160px]">
              <InfoItem label="所属区域" value={data.region} />
            </div>
            <div className="flex-1 min-w-[120px]">
              <InfoItem label="所属行业" value={data.industry} />
            </div>
          </div>
          <div className="flex flex-wrap gap-x-8">
            <div className="flex-[3] min-w-[160px]">
              <InfoItem label="评级类型" value={data.ratingType} highlight />
            </div>
            <div className="flex-1 min-w-[120px]">
              <InfoItem label="评级结果" value={data.result} highlight />
            </div>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#1A5319]" />
          <span>瑞鼎燊隆官方认证数据</span>
        </div>
      </div>
    </div>
  );
}

/** 查询失败卡片（原产物 lA 组件） */
function FailureCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-red-100 p-12 flex flex-col items-center justify-center text-center">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <XCircle className="w-10 h-10 text-red-500" />
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-3">未查询到相关记录</h3>
      <p className="text-gray-500 max-w-lg mx-auto mb-8 leading-relaxed">
        请确保输入的
        <span className="font-bold text-gray-700 mx-1">企业全称</span>
        与
        <span className="font-bold text-gray-700 mx-1">证书编号</span>
        完全匹配，且证书在有效期内。
      </p>
      <div className="flex flex-col md:flex-row gap-4 w-full max-w-md">
        <div className="flex-1 bg-gray-50 p-4 rounded-lg text-left border border-gray-100">
          <div className="text-xs text-gray-400 mb-1">提示</div>
          <div className="text-sm text-gray-600">
            如确认信息无误仍无法查询，请联系发证机构核实。
          </div>
        </div>
      </div>
    </div>
  );
}

/** 演示说明浮动提示（uat 站带的演示模式提示） */
function DemoHint({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  if (!visible) return null;
  return (
    <div className="fixed bottom-8 right-8 md:top-32 md:right-8 md:bottom-auto z-40 max-w-xs">
      <div className="bg-[#D4AF37]/10 backdrop-blur-md border border-[#D4AF37] p-4 rounded-lg shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-[#003366] hover:bg-[#D4AF37]/20 rounded-full p-1"
        >
          <X className="w-4 h-4" />
        </button>
        <h4 className="font-bold text-[#003366] mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          演示说明
        </h4>
        <p className="text-sm text-[#003366]/80 leading-relaxed">
          此页面仅展示精确匹配逻辑与高级安全校验流程。
          <br />
          <br />
          <strong>尝试输入企业名称 "fail"</strong> 查看未查到记录的状态。
        </p>
      </div>
    </div>
  );
}

export default function CertificateQuery() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<QueryStatus>("idle");
  const [result, setResult] = useState<CertificateResult | null>(null);
  const [captchaOpen, setCaptchaOpen] = useState(false);
  const [showDemoHint, setShowDemoHint] = useState(true);

  const valid = name.trim().length > 0 && code.trim().length > 0;

  /** 打开滑块弹窗 */
  const openCaptcha = () => {
    if (valid) setCaptchaOpen(true);
  };

  /** 滑块验证通过后执行查询 */
  const doQuery = async () => {
    setCaptchaOpen(false);
    setStatus("loading");
    const r = await lookupCertificate({
      enterpriseName: name.trim(),
      certificateCode: code.trim(),
    });
    if (r) {
      setResult(r);
      setStatus("success");
    } else {
      setStatus("failure");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-slate-800">
      {/* 演示说明浮动提示 */}
      <DemoHint visible={showDemoHint} onClose={() => setShowDemoHint(false)} />

      <main className="flex-grow container mx-auto px-4 py-12 md:py-20 relative">
        <div className="max-w-4xl mx-auto space-y-10">
          {/* ========== 证书查询卡片（uat iA 风格） ========== */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Hero header：深蓝渐变 + 透明纹理 */}
            <div className="bg-gradient-to-r from-[#003366] to-[#004d99] p-8 text-center text-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
              <h1 className="text-3xl font-bold mb-2 relative z-10">证书公开查询</h1>
              <p className="text-blue-100 relative z-10">权威数据 · 实时核验 · 安全可靠</p>
            </div>

            {/* 表单 */}
            <div className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 mb-10">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-1">
                    企业全称 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-[#1A5319] transition-colors" />
                    <input
                      type="text"
                      placeholder="请输入精确的企业全称"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5319]/20 focus:border-[#1A5319] transition-all placeholder:text-gray-400"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-1">
                    证书编号 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <FileSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-[#1A5319] transition-colors" />
                    <input
                      type="text"
                      placeholder="请输入精确的证书编号"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5319]/20 focus:border-[#1A5319] transition-all placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <button
                  onClick={openCaptcha}
                  disabled={!valid || status === "loading"}
                  className={
                    "w-full max-w-md py-4 rounded-lg font-bold text-lg shadow-md transition-all flex items-center justify-center gap-2 " +
                    (valid && status !== "loading"
                      ? "bg-[#1A5319] hover:bg-[#144013] text-white hover:shadow-lg transform hover:-translate-y-0.5"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed")
                  }
                >
                  {status === "loading" ? (
                    <>
                      <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      正在核实...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" /> 立即查询
                    </>
                  )}
                </button>
                {!valid && (
                  <p className="mt-3 text-xs text-gray-400 flex items-center gap-1">
                    请填写所有必填项以激活查询功能
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* 查询结果区 */}
          <div className="min-h-[100px]">
            {status === "success" && result && <ResultCard data={result} />}
            {status === "failure" && <FailureCard />}
          </div>
        </div>
      </main>

      <SliderCaptcha open={captchaOpen} onClose={() => setCaptchaOpen(false)} onSuccess={doQuery} />
    </div>
  );
}