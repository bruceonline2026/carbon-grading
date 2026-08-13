// ====== 全局类型声明 ======
export {};

declare global {
  interface Window {
    /** 企业后台基域名（API 接口地址前缀） */
    __entUrl__?: string;
    /** 官网前端基域名（本站点） */
    __cgUrl__?: string;
  }
}
