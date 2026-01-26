import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './', // 使用相对路径，这样资源会相对于HTML文件位置加载
  server: {
    port: 5173, // Vite 前端启动端口
    proxy: {
      // 🎯 核心配置：精准匹配你的 API URL 常量
      '/jetopcms': {
        // ⚠️ 注意：这里必须填你后端真实的运行地址和端口
        // 如果是 .NET Core / IIS Express，通常是 5000, 5001, 443xx 等
        target: 'https://test1.tepc.cn',

        changeOrigin: true, // 允许跨域，修改 Host 头欺骗后端
        secure: false,      // 如果后端是 https (localhost自签名证书)，建议设为 false 避免报错
      }
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
