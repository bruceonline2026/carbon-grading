import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import FinancialMarket from "./pages/FinancialMarket";
import CertificateQuery from "./pages/CertificateQuery";
import Process from "./pages/Process";
import Services from "./pages/Services";
import Partners from "./pages/Partners";
import JoinUs from "./pages/JoinUs";
import About from "./pages/About";

/**
 * 路由表（data router 模式）
 * 路径与官网一致：/financial-supermarket、/certificate-query 为 pathname 路由，
 * 部署需配合 IIS web.config / Nginx try_files 的 SPA fallback。
 *
 * 特殊：/financial-supermarket 不通过 Layout 包裹（uat B2 组件本身是独立全屏页，不含 NavBar/Footer）
 */
export const router = createBrowserRouter([
  {
    path: "/",
    children: [
      // 公共 Layout 路由（绝大多数页面）
      {
        element: <Layout />,
        children: [
          { index: true, element: <Home /> },
          { path: "certificate-query", element: <CertificateQuery /> },
          { path: "process", element: <Process /> },
          { path: "services", element: <Services /> },
          { path: "partners", element: <Partners /> },
          { path: "join-us", element: <JoinUs /> },
          { path: "about", element: <About /> },
        ],
      },
      // 独立路由（金融超市 - uat B2 无 NavBar/Footer）
      { path: "financial-supermarket", element: <FinancialMarket /> },
    ],
  },
]);