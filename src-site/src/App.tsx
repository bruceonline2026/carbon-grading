import { useEffect } from "react";
import { createBrowserRouter, Navigate, Outlet, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import FinancialMarket from "./pages/FinancialMarket";
import CertificateQuery from "./pages/CertificateQuery";
import JoinUs from "./pages/JoinUs";
import About from "./pages/About";

/**
 * 全局滚动管理：页面之间跳转回到顶部（SPA 默认保留滚动位置）
 * - pathname 变化（页面切换）→ scrollTo(0,0)
 * - 仅 hash 变化（首页锚点 /#services 等）不触发 → 由 Home 组件 useEffect 处理锚点滚动
 */
function ScrollManager() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return <Outlet />;
}

/**
 * 路由表（data router 模式）
 * - /financial-supermarket、/certificate-query 为 pathname 路由
 * - 流程/服务/合作伙伴不是独立页，是首页锚点（/#process /#services /#partners）
 * - /financial-supermarket 不通过 Layout 包裹（uat B2 独立全屏页，不含 NavBar/Footer）
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <ScrollManager />,
    children: [
      // 公共 Layout 路由（绝大多数页面）
      {
        element: <Layout />,
        children: [
          { index: true, element: <Home /> },
          { path: "certificate-query", element: <CertificateQuery /> },
          { path: "join-us", element: <JoinUs /> },
          { path: "about", element: <About /> },
        ],
      },
      // 独立路由（金融超市 - uat B2 无 NavBar/Footer）
      { path: "financial-supermarket", element: <FinancialMarket /> },
      // 兜底：未匹配路由（含已移除的 /process /services /partners）→ 首页
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);