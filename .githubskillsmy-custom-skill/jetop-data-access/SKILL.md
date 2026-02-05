---
name: jetop-data-access
description: 为 OA 办公系统提供数据访问能力的技能。支持在不运行项目的情况下获取区块id数据架构、查询数据和保存数据。当需要使用 jetop-service 进行数据操作时使用此技能，包括根据 ID 获取架构、为组件查询数据以及执行 CRUD 操作。
---

# Jetop 数据访问技能

## 🔒 强制前置条件检查

**【重要】使用此技能执行任何操作前，必须先完成以下配置验证：**

### 步骤 1：验证环境配置

在执行任何数据操作前，必须运行以下命令验证环境配置：

```bash
node .claude/skills/jetop-data-access/scripts/validate_env.js
```

### 步骤 2：检查验证结果

**✅ 验证通过的条件：**
- .env 文件存在于项目根目录
- VITE_AUTH_TOKEN 已配置且值不是 `your-token-here`
- Token 格式有效（非空字符串）
- VITE_API_BASE_URL 配置正确

**❌ 验证失败的表现：**
- 显示 "未找到 .env 文件"
- 显示 "Token 未配置（仍为默认占位符）"
- 显示任何其他配置错误

### 步骤 3：如果验证失败

1. 生成配置文件：
   ```bash
   node .claude/skills/jetop-data-access/scripts/generate_env.js
   ```

2. **手动编辑**项目根目录的 `.env` 文件：
   - 找到 `VITE_AUTH_TOKEN=your-token-here`
   - 将 `your-token-here` 替换为**实际的认证令牌**
   - Token 获取方式：从浏览器访问 `https://test1.tepc.cn/jetopcms/ks/protalpage_layui.aspx?id=137c1dbc-58b3-ddb0-0340-a029a324457d`，复制请求头中 `X-JetopDebug-User` 的值

3. 重新验证：
   ```bash
   node .claude/skills/jetop-data-access/scripts/validate_env.js
   ```

### ⛔ 限制规则

**在以下情况下，不得执行任何数据操作：**
- ❌ 验证脚本未执行
- ❌ 验证脚本执行失败
- ❌ VITE_AUTH_TOKEN 仍为占位符 `your-token-here`
- ❌ .env 文件不存在
- ❌ Token 格式无效

**只有当验证脚本显示全部 ✅ 绿色标记时，才能继续执行后续的数据操作。**

---

## ⚠️ 重要：首次使用必读

**在执行任何数据操作前，必须先验证环境配置！**

使用此技能的第一步是验证 .env 文件和身份验证令牌是否已正确配置：

```bash
node .claude/skills/jetop-data-access/scripts/validate_env.js
```

如果验证失败：
1. 运行 `node .claude/skills/jetop-data-access/scripts/generate_env.js` 创建配置文件
2. **手动编辑** .env 文件，将 `VITE_AUTH_TOKEN` 的值 `your-token-here` 替换为实际令牌
3. 重新运行验证脚本确认配置正确

**重要安全提示：**
- Token 需要**用户手动填写**，技能不会自动填入
- 生成的 .env 文件默认使用占位符 `your-token-here`
- 验证脚本会检测并拒绝占位符值

**未通过验证前，不允许执行数据操作！**

## 技能用途

该技能为基于 jetop-service 架构的 OA 办公系统提供全面的数据访问能力。使 Claude 能够理解和使用数据层，包括获取数据架构、执行 CRUD 操作、协助组件数据需求——所有这些都无需运行项目。

## 何时使用此技能

在以下情况下使用此技能：

1. **架构获取**：需要根据区块 ID 获取数据结构/架构
2. **数据查询**：需要为组件查询、筛选或分页数据
3. **数据修改**：需要插入、更新或删除数据
4. **批量操作**：需要同时更新多个区块
5. **组件开发**：需要为 UI 组件提供数据访问代码
6. **数据架构理解**：需要理解数据模型和字段定义

## 核心概念

### 数据服务架构

jetop-service 包提供了一个统一的数据访问层，通过 HTTP POST 请求与后端 API 通信。所有数据操作都通过 `dataService` 模块进行。

**关键特性：**
- 基于 FormData 的请求格式
- Base64 编码的数据传输
- 统一的错误处理
- 灵活的配置管理

### 数据架构结构

每个数据区块都有一个定义其字段的架构。架构字段包括：

- `ZiDuanMC`：字段名称（如 "productid"）
- `ZiDuanMS`：字段描述（如 "产品ID"）
- `ShuJuLX`：数据类型（"decimal" 或 "nvarchar"）
- `ZiDuanCD`：字段长度（默认：50）
- `JingDu`：精度（用于 decimal 类型）
- `YunXuKZ`：允许空值（"Y" 或 "N"）
- `MoRenZ`：默认值

## 前置要求

**⚠️ 重要：使用此技能前必须先配置环境变量**

在使用 jetop-service 进行任何数据操作之前，必须在项目根目录创建 `.env` 文件并配置身份验证令牌。

### 创建 .env 文件

如果项目根目录不存在 `.env` 文件，创建该文件并添加以下内容：

```env
# API 配置（必需）
VITE_API_BASE_URL=https://test1.tepc.cn/jetopcms
VITE_AUTH_TOKEN=your-token-here

# 可选配置
VITE_REQUEST_TIMEOUT=30000
VITE_DEBUG=true
```

**配置说明：**
- `VITE_API_BASE_URL`：API 服务器地址
- `VITE_AUTH_TOKEN`：身份验证令牌（**必需**）
  - 获取方式：从浏览器中访问 `https://test1.tepc.cn/jetopcms/ks/protalpage_layui.aspx?id=137c1dbc-58b3-ddb0-0340-a029a324457d`，复制请求头中 `X-JetopDebug-User` 的值
- `VITE_REQUEST_TIMEOUT`：请求超时时间（毫秒，可选）
- `VITE_DEBUG`：是否启用调试模式（可选）

**注意：**
1. `.env` 文件应添加到 `.gitignore`，避免提交敏感信息
2. 如果没有身份验证令牌，请联系系统管理员获取
3. 使用 `scripts/generate_env.js` 脚本可以快速生成 .env 模板

### 快速生成 .env 文件

运行以下命令自动生成 .env 模板文件：

```bash
node scripts/generate_env.js
```

该脚本会：
- 检查 .env 文件是否存在
- 如果不存在，创建包含必需配置的模板
- 提示你填入实际的令牌值

## 如何使用此技能

### 1. 获取数据架构

在不运行项目的情况下获取数据区块的架构：

```javascript
import { getScheme } from 'jetop-service';

// 根据区块 ID 获取架构
const scheme = await getScheme('section-id-here');

// 返回结构：
// [
//   {
//     XuHao: 1,
//     ZiDuanMC: 'productid',
//     ZiDuanMS: '产品ID',
//     ShuJuLX: 'nvarchar',
//     ZiDuanCD: 50,
//     JingDu: 0,
//     YunXuKZ: 'N',
//     MoRenZ: '',
//     data_id: 'xxx',
//     sys_id: 'xxx'
//   },
//   // ... 更多字段
// ]
```

**实现细节：**
- 通过查询系统表获取准确的架构信息
- 支持表视图和查询类型的数据源
- 返回完整的字段定义，包括类型、长度、精度、默认值等
- 阅读 `references/dataService-api.md` 了解 getScheme 的完整实现
- 支持表视图和基于查询的数据源

### 2. 查询数据

为组件提供数据查询功能：

```javascript
import { query } from 'jetop-service';

// 基本查询
const result = await query('section-id', {
    where: {},
    pageIndex: 1,
    pageSize: 10
});

// 带筛选条件的查询
const result = await query('section-id', {
    where: {
        producttype: '风衣',
        status: 'active'
    },
    pageIndex: 1,
    pageSize: 20
});

// 返回格式：
// {
//   STATUS: "Success",
//   TOTAL: 100,
//   ROWS: [...]
// }
```

**查询参数：**
- `where`：用于筛选的字段-值对象
- `pageIndex`：页码（默认：1）
- `pageSize`：每页项数（默认：10）
- `_eps`：可选的端点覆盖
- `_dsid`：可选的数据源 ID

### 3. 插入数据

为组件提供插入功能：

```javascript
import { insert, generateUUID } from 'jetop-service';

const result = await insert('section-id', {
    inserted: [
        {
            productid: 'FL-DLH-03',
            productname: '测试产品',
            producttype: '风衣',
            sys_id: generateUUID()  // 始终为新记录生成 UUID
        }
    ]
});
```

**重要提示：** 始终为新记录包含生成的 UUID 的 `sys_id` 字段。

### 4. 更新数据

为组件提供更新功能：

```javascript
import { update } from 'jetop-service';

const result = await update('section-id', {
    updated: [
        {
            sys_id: '84216B91-E7CF-4D87-983C-FBE2AD3EC9DD',  // 必填
            productname: '更新后的产品名称',
            producttype: '夹克'
        }
    ]
});
```

**重要提示：** 更新时需要 `sys_id` 来标识记录。

### 5. 删除数据

为组件提供删除功能：

```javascript
import { remove } from 'jetop-service';

const result = await remove('section-id', {
    deleted: [
        { sys_id: '84216B91-E7CF-4D87-983C-FBE2AD3EC9DD' }
    ]
});
```

**重要提示：** 删除时只需要 `sys_id`。

### 6. 批量更新

用于影响多个区块的操作：

```javascript
import { batchUpdate } from 'jetop-service';

const result = await batchUpdate([
    {
        id: 'section-1',
        data: {
            updated: [
                { sys_id: 'xxx', field: 'value' }
            ]
        }
    },
    {
        id: 'section-2',
        data: {
            inserted: [
                { name: 'New Item', sys_id: generateUUID() }
            ]
        }
    }
]);
```

### 7. 配置管理

使用 dataService 之前，确保正确配置：

```javascript
import { appConfig } from 'jetop-service';

// 初始化配置
appConfig.init({
    apiBaseUrl: 'https://test1.tepc.cn/jetopcms',
    authToken: 'your-token',
    requestTimeout: 30000,
    debug: true
});

// 运行时更新 token
appConfig.AUTH_TOKEN = 'new-token';
```

**配置源（优先级顺序）：**
1. 环境变量（VITE_API_BASE_URL、REACT_APP_API_BASE_URL）
2. localStorage
3. 代码初始化（appConfig.init）
4. 默认值

## 捆绑资源

### 参考文档

1. **`references/dataService-api.md`** - 所有 dataService 方法的完整 API 参考
   - 详细的参数描述
   - 返回值格式
   - 错误处理模式
   - 高级使用示例

2. **`references/schema-structure.md`** - 数据架构字段定义和约定
   - 字段命名约定
   - 数据类型映射
   - 架构获取内部机制

3. **`references/config-management.md`** - 配置系统文档
   - 所有配置选项
   - 环境变量设置
   - 配置优先级规则

### 脚本工具

1. **`scripts/validate_env.js`** - 验证环境配置（必需的第一步）
   - 用法：`node scripts/validate_env.js`
   - 检查 .env 文件是否存在
   - 验证必需配置（AUTH_TOKEN、API_BASE_URL）
   - 验证 token 格式和有效性
   - 使用 `--strict` 检查所有可选配置
   - Python 版本：`scripts/validate_env.py` 同样可用

2. **`scripts/generate_env.js`** - 生成 .env 配置文件
   - 用法：`node scripts/generate_env.js`
   - 自动创建包含必需配置的 .env 模板
   - 检查并更新 .gitignore
   - 提供配置说明
   - Python 版本：`scripts/generate_env.py` 同样可用

3. **`scripts/get_schema.js`** - 根据区块 ID 获取并显示架构的工具
   - 用法：`node scripts/get_schema.js <section-id>`
   - 输出格式化的架构信息
   - 无需代码即可快速检查架构
   - Python 版本：`scripts/get_schema.py` 同样可用

4. **`scripts/test_connection.js`** - 测试连接性和配置
   - 用法：`node scripts/test_connection.js --api-url <url> --token <token>`
   - 验证 API 端点可访问性
   - 检查认证令牌
   - 验证基本查询操作
   - Python 版本：`scripts/test_connection.py` 同样可用

## 使用工作流

### ⚠️ 必需的第一步：环境验证

**在执行任何数据操作前，必须先验证环境配置：**

```bash
node .claude/skills/jetop-data-access/scripts/validate_env.js
```

如果验证通过，你会看到 ✅ 标记。如果失败，按照提示修复配置问题。

### 初次使用

1. **验证环境配置**（必需的第一步）
   ```bash
   node .claude/skills/jetop-data-access/scripts/validate_env.js
   ```

2. **如果验证失败，生成配置文件**
   ```bash
   node .claude/skills/jetop-data-access/scripts/generate_env.js
   ```
   这会在项目根目录创建 .env 文件，默认使用占位符 `your-token-here`

3. **手动编辑 .env 文件**
   - 打开项目根目录的 .env 文件
   - 找到 `VITE_AUTH_TOKEN=your-token-here`
   - 将 `your-token-here` 替换为实际的身份验证令牌
   - **重要**：Token 必须由用户手动填写，技能不会自动填入
   - 确认 `VITE_API_BASE_URL` 正确

4. **重新验证配置**
   ```bash
   node .claude/skills/jetop-data-access/scripts/validate_env.js
   ```

5. **测试连接**（可选）
   ```bash
   node .claude/skills/jetop-data-access/scripts/test_connection.js --api-url https://test1.tepc.cn/jetopcms --token your-token
   ```

6. **开始使用**
   - 配置验证通过后即可使用所有数据访问功能
   - 在代码中 jetop-service 会自动读取环境变量

### 日常使用

直接使用 Claude 进行数据操作，技能会自动处理配置。

## 最佳实践

### 生成代码时

1. **验证环境配置** - 首要步骤！在执行任何操作前验证配置
   ```bash
   node .claude/skills/jetop-data-access/scripts/validate_env.js
   ```
2. **始终验证区块 ID** - 执行操作前验证
3. **包含错误处理** - 使用 try-catch 块
4. **生成 UUID** - 使用 `generateUUID()` 为所有新记录生成
5. **使用有意义的变量名** - 遵循驼峰命名约定
6. **添加注释** - 为复杂的查询逻辑添加注释
7. **测试查询** - 先使用小的页面大小测试

### 数据验证

1. **检查必填字段** - 根据架构在插入/更新前检查
2. **尊重字段类型** - 从架构中了解 decimal vs nvarchar
3. **验证空值约束** - 检查 `YunXuKZ` 字段
4. **应用默认值** - 适当时应用 `MoRenZ`

### 性能考虑

1. **使用分页** - 对大数据集使用分页
2. **尽早筛选** - 使用具体的 where 子句
3. **批量操作** - 更新多个区块时使用批量操作
4. **缓存架构** - 重复访问同一区块时缓存架构

## 常见模式

### 模式 1：带 CRUD 操作的组件

```javascript
import { query, insert, update, remove, generateUUID } from 'jetop-service';

const sectionId = 'your-section-id';

// 获取数据用于显示
const loadData = async (filters = {}, page = 1, pageSize = 10) => {
    try {
        const result = await query(sectionId, {
            where: filters,
            pageIndex: page,
            pageSize: pageSize
        });
        return result;
    } catch (error) {
        console.error('加载数据失败:', error);
        throw error;
    }
};

// 创建新记录
const createRecord = async (data) => {
    try {
        const result = await insert(sectionId, {
            inserted: [{
                ...data,
                sys_id: generateUUID()
            }]
        });
        return result;
    } catch (error) {
        console.error('创建记录失败:', error);
        throw error;
    }
};

// 更新现有记录
const updateRecord = async (sysId, data) => {
    try {
        const result = await update(sectionId, {
            updated: [{
                sys_id: sysId,
                ...data
            }]
        });
        return result;
    } catch (error) {
        console.error('更新记录失败:', error);
        throw error;
    }
};

// 删除记录
const deleteRecord = async (sysId) => {
    try {
        const result = await remove(sectionId, {
            deleted: [{ sys_id: sysId }]
        });
        return result;
    } catch (error) {
        console.error('删除记录失败:', error);
        throw error;
    }
};
```

### 模式 2：基于架构的表单生成

```javascript
import { getScheme } from 'jetop-service';

const generateFormFields = async (sectionId) => {
    try {
        const scheme = await getScheme(sectionId);

        const formFields = scheme.map(field => ({
            name: field.ZiDuanMC,
            label: field.ZiDuanMS,
            type: field.ShuJuLX === 'decimal' ? 'number' : 'text',
            required: field.YunXuKZ === 'N',
            defaultValue: field.MoRenZ,
            maxLength: field.ZiDuanCD
        }));

        return formFields;
    } catch (error) {
        console.error('生成表单字段失败:', error);
        throw error;
    }
};
```

### 模式 3：基于架构的数据验证

```javascript
import { getScheme } from 'jetop-service';

const validateData = async (sectionId, data) => {
    const scheme = await getScheme(sectionId);
    const errors = [];

    for (const field of scheme) {
        const value = data[field.ZiDuanMC];

        // 检查必填字段
        if (field.YunXuKZ === 'N' && (value === null || value === undefined || value === '')) {
            errors.push(`${field.ZiDuanMS}为必填项`);
        }

        // 检查数据类型
        if (value !== null && value !== undefined) {
            if (field.ShuJuLX === 'decimal' && isNaN(value)) {
                errors.push(`${field.ZiDuanMS}必须是数字`);
            }

            if (field.ShuJuLX === 'nvarchar' && typeof value !== 'string') {
                errors.push(`${field.ZiDuanMS}必须是字符串`);
            }
        }

        // 检查字符串字段的长度
        if (field.ShuJuLX === 'nvarchar' && typeof value === 'string') {
            if (value.length > field.ZiDuanCD) {
                errors.push(`${field.ZiDuanMS}超过最大长度 ${field.ZiDuanCD}`);
            }
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};
```

## 故障排除

### 常见问题

1. **首要排查步骤：验证环境配置**
   - 运行验证脚本：`node .claude/skills/jetop-data-access/scripts/validate_env.js`
   - 这会自动检查所有常见配置问题
   - 按照验证脚本的提示修复问题

2. **"配置未找到" 或 "AUTH_TOKEN 未设置" 错误**
   - 运行环境验证：`node .claude/skills/jetop-data-access/scripts/validate_env.js`
   - 如果验证失败，运行 `node .claude/skills/jetop-data-access/scripts/generate_env.js` 生成配置
   - 编辑 .env 文件，确保 VITE_AUTH_TOKEN 已设置且不是 'your-token-here'
   - 重启开发服务器以重新加载环境变量
   - 重新运行验证脚本确认修复

3. **"区块ID不能为空" 错误**
   - 确保为所有数据操作提供了区块 ID
   - 验证 ID 格式正确（UUID 格式）

4. **认证失败**
   - 运行验证脚本检查 token 配置
   - 验证令牌是否未过期
   - 确保 API_BASE_URL 正确
   - 使用 `node .claude/skills/jetop-data-access/scripts/test_connection.js --api-url <url> --token <token>` 测试连接

5. **架构结果为空**
   - 验证区块 ID 在系统中存在
   - 检查数据源是否正确配置
   - 查看 `references/schema-structure.md` 了解架构获取逻辑

6. **查询返回无数据**
   - 验证 where 子句字段名与架构匹配
   - 检查分页参数
   - 确保给定筛选条件下存在数据

## 参考文件

如需详细信息，请阅读捆绑的参考文件：

- **`references/dataService-api.md`** - 完整的 API 文档
- **`references/schema-structure.md`** - 架构系统详情
- **`references/config-management.md`** - 配置指南

需要时使用 grep 模式搜索参考文件：
- API 方法详情：`grep -A 20 "### query\|### insert\|### update" references/dataService-api.md`
- 架构字段：`grep "ZiDuan" references/schema-structure.md`
- 配置选项：`grep "API_BASE_URL\|AUTH_TOKEN" references/config-management.md`
