# 配置管理指南

为你的应用程序配置 jetop-service 的完整指南。

## 概述

jetop-service 包使用灵活的配置系统，支持多个配置源并具有清晰的优先级规则。配置可以通过环境变量、localStorage、代码初始化或默认值提供。

## 配置优先级

配置值按以下顺序解析（从高到低优先级）：

1. **环境变量** - Vite/Webpack/Node 环境变量
2. **localStorage** - 运行时浏览器存储
3. **代码配置** - 通过 `appConfig.init()` 设置的值
4. **默认值** - 硬编码的回退值

## 配置选项

### 可用设置

| 选项 | 类型 | 默认值 | 描述 |
|--------|------|---------|-------------|
| `apiBaseUrl` | string | `''` | API 端点的基础 URL |
| `authToken` | string | `''` | 请求的身份验证令牌 |
| `requestTimeout` | number | `120000` | 请求超时时间（毫秒，2 分钟） |
| `debug` | boolean | `false` | 启用调试日志 |
| `pagination.defaultPageSize` | number | `10` | 查询的默认页面大小 |
| `pagination.maxPageSize` | number | `100` | 允许的最大页面大小 |

## 配置方法

### 方法 1：环境变量

环境变量是生产部署的推荐方法。

#### Vite 项目

在项目根目录创建 `.env` 文件：

```env
# API 配置
VITE_API_BASE_URL=https://test1.tepc.cn/jetopcms
VITE_AUTH_TOKEN=your-auth-token-here

# 可选设置
VITE_REQUEST_TIMEOUT=30000
VITE_DEBUG=true
```

在代码中访问：
```javascript
// jetop-service 自动加载
import dataService from 'jetop-service';

// 配置已从环境变量自动应用
const result = await dataService.query('section-id');
```

#### Create React App / React 项目

在项目根目录创建 `.env` 文件：

```env
# API 配置
REACT_APP_API_BASE_URL=https://test1.tepc.cn/jetopcms
REACT_APP_AUTH_TOKEN=your-auth-token-here

# 可选设置
REACT_APP_REQUEST_TIMEOUT=30000
REACT_APP_DEBUG=true
```

#### Node.js 项目

创建 `.env` 文件或设置环境变量：

```env
# API 配置
NODE_API_BASE_URL=https://test1.tepc.cn/jetopcms
NODE_AUTH_TOKEN=your-auth-token-here

# 可选设置
NODE_REQUEST_TIMEOUT=30000
NODE_DEBUG=true
```

#### 特定环境配置

创建多个 `.env` 文件：

```
.env                 # 默认配置
.env.local          # 本地覆盖（gitignored）
.env.development    # 开发环境
.env.production     # 生产环境
.env.test           # 测试环境
```

示例 `.env.development`：
```env
VITE_API_BASE_URL=https://dev.example.com/api
VITE_DEBUG=true
```

示例 `.env.production`：
```env
VITE_API_BASE_URL=https://api.example.com
VITE_DEBUG=false
```

### 方法 2：localStorage

在浏览器中运行时设置配置：

```javascript
// 在浏览器控制台或初始化代码中设置
localStorage.setItem('jetop_api_base_url', 'https://test1.tepc.cn/jetopcms');
localStorage.setItem('jetop_auth_token', 'your-token');
localStorage.setItem('jetop_request_timeout', '30000');
localStorage.setItem('jetop_debug', 'true');
```

或使用 appConfig：
```javascript
import { appConfig } from 'jetop-service';

// 设置令牌（自动存储到 localStorage）
appConfig.AUTH_TOKEN = 'your-token';
```

**存储键：**
- `jetop_api_base_url`
- `jetop_auth_token`
- `jetop_request_timeout`
- `jetop_debug`

### 方法 3：代码配置

在应用程序代码中初始化配置：

```javascript
import { appConfig } from 'jetop-service';

// 基础配置
appConfig.init({
    apiBaseUrl: 'https://test1.tepc.cn/jetopcms',
    authToken: 'your-token'
});

// 完整配置
appConfig.init({
    apiBaseUrl: 'https://test1.tepc.cn/jetopcms',
    authToken: 'your-token',
    requestTimeout: 30000,
    debug: true,
    pagination: {
        defaultPageSize: 20,
        maxPageSize: 100
    }
});
```

**何时使用：**
- 单页应用程序
- 基于用户输入的动态配置
- 从 API 加载的配置
- 测试和开发

### 方法 4：默认值

如果未提供配置，则使用默认值：

```javascript
const defaultConfig = {
    API_BASE_URL: '',
    AUTH_TOKEN: '',
    REQUEST_TIMEOUT: 120000,  // 2 分钟
    DEBUG: false,
    PAGINATION: {
        defaultPageSize: 10,
        maxPageSize: 100
    }
};
```

## 访问配置

### 读取配置值

```javascript
import { appConfig } from 'jetop-service';

// 获取 API 基础 URL
const baseUrl = appConfig.API_BASE_URL;
console.log('API Base URL:', baseUrl);

// 获取身份验证令牌
const token = appConfig.AUTH_TOKEN;
console.log('Auth Token:', token);

// 获取完整的 API URL
const fullUrl = appConfig.getApiUrl('/ks/sectionHandler.ashx');
console.log('Full URL:', fullUrl);

// 获取身份验证头
const headers = appConfig.getAuthHeaders();
console.log('Headers:', headers);
// 输出: { 'X-JetopDebug-User': 'your-token' }
```

### 运行时更新配置

```javascript
import { appConfig } from 'jetop-service';

// 更新身份验证令牌
appConfig.AUTH_TOKEN = 'new-token';

// 注意：只有 AUTH_TOKEN 可以这样设置
// 其他属性是只读的，必须通过 init() 设置
```

## 配置示例

### 示例 1：React 应用程序

**文件: src/config/dataService.js**
```javascript
import { appConfig } from 'jetop-service';

// 在应用启动时初始化
export function initDataService() {
    appConfig.init({
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://test1.tepc.cn/jetopcms',
        authToken: import.meta.env.VITE_AUTH_TOKEN || '',
        requestTimeout: 30000,
        debug: import.meta.env.MODE === 'development'
    });
}
```

**文件: src/main.jsx**
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initDataService } from './config/dataService';

// 初始化数据服务
initDataService();

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
```

### 示例 2：Vue 应用程序

**文件: src/plugins/dataService.js**
```javascript
import { appConfig } from 'jetop-service';

export default {
    install(app, options) {
        appConfig.init({
            apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
            authToken: import.meta.env.VITE_AUTH_TOKEN,
            requestTimeout: options?.timeout || 30000,
            debug: import.meta.env.DEV
        });

        // 提供给所有组件
        app.config.globalProperties.$dataService = { appConfig };
    }
};
```

**文件: src/main.js**
```javascript
import { createApp } from 'vue';
import App from './App.vue';
import dataServicePlugin from './plugins/dataService';

const app = createApp(App);

app.use(dataServicePlugin, {
    timeout: 30000
});

app.mount('#app');
```

### 示例 3：身份验证集成

**文件: src/auth/authService.js**
```javascript
import { appConfig } from 'jetop-service';

class AuthService {
    async login(username, password) {
        // 执行登录请求
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        // 更新 dataService 令牌
        appConfig.AUTH_TOKEN = data.token;

        return data;
    }

    logout() {
        // 清除令牌
        appConfig.AUTH_TOKEN = '';
        localStorage.removeItem('jetop_auth_token');
    }

    async refreshToken() {
        const response = await fetch('/api/auth/refresh');
        const data = await response.json();

        appConfig.AUTH_TOKEN = data.token;

        return data;
    }
}

export default new AuthService();
```

### 示例 4：多租户配置

**文件: src/services/tenantConfig.js**
```javascript
import { appConfig } from 'jetop-service';

const TENANT_CONFIGS = {
    'tenant1': {
        apiBaseUrl: 'https://tenant1.example.com/api',
        requestTimeout: 30000
    },
    'tenant2': {
        apiBaseUrl: 'https://tenant2.example.com/api',
        requestTimeout: 60000
    }
};

export function configureTenant(tenantId, authToken) {
    const config = TENANT_CONFIGS[tenantId];

    if (!config) {
        throw new Error(`Unknown tenant: ${tenantId}`);
    }

    appConfig.init({
        ...config,
        authToken
    });
}

// 使用方法
// configureTenant('tenant1', user.token);
```

### 示例 5：测试配置

**文件: tests/setup.js**
```javascript
import { appConfig } from 'jetop-service';

// 测试的模拟配置
export function setupTestConfig() {
    appConfig.init({
        apiBaseUrl: 'https://test-api.example.com',
        authToken: 'test-token',
        requestTimeout: 5000,
        debug: true
    });
}
```

**文件: tests/dataService.test.js**
```javascript
import { describe, it, beforeAll } from 'vitest';
import { query } from 'jetop-service';
import { setupTestConfig } from './setup';

describe('DataService Tests', () => {
    beforeAll(() => {
        setupTestConfig();
    });

    it('should query data', async () => {
        const result = await query('test-section-id');
        expect(result).toBeDefined();
    });
});
```

## 高级配置

### 自定义处理器 URL

覆盖默认的区块处理器端点：

```javascript
import { setHandlerUrl, getHandlerUrl } from 'jetop-service';

// 设置自定义处理器
setHandlerUrl('https://custom-api.com/handler.ashx');

// 验证
console.log('Handler URL:', getHandlerUrl());
```

### 动态配置

从 API 加载配置：

```javascript
import { appConfig } from 'jetop-service';

async function loadConfigFromApi() {
    const response = await fetch('/api/config');
    const config = await response.json();

    appConfig.init({
        apiBaseUrl: config.apiBaseUrl,
        authToken: config.token,
        requestTimeout: config.timeout,
        debug: config.debug
    });
}

// 在使用 dataService 之前调用
await loadConfigFromApi();
```

### 配置验证

```javascript
import { appConfig } from 'jetop-service';

function validateConfig() {
    const errors = [];

    if (!appConfig.API_BASE_URL) {
        errors.push('API_BASE_URL is required');
    }

    if (!appConfig.AUTH_TOKEN) {
        errors.push('AUTH_TOKEN is required');
    }

    if (errors.length > 0) {
        throw new Error('Configuration errors: ' + errors.join(', '));
    }
}

// 在使用 dataService 之前验证
try {
    validateConfig();
} catch (error) {
    console.error('Configuration validation failed:', error);
}
```

### 配置监控

```javascript
import { appConfig } from 'jetop-service';

// 创建配置监控器
class ConfigMonitor {
    constructor() {
        this.logConfig();
    }

    logConfig() {
        console.group('DataService Configuration');
        console.log('API Base URL:', appConfig.API_BASE_URL);
        console.log('Has Auth Token:', !!appConfig.AUTH_TOKEN);
        console.log('Handler URL:', getHandlerUrl());
        console.groupEnd();
    }

    validateConnection() {
        return fetch(appConfig.API_BASE_URL, { method: 'HEAD' })
            .then(() => {
                console.log('✓ API connection successful');
                return true;
            })
            .catch(error => {
                console.error('✗ API connection failed:', error);
                return false;
            });
    }
}

// 使用方法
const monitor = new ConfigMonitor();
await monitor.validateConnection();
```

## 故障排除

### 问题：配置未应用

**症状：**
- 请求失败，URL 错误
- 身份验证错误

**解决方案：**
1. 检查配置优先级顺序
2. 验证环境变量名称（VITE_ 或 REACT_APP_ 前缀）
3. 更改 .env 文件后重启开发服务器
4. 在浏览器开发工具中检查 localStorage 值
5. 确保在任何数据操作之前调用 `appConfig.init()`

### 问题：令牌过期

**解决方案：**
```javascript
import { appConfig } from 'jetop-service';

async function refreshTokenIfNeeded() {
    // 检查令牌是否过期（实现你的逻辑）
    if (isTokenExpired()) {
        const newToken = await refreshToken();
        appConfig.AUTH_TOKEN = newToken;
    }
}

// 在关键操作之前调用
await refreshTokenIfNeeded();
```

### 问题：CORS 错误

**解决方案：**
验证你的 API 基础 URL，并确保服务器上正确配置了 CORS。

```javascript
// 检查当前配置
console.log('API URL:', appConfig.API_BASE_URL);
console.log('Full endpoint:', appConfig.getApiUrl('/ks/sectionHandler.ashx'));
```

## 最佳实践

### 1. 生产环境使用环境变量

```env
# .env.production
VITE_API_BASE_URL=https://api.production.com
```

### 2. 保持令牌安全

- 永远不要将令牌提交到版本控制
- 使用 `.env.local` 进行本地开发（默认被 gitignore）
- 将生产令牌存储在安全的环境变量系统中

### 3. 尽早初始化

```javascript
// 在应用程序生命周期中尽早初始化
import { appConfig } from 'jetop-service';

appConfig.init({
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
    authToken: import.meta.env.VITE_AUTH_TOKEN
});

// 然后导入和使用应用程序的其他部分
```

### 4. 集中配置

创建专用的配置模块：

```javascript
// src/config/index.js
import { appConfig } from 'jetop-service';

export function initializeApp() {
    appConfig.init({
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
        authToken: getTokenFromStorage(),
        requestTimeout: 30000,
        debug: import.meta.env.MODE === 'development'
    });
}

function getTokenFromStorage() {
    return localStorage.getItem('auth_token') || '';
}
```

### 5. 验证配置

始终验证关键配置值：

```javascript
if (!appConfig.API_BASE_URL) {
    throw new Error('API_BASE_URL must be configured');
}
```

## 配置检查清单

- [ ] 设置 `apiBaseUrl`（必需）
- [ ] 设置 `authToken`（身份验证请求必需）
- [ ] 如需要，配置 `requestTimeout`（默认：2 分钟）
- [ ] 为开发环境启用 `debug`
- [ ] 如需要，设置分页默认值
- [ ] 为环境变量创建 `.env` 文件
- [ ] 将 `.env.local` 添加到 `.gitignore`
- [ ] 在第一次数据操作之前初始化配置
- [ ] 验证关键配置值
- [ ] 在所有环境（开发、预发布、生产）中测试配置
