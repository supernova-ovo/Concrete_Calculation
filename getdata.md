# Jetop数据服务包

这是一个独立的数据访问服务包，可以在任何项目中使用。

## 功能特性

- 统一的数据访问接口（query、insert、update、delete、batchUpdate）
- 灵活的配置管理（支持环境变量、localStorage、代码配置）
- 完整的 TypeScript 类型支持
- 支持分页查询
- 支持 Base64 编码
- UUID 生成工具

## 安装

### 方式一：CDN 引入（推荐用于简单场景）

#### Script 标签引入

```html
<!-- 引入服务库 -->
<script src="https://test1.tepc.cn/jetopcms/assets/jetop-service/1.0.0/jetop-service.umd.js"></script>

<!-- 使用 -->
<script>
  const { dataService, appConfig } = window.JetopService;

  // 初始化配置
  appConfig.init({
    apiBaseUrl: 'https://test1.tepc.cn/jetopcms',
    authToken: 'your-token'
  });

  // 使用数据服务
  dataService.query('section-id', { status: 'active' });
</script>
```

#### ES Modules 引入

```html
<script type="module">
  import { dataService, appConfig } from 'https://test1.tepc.cn/jetopcms/assets/jetop-service/1.0.0/jetop-service.es.js';

  // 使用数据服务...
</script>
```

### 方式二：npm 安装（推荐用于项目开发）

```bash
npm install jetop-service
```

```javascript
import dataService, { appConfig } from 'jetop-service';
```

### 方式三：本地包使用

在你的项目中，可以通过相对路径引入（TypeScript）：

```typescript
import dataService, { appConfig } from './packages/jetop-service/src/index';
```

或使用 JavaScript：

```javascript
import dataService, { appConfig } from './packages/jetop-service/src/index.js';
```

## 快速开始

### 1. 初始化配置

```javascript
import { appConfig } from 'jetop-service';

// 方式一：通过代码初始化
appConfig.init({
    apiBaseUrl: 'https://your-api.com',
    authToken: 'your-token',
    requestTimeout: 30000,
    debug: true
});

// 方式二：通过环境变量
// .env 文件
VITE_API_BASE_URL=https://your-api.com
VITE_AUTH_TOKEN=your-token
VITE_REQUEST_TIMEOUT=30000
VITE_DEBUG=true
```

### 2. 使用数据服务

```javascript
import dataService from 'jetop-service';

// 查询数据
const result = await dataService.query(SECTION_ID,{
    where: { status: 'active' },
    pageIndex: 1,
    pageSize: 20
});

// 插入数据
await dataService.insert(SECTION_ID,{
    inserted:[
        {
            name: 'John',
            age: 30,
            sys_id: dataService.generateUUID()
        }
    ]
});

// 更新数据
await dataService.update(SECTION_ID,{
    updated:[
        {
            sys_id: 'xxx-xxx',
            name: 'John Updated'
        }
    ]
});

// 删除数据
await dataService.remove(SECTION_ID,{
    deleted:[
        { sys_id: 'xxx-xxx' }
    ]
});

// 批量更新
await dataService.batchUpdate([
        {
            id: 'section-1',
            data: {
                updated: [{ sys_id: 'xxx', field: 'value' }]
            }
        }
    ]
);

//获取区块数据
const result = await dataService.getSectionData(SECTION_ID,{
    status: 'active'
});

//更新区块数据
await dataService.updateSectionData(SECTION_ID,{
    updated:[
        {
            sys_id: 'xxx-xxx',
            name: 'John Updated'
        }
    ]
});

//获取数据架构
const result = await dataService.getScheme(SECTION_ID);
```

## API 文档

### appConfig

配置管理对象。

#### 方法

- `init(config)` - 初始化配置
- `getApiUrl(path)` - 获取完整的 API 地址
- `getAuthHeaders()` - 获取认证请求头
- `clearAuth()` - 清除认证信息
- `setApiBaseUrl(url)` - 设置 API 基础地址

#### 属性

- `API_BASE_URL` - API 基础地址
- `AUTH_TOKEN` - 认证 Token
- `REQUEST_TIMEOUT` - 请求超时时间
- `DEBUG` - 调试模式开关
- `PAGINATION` - 分页配置

### dataService

数据访问服务对象。

#### 方法

- `query(id,options)` - 查询数据
- `insert(id,options)` - 插入数据
- `update(id,options)` - 更新数据
- `remove(id,options)` - 删除数据
- `batchUpdate(sections)` - 批量更新
- `getSectionData(id, where)` - 获取区块数据（兼容旧版）
- `updateSectionData(id, options)` - 更新区块数据（兼容旧版）
- `getScheme(id)` - 获取区块数据架构
- `generateUUID()` - 生成 UUID
- `setHandlerUrl(url)` - 设置自定义 Handler URL
- `getHandlerUrl()` - 获取当前 Handler URL

## 配置说明

配置优先级（从高到低）：

1. 环境变量（.env 文件或系统环境变量）
2. localStorage（运行时设置）
3. 代码配置（appConfig.init()）
4. 默认配置

### 环境变量

- `VITE_API_BASE_URL` 或 `REACT_APP_API_BASE_URL` - API 基础地址
- `VITE_AUTH_TOKEN` 或 `REACT_APP_AUTH_TOKEN` - 认证 Token
- `VITE_REQUEST_TIMEOUT` 或 `REACT_APP_REQUEST_TIMEOUT` - 请求超时时间
- `VITE_DEBUG` 或 `REACT_APP_DEBUG` - 调试模式

## 许可证

MIT
