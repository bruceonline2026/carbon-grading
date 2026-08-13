import type { ReactNode } from "react";

interface PagePlaceholderProps {
  title: string;
  subtitle?: string;
  stage?: string;
  children?: ReactNode;
}

/**
 * 阶段A 页面骨架占位组件
 * 阶段B 将把具体功能（滑块验证/接口/表单）迁移进来。
 */
export default function PagePlaceholder({ title, subtitle, stage = "阶段A 骨架", children }: PagePlaceholderProps) {
  return (
    <section className="max-w-7xl mx-auto px-6 py-14">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-50 text-[#1A5319] border border-green-200 font-medium">
            {stage}
          </span>
          <span className="text-xs text-gray-400">源码工程骨架 · 功能待阶段B迁移</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#003366] mb-3">{title}</h1>
        {subtitle && <p className="text-gray-500 mb-6 max-w-2xl">{subtitle}</p>}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </section>
  );
}
