import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';

export default defineConfig(({ mode }) => {
    // 使用 __dirname 确保从配置文件所在目录加载环境变量
    const root = path.resolve(__dirname);
    const env = loadEnv(mode, root, '');
    
    // 如果 loadEnv 没有加载到，尝试直接读取 .env.local 文件
    let apiKey = env.DEEPSEEK_API_KEY || '';
    
    if (!apiKey) {
      const possiblePaths = [
        path.resolve(root, '.env.local'),
        path.resolve(process.cwd(), '.env.local'),
        path.join(__dirname, '.env.local'),
        '.env.local'
      ];
      
      for (const envLocalPath of possiblePaths) {
        try {
          const envContent = readFileSync(envLocalPath, 'utf-8');
          const lines = envContent.split(/\r?\n/);
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // 跳过空行和注释
            if (!line || line.startsWith('#')) continue;
            
            // 移除 BOM 字符（UTF-8 BOM: \uFEFF）
            const cleanLine = line.replace(/^\uFEFF/, '').trim();
            
            // 使用 includes 而不是 startsWith，因为可能有 BOM 或其他字符
            if (cleanLine.includes('DEEPSEEK_API_KEY=')) {
              const parts = cleanLine.split('=');
              if (parts.length >= 2) {
                apiKey = parts.slice(1).join('=').trim();
                // 处理可能的引号
                apiKey = apiKey.replace(/^["']|["']$/g, '');
                break;
              }
            }
          }
          
          if (apiKey) break;
        } catch (error: any) {
          // 静默失败，尝试下一个路径
        }
      }
    }
    
    // 只显示最终状态
    if (apiKey) {
      console.log('✅ API密钥已加载');
    } else {
      console.warn('⚠️ 警告: 未找到 DEEPSEEK_API_KEY');
    }
    
    return {
      server: {
        port: 3000,
        host: 'localhost',
        hmr: {
          host: 'localhost',
          port: 3000,
        },
      },
      plugins: [react()],
      define: {
        'process.env.DEEPSEEK_API_KEY': JSON.stringify(apiKey),
        'process.env.API_KEY': JSON.stringify(apiKey),
        'import.meta.env.VITE_DEEPSEEK_API_KEY': JSON.stringify(apiKey),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
