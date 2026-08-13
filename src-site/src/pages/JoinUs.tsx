import { useState, type FormEvent } from "react";
import { Award, BarChart3, CheckCircle2, GraduationCap, Handshake, Loader2, Megaphone, Send, XCircle } from "lucide-react";
import { submitCooperation, type CooperationForm } from "../api/client";

/** 合作伙伴权益（原 join-us 独立页文案） */
const BENEFITS = [
  { icon: Award, title: "官方授权资质", desc: "获颁授权代理机构证书及授权牌匾" },
  { icon: BarChart3, title: "专属数据平台", desc: "独立机构管理后台与客户数据看板" },
  { icon: GraduationCap, title: "专业培训支持", desc: "定期开展绿色评级与绿色金融培训" },
  { icon: Handshake, title: "业务协同资源", desc: "实现客户共享、产品共生、数据互通" },
  { icon: Megaphone, title: "市场推广赋能", desc: "联合品牌宣传与行业峰会参展资格" },
];

const ORG_TYPES = ["咨询服务类机构", "金融机构", "投资机构", "行业组织与研究机构", "其他机构"];
const REGIONS = ["华北地区", "华东地区", "华南地区", "华中地区", "西南地区", "西北地区", "东北地区", "港澳台地区"];

type SubmitState = "idle" | "submitting" | "success" | "fail";

export default function JoinUs() {
  const [form, setForm] = useState<CooperationForm>({
    EnterpriseName: "",
    EnterpriseCode: "",
    Linkman: "",
    Post: "",
    Tel: "",
    EMail: "",
    OfficiaWebsiteUrl: "",
    Memo: "",
    OrgType: "",
    Region: "",
  });
  const [state, setState] = useState<SubmitState>("idle");
  const [failText, setFailText] = useState("");

  const set = (k: keyof CooperationForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const required = ["EnterpriseName", "EnterpriseCode", "Linkman", "Post", "Tel", "EMail", "OrgType", "Region"];
  const canSubmit = required.every((k) => (form as unknown as Record<string, string>)[k].trim().length > 0);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setState("submitting");
    const r = await submitCooperation(form);
    if (r.ok) {
      setState("success");
    } else {
      setState("fail");
      setFailText(r.message || "提交失败，请稍后重试。");
    }
  };

  const inputCls =
    "w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1A5319]/20 focus:border-[#1A5319] transition-all text-sm placeholder:text-gray-400";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页头 */}
      <header className="bg-gradient-to-r from-[#003366] to-[#1A5319] text-white py-12 shadow-lg">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
            <Handshake className="w-9 h-9" /> 加入我们
          </h1>
          <p className="text-blue-100/90 text-lg">成为官方授权合作伙伴，共享绿色评级市场机遇</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
          {/* 左：权益（2/5） */}
          <aside className="lg:col-span-2">
            <div className="bg-gradient-to-br from-[#1A5319] to-[#003366] rounded-2xl p-8 text-white shadow-lg">
              <h2 className="text-xl font-bold mb-6">合作伙伴权益</h2>
              <ul className="space-y-4">
                {BENEFITS.map((b) => (
                  <li key={b.title} className="flex items-start gap-3">
                    <b.icon className="w-6 h-6 shrink-0 mt-0.5 text-[#D4AF37]" />
                    <div>
                      <div className="font-semibold text-[15px]">{b.title}</div>
                      <div className="text-xs text-green-100/80 mt-1">{b.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-5 mt-4">
              <p className="text-[#003366] text-sm">
                <span className="font-semibold">提示：</span>
                提交申请后，我们的商务团队将在
                <span className="font-semibold">3 个工作日内</span>与您联系，请保持电话畅通。
              </p>
            </div>
          </aside>

          {/* 右：表单（3/5） */}
          <section className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
              {state === "success" ? (
                <div className="text-center py-16">
                  <CheckCircle2 className="w-16 h-16 text-[#1A5319] mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">提交成功！</h3>
                  <p className="text-gray-500 mb-8">
                    我们已收到您的合作申请，商务团队将在 3 个工作日内与您联系。
                  </p>
                  <button
                    onClick={() => {
                      setState("idle");
                      setForm({
                        EnterpriseName: "", EnterpriseCode: "", Linkman: "", Post: "",
                        Tel: "", EMail: "", OfficiaWebsiteUrl: "", Memo: "", OrgType: "", Region: "",
                      });
                    }}
                    className="px-8 py-3 bg-[#1A5319] hover:bg-[#0d3a14] text-white rounded-lg font-semibold transition-colors"
                  >
                    再填一份
                  </button>
                </div>
              ) : (
                <form onSubmit={onSubmit}>
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-[#003366]">合作申请表</h2>
                    <p className="text-xs text-gray-500 mt-1">
                      标有 <span className="text-red-500">*</span> 为必填项
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    {/* 企业全称 */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-1.5">
                        企业全称 <span className="text-red-500">*</span>
                      </label>
                      <input type="text" value={form.EnterpriseName} onChange={set("EnterpriseName")} placeholder="请输入企业全称" className={inputCls} />
                    </div>
                    {/* 统一社会信用代码 */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-1.5">
                        统一社会信用代码 <span className="text-red-500">*</span>
                      </label>
                      <input type="text" value={form.EnterpriseCode} onChange={set("EnterpriseCode")} placeholder="请输入18位统一社会信用代码" className={inputCls} />
                    </div>
                    {/* 联系人 */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-1.5">
                        联系人 <span className="text-red-500">*</span>
                      </label>
                      <input type="text" value={form.Linkman} onChange={set("Linkman")} placeholder="姓名" className={inputCls} />
                    </div>
                    {/* 职务 */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-1.5">
                        职务 <span className="text-red-500">*</span>
                      </label>
                      <input type="text" value={form.Post} onChange={set("Post")} placeholder="如：总经理、合伙人" className={inputCls} />
                    </div>
                    {/* 联系电话 */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-1.5">
                        联系电话 <span className="text-red-500">*</span>
                      </label>
                      <input type="text" value={form.Tel} onChange={set("Tel")} placeholder="手机号码" className={inputCls} />
                    </div>
                    {/* 邮箱 */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-1.5">
                        邮箱 <span className="text-red-500">*</span>
                      </label>
                      <input type="text" value={form.EMail} onChange={set("EMail")} placeholder="business@example.com" className={inputCls} />
                    </div>
                    {/* 机构类型 */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-1.5">
                        机构类型 <span className="text-red-500">*</span>
                      </label>
                      <select value={form.OrgType} onChange={set("OrgType")} className={inputCls}>
                        <option value="">请选择机构类型</option>
                        {ORG_TYPES.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                    {/* 所在大区 */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-1.5">
                        所在大区 <span className="text-red-500">*</span>
                      </label>
                      <select value={form.Region} onChange={set("Region")} className={inputCls}>
                        <option value="">请选择所在大区</option>
                        {REGIONS.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                    {/* 官网 */}
                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-600 mb-1.5">官网地址</label>
                      <input type="text" value={form.OfficiaWebsiteUrl} onChange={set("OfficiaWebsiteUrl")} placeholder="https://www.example.com" className={inputCls} />
                    </div>
                    {/* 补充说明 */}
                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-600 mb-1.5">补充说明</label>
                      <textarea value={form.Memo} onChange={set("Memo")} rows={3} placeholder="如有其他需要说明的事项，请在此填写..." className={inputCls} />
                    </div>
                  </div>

                  {/* 失败提示 */}
                  {state === "fail" && (
                    <div className="mt-5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
                      <XCircle className="w-5 h-5 shrink-0" /> {failText}
                    </div>
                  )}

                  <div className="mt-7">
                    <button
                      type="submit"
                      disabled={!canSubmit || state === "submitting"}
                      className={
                        "w-full md:w-auto px-12 py-3.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 " +
                        (canSubmit && state !== "submitting"
                          ? "bg-[#1A5319] hover:bg-[#0d3a14] text-white"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed")
                      }
                    >
                      {state === "submitting" ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" /> 提交中...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" /> 提交申请
                        </>
                      )}
                    </button>
                    {!canSubmit && (
                      <p className="mt-3 text-xs text-gray-400">请填写所有必填项以激活提交</p>
                    )}
                  </div>
                </form>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}