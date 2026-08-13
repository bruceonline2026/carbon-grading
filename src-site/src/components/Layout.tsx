import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";
import Footer from "./Footer";

/** 全站布局：顶部导航 + 内容区（Outlet 渲染子路由）+ 页脚 */
export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
