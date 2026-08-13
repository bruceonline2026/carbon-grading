# ============================================================
# 企业绿色评级系统 · Docker 镜像
# 基于 nginx:alpine，内置静态站点 + Nginx SPA fallback 配置
#
# 构建：
#   docker build -t carbon-grading-web:latest .
# 运行：
#   docker run -d --name carbon-grading -p 8080:80 carbon-grading-web:latest
# 或用 docker-compose（见 docker-compose.yml）
# ============================================================

FROM nginx:1.27-alpine

# 站点文件：index.html、web.config(仅IIS用，容器内忽略)、assets/、join-us/
COPY index.html ./assets ./join-us /usr/share/nginx/html/

# Nginx 配置：SPA fallback + 静态缓存 + gzip
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

# 元数据
LABEL maintainer="carbon-grading"
LABEL description="企业绿色评级系统 静态站点 (React SPA + join-us)"

# 暴露 80 端口
EXPOSE 80

# 健康检查：首页可达即视为健康
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
