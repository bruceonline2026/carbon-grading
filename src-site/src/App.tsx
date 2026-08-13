import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import FinancialMarket from "./pages/FinancialMarket";
import CertificateQuery from "./pages/CertificateQuery";
import Process from "./pages/Process";
import Services from "./pages/Services";
import Partners from "./pages/Partners";
import JoinUs from "./pages/JoinUs";

/**
 * 路由表（data router 模式）
 * 路径与官网一致：/financial-supermarket、/certificate-query 为 pathname 路由，
 * 部署需配合 IIS web.config / Nginx try_files 的 SPA fallback。
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "financial-supermarket", element: <FinancialMarket /> },
      { path: "certificate-query", element: <CertificateQuery /> },
      { path: "process", element: <Process /> },
      { path: "services", element: <Services /> },
      { path: "partners", element: <Partners /> },
      { path: "join-us", element: <JoinUs /> },
    ],
  },
]);
