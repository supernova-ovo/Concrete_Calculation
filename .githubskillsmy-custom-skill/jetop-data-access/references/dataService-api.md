# DataService API 参考

jetop-service dataService 所有方法的完整 API 参考。

## 响应格式统一处理

**重要说明：** jetop-service 已对所有 API 响应进行统一格式转换，确保一致的响应结构。

### 原始 API 响应格式

后端 API 实际返回的格式可能是：
```javascript
// 成功响应
{
    STATUS: "OK",      // 注意：是 "OK" 而不是 "Success"
    MSG: ""           // 消息字段
}

// 错误响应
{
    STATUS: "ERROR",
    MSG: "错误信息"
}
```

### 标准化后的响应格式

jetop-service 会自动将原始响应转换为统一格式：

```javascript
// 成功响应
{
    STATUS: "Success",    // 统一转换为 "Success"
    MESSAGE: ""           // 统一使用 MESSAGE 字段
}

// 错误响应
{
    STATUS: "Error",      // 统一转换为 "Error"
    MESSAGE: "错误信息"
}
```

这意味着：
- ✅ 所有数据操作方法（insert、update、remove）都返回统一格式
- ✅ 只需检查 `STATUS === 'Success'` 即可判断成功
- ✅ 错误信息统一从 `MESSAGE` 字段获取
- ✅ 无需处理多种响应格式变体

## 目录

1. [核心方法](#核心方法)
2. [配置方法](#配置方法)
3. [实用方法](#实用方法)
4. [错误处理](#错误处理)

## 核心方法

### query

从区块查询数据，支持可选的过滤和分页。

**签名：**
```javascript
async function query(id, options)
```

**参数：**

| 参数 | 类型 | 必需 | 描述 |
|-----------|------|----------|-------------|
| `id` | string | 是 | 区块 ID（UUID 格式） |
| `options` | object | 是 | 查询选项 |
| `options.where` | object | 否 | 过滤条件（字段-值对） |
| `options.pageIndex` | number | 否 | 页码（默认：1） |
| `options.pageSize` | number | 否 | 每页项数（默认：10） |
| `options._eps` | string | 否 | 端点覆盖 |
| `options._dsid` | string | 否 | 数据源 ID 覆盖 |

**返回值：**

```javascript
{
    STATUS: "Success",
    TOTAL: 100,        // 记录总数
    ROWS: [            // 数据记录数组
        { field1: value1, field2: value2, ... },
        ...
    ]
}
```

**示例：**

```javascript
// 基础查询
const result = await query('d5017c73-02f8-4050-9254-57a3d6af6ea0');

// 带过滤条件的查询
const result = await query('d5017c73-02f8-4050-9254-57a3d6af6ea0', {
    where: {
        producttype: '风衣',
        status: 'active'
    },
    pageIndex: 1,
    pageSize: 20
});

// 带多个过滤条件的查询
const result = await query('section-id', {
    where: {
        category: 'electronics',
        price_min: 100,
        price_max: 1000,
        in_stock: 'Y'
    },
    pageIndex: 2,
    pageSize: 50
});
```

**实现细节：**

- Where 子句字段自动添加 `_p_` 前缀
- 支持可配置页面大小的分页
- 如果未找到数据，返回空数组
- 如果区块 ID 为空，抛出错误

**错误情况：**

```javascript
// 缺少区块 ID
await query(); // 错误: 区块ID不能为空

// 无效的区块 ID
await query('invalid-id'); // 可能返回空结果或 HTTP 错误
```

---

### insert

向区块插入新记录。

**签名：**
```javascript
async function insert(id, options)
```

**参数：**

| 参数 | 类型 | 必需 | 描述 |
|-----------|------|----------|-------------|
| `id` | string | 是 | 区块 ID（UUID 格式） |
| `options` | object | 是 | 插入选项 |
| `options.inserted` | array | 是 | 要插入的记录数组 |
| `options._dsid` | string | 否 | 数据源 ID 覆盖 |

**返回值：**

```javascript
{
    STATUS: "Success",
    MESSAGE: "Data inserted successfully"
}
```

**示例：**

```javascript
import { insert, generateUUID } from 'jetop-service';

// 插入单条记录
const result = await insert('d5017c73-02f8-4050-9254-57a3d6af6ea0', {
    inserted: [
        {
            productid: 'FL-DLH-03',
            productname: '测试产品',
            producttype: '风衣',
            unitcost: 299.00,
            sys_id: generateUUID()
        }
    ]
});

// 插入多条记录
const result = await insert('section-id', {
    inserted: [
        {
            name: 'Product 1',
            price: 100,
            sys_id: generateUUID()
        },
        {
            name: 'Product 2',
            price: 200,
            sys_id: generateUUID()
        },
        {
            name: 'Product 3',
            price: 300,
            sys_id: generateUUID()
        }
    ]
});
```

**实现细节：**

- 始终包含带有生成的 UUID 的 `sys_id` 字段
- 数据在传输前进行 Base64 编码
- 所有记录在单个事务中插入
- 验证在服务器端执行

**错误情况：**

```javascript
// 缺少区块 ID
await insert(); // 错误: 区块ID不能为空

// 缺少 inserted 数组
await insert('section-id', {}); // 错误: 插入数据不能为空

// 空的 inserted 数组
await insert('section-id', { inserted: [] }); // 错误: 插入数据不能为空

// 缺少 sys_id（可能导致服务器错误）
await insert('section-id', {
    inserted: [{ name: 'Test' }]  // 缺少 sys_id
});
```

---

### update

更新区块中的现有记录。

**签名：**
```javascript
async function update(id, options)
```

**参数：**

| 参数 | 类型 | 必需 | 描述 |
|-----------|------|----------|-------------|
| `id` | string | 是 | 区块 ID（UUID 格式） |
| `options` | object | 是 | 更新选项 |
| `options.updated` | array | 是 | 要更新的记录数组 |
| `options._dsid` | string | 否 | 数据源 ID 覆盖 |

**返回值：**

```javascript
{
    STATUS: "Success",
    MESSAGE: "Data updated successfully"
}
```

**示例：**

```javascript
// 更新单条记录
const result = await update('d5017c73-02f8-4050-9254-57a3d6af6ea0', {
    updated: [
        {
            sys_id: '84216B91-E7CF-4D87-983C-FBE2AD3EC9DD',
            productname: '更新后的产品名称',
            unitcost: 349.00
        }
    ]
});

// 更新多条记录
const result = await update('section-id', {
    updated: [
        {
            sys_id: 'id-1',
            status: 'active',
            updated_date: new Date().toISOString()
        },
        {
            sys_id: 'id-2',
            status: 'inactive',
            updated_date: new Date().toISOString()
        }
    ]
});

// 部分更新（仅指定字段）
const result = await update('section-id', {
    updated: [
        {
            sys_id: '84216B91-E7CF-4D87-983C-FBE2AD3EC9DD',
            status: 'active'  // 仅更新 status 字段
        }
    ]
});
```

**实现细节：**

- 需要 `sys_id` 来标识记录
- 仅更新指定的字段（部分更新）
- 未指定的字段保留其原始值
- 数据在传输前进行 Base64 编码

**错误情况：**

```javascript
// 缺少区块 ID
await update(); // 错误: 区块ID不能为空

// 缺少 updated 数组
await update('section-id', {}); // 错误: 更新数据不能为空

// 空的 updated 数组
await update('section-id', { updated: [] }); // 错误: 更新数据不能为空

// 缺少 sys_id
await update('section-id', {
    updated: [{ name: 'Test' }]  // 缺少 sys_id - 将失败
});
```

---

### remove

从区块删除记录。

**签名：**
```javascript
async function remove(id, options)
```

**参数：**

| 参数 | 类型 | 必需 | 描述 |
|-----------|------|----------|-------------|
| `id` | string | 是 | 区块 ID（UUID 格式） |
| `options` | object | 是 | 删除选项 |
| `options.deleted` | array | 是 | 要删除的记录数组（需要 sys_id） |
| `options._dsid` | string | 否 | 数据源 ID 覆盖 |

**返回值：**

```javascript
{
    STATUS: "Success",
    MESSAGE: "Data deleted successfully"
}
```

**示例：**

```javascript
// 删除单条记录
const result = await remove('d5017c73-02f8-4050-9254-57a3d6af6ea0', {
    deleted: [
        { sys_id: '84216B91-E7CF-4D87-983C-FBE2AD3EC9DD' }
    ]
});

// 删除多条记录
const result = await remove('section-id', {
    deleted: [
        { sys_id: 'id-1' },
        { sys_id: 'id-2' },
        { sys_id: 'id-3' }
    ]
});

// 带确认的删除模式
const confirmAndDelete = async (sectionId, recordId) => {
    const confirmed = confirm('Are you sure you want to delete this record?');
    if (confirmed) {
        return await remove(sectionId, {
            deleted: [{ sys_id: recordId }]
        });
    }
};
```

**实现细节：**

- deleted 对象中只需要 `sys_id`
- 如果存在其他字段，将被忽略
- 删除是永久性的（无软删除）
- 数据在传输前进行 Base64 编码

**错误情况：**

```javascript
// 缺少区块 ID
await remove(); // 错误: 区块ID不能为空

// 缺少 deleted 数组
await remove('section-id', {}); // 错误: 删除数据不能为空

// 空的 deleted 数组
await remove('section-id', { deleted: [] }); // 错误: 删除数据不能为空

// 缺少 sys_id
await remove('section-id', {
    deleted: [{ name: 'Test' }]  // 缺少 sys_id - 将失败
});
```

---

### batchUpdate

在单个事务中更新多个区块。

**签名：**
```javascript
async function batchUpdate(sections)
```

**参数：**

| 参数 | 类型 | 必需 | 描述 |
|-----------|------|----------|-------------|
| `sections` | array | 是 | 区块更新对象数组 |
| `sections[].id` | string | 是 | 区块 ID |
| `sections[].data` | object | 是 | 包含 inserted/updated/deleted 数组的数据对象 |
| `sections[].data.inserted` | array | 否 | 要插入的记录 |
| `sections[].data.updated` | array | 否 | 要更新的记录 |
| `sections[].data.deleted` | array | 否 | 要删除的记录 |

**返回值：**

```javascript
{
    STATUS: "Success",
    MESSAGE: "Batch update completed successfully"
}
```

**示例：**

```javascript
import { batchUpdate, generateUUID } from 'jetop-service';

// 更新多个区块
const result = await batchUpdate([
    {
        id: 'section-1',
        data: {
            updated: [
                { sys_id: 'xxx-1', unitcost: 15.00 },
                { sys_id: 'xxx-2', unitcost: 20.00 }
            ]
        }
    },
    {
        id: 'section-2',
        data: {
            inserted: [
                {
                    name: 'New Product',
                    price: 100,
                    sys_id: generateUUID()
                }
            ],
            deleted: [
                { sys_id: 'old-id' }
            ]
        }
    }
]);

// 复杂的批量操作
const result = await batchUpdate([
    {
        id: 'products-section',
        data: {
            inserted: [
                { name: 'Product A', sys_id: generateUUID() }
            ],
            updated: [
                { sys_id: 'existing-id', name: 'Updated Product' }
            ]
        }
    },
    {
        id: 'orders-section',
        data: {
            updated: [
                { sys_id: 'order-id', status: 'completed' }
            ]
        }
    },
    {
        id: 'inventory-section',
        data: {
            updated: [
                { sys_id: 'item-id', quantity: 50 }
            ]
        }
    }
]);
```

**实现细节：**

- 所有区块在单个 HTTP 请求中更新
- 更新是事务性的（全部成功或全部失败）
- 每个区块可以有插入、更新和删除操作
- 每个区块的数据分别进行 Base64 编码

**错误情况：**

```javascript
// 缺少 sections 数组
await batchUpdate(); // 错误: 区块数据不能为空

// 空的 sections 数组
await batchUpdate([]); // 错误: 区块数据不能为空

// 缺少区块 ID
await batchUpdate([
    { data: { updated: [...] } }  // 缺少 id
]);

// 缺少 data 对象
await batchUpdate([
    { id: 'section-id' }  // 缺少 data
]);
```

---

### getScheme

获取区块的数据架构。

**签名：**
```javascript
async function getScheme(id)
```

**参数：**

| 参数 | 类型 | 必需 | 描述 |
|-----------|------|----------|-------------|
| `id` | string | 是 | 区块 ID（UUID 格式） |

**返回值：**

```javascript
[
    {
        XuHao: 1,                    // 字段序号
        ZiDuanMC: 'productid',       // 字段名称
        ZiDuanMS: '产品ID',          // 字段描述
        ShuJuLX: 'nvarchar',         // 数据类型 (nvarchar/decimal)
        ZiDuanCD: 50,                // 字段长度
        JingDu: 0,                   // 精度（用于 decimal）
        YunXuKZ: 'N',                // 允许空值 (Y/N)
        MoRenZ: '',                  // 默认值
        data_id: 'xxx',              // 数据源 ID
        sys_id: 'xxx'                // 系统 ID
    },
    // ... 更多字段
]
```

**示例：**

```javascript
// 获取区块的架构
const scheme = await getScheme('d5017c73-02f8-4050-9254-57a3d6af6ea0');

// 显示架构信息
scheme.forEach(field => {
    console.log(`Field: ${field.ZiDuanMC} (${field.ZiDuanMS})`);
    console.log(`  Type: ${field.ShuJuLX}`);
    console.log(`  Required: ${field.YunXuKZ === 'N' ? 'Yes' : 'No'}`);
    console.log(`  Default: ${field.MoRenZ || 'None'}`);
});

// 从架构生成表单字段
const generateFormFields = async (sectionId) => {
    const scheme = await getScheme(sectionId);

    return scheme.map(field => ({
        name: field.ZiDuanMC,
        label: field.ZiDuanMS,
        type: field.ShuJuLX === 'decimal' ? 'number' : 'text',
        required: field.YunXuKZ === 'N',
        defaultValue: field.MoRenZ,
        maxLength: field.ZiDuanCD
    }));
};

// 根据架构验证数据
const validateAgainstScheme = async (sectionId, data) => {
    const scheme = await getScheme(sectionId);
    const errors = [];

    for (const field of scheme) {
        const value = data[field.ZiDuanMC];

        // 检查必填字段
        if (field.YunXuKZ === 'N' && !value) {
            errors.push(`${field.ZiDuanMS} is required`);
        }

        // 检查数据类型
        if (value && field.ShuJuLX === 'decimal' && isNaN(value)) {
            errors.push(`${field.ZiDuanMS} must be a number`);
        }

        // 检查长度
        if (value && field.ShuJuLX === 'nvarchar' && value.length > field.ZiDuanCD) {
            errors.push(`${field.ZiDuanMS} exceeds max length`);
        }
    }

    return errors;
};
```

**实现细节：**

- 从多个系统表检索架构
- 支持表视图和基于查询的源
- 架构包括字段元数据和约束
- 如果未找到区块，返回空数组

**错误情况：**

```javascript
// 缺少区块 ID
const scheme = await getScheme(); // 可能返回空数组

// 无效的区块 ID
const scheme = await getScheme('invalid-id'); // 返回空数组

// 未找到区块
const scheme = await getScheme('non-existent-id'); // 返回空数组
```

---

### getSectionData

查询区块数据的内部方法（比 `query` 更底层）。

**签名：**
```javascript
async function getSectionData(id, params)
```

**参数：**

| 参数 | 类型 | 必需 | 描述 |
|-----------|------|----------|-------------|
| `id` | string | 是 | 区块 ID |
| `params` | object | 是 | 查询参数（带 _p_ 前缀） |

**返回值：**

数据记录数组或空数组。

**示例：**

```javascript
// 直接区块数据查询
const data = await getSectionData('section-id', {
    '_p_status': 'active',
    '_p_category': 'electronics'
});

// 由 getScheme 内部使用
const dbinfo = await getSectionData('d8879104-fc53-4509-97e4-da4aea628c12', {
    '_p_sid': sectionId
});
```

**注意：** 这通常在内部使用。应用程序级查询使用 `query()`。

---

## 配置方法

### appConfig.init

初始化数据服务的配置。

**签名：**
```javascript
appConfig.init(config)
```

**参数：**

| 参数 | 类型 | 必需 | 描述 |
|-----------|------|----------|-------------|
| `config` | object | 是 | 配置对象 |
| `config.apiBaseUrl` | string | 否 | API 基础 URL |
| `config.authToken` | string | 否 | 身份验证令牌 |
| `config.requestTimeout` | number | 否 | 请求超时时间（毫秒） |
| `config.debug` | boolean | 否 | 启用调试日志 |
| `config.pagination` | object | 否 | 默认分页设置 |

**示例：**

```javascript
import { appConfig } from 'jetop-service';

// 基础初始化
appConfig.init({
    apiBaseUrl: 'https://test1.tepc.cn/jetopcms',
    authToken: 'your-token'
});

// 完整初始化
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

---

### appConfig 属性

在运行时访问或修改配置。

**属性：**

```javascript
// 获取 API 基础 URL
const baseUrl = appConfig.API_BASE_URL;

// 设置身份验证令牌
appConfig.AUTH_TOKEN = 'new-token';

// 获取完整的 API URL
const url = appConfig.getApiUrl('/ks/sectionHandler.ashx');

// 获取身份验证头
const headers = appConfig.getAuthHeaders();
// 返回: { 'X-JetopDebug-User': 'your-token' }
```

---

## 实用方法

### generateUUID

为新记录生成 UUID。

**签名：**
```javascript
function generateUUID()
```

**返回值：**

UUID 格式的字符串（例如，"84216B91-E7CF-4D87-983C-FBE2AD3EC9DD"）

**示例：**

```javascript
import { generateUUID } from 'jetop-service';

// 为新记录生成 UUID
const newRecord = {
    name: 'Product Name',
    sys_id: generateUUID()
};

// 生成多个 UUID
const ids = Array.from({ length: 10 }, () => generateUUID());
```

---

### setHandlerUrl

覆盖默认的处理器 URL。

**签名：**
```javascript
function setHandlerUrl(url)
```

**参数：**

| 参数 | 类型 | 必需 | 描述 |
|-----------|------|----------|-------------|
| `url` | string | 是 | 自定义处理器 URL |

**示例：**

```javascript
import { setHandlerUrl } from 'jetop-service';

// 使用自定义端点
setHandlerUrl('https://custom-api.com/handler.ashx');
```

---

### getHandlerUrl

获取当前的处理器 URL。

**签名：**
```javascript
function getHandlerUrl()
```

**返回值：**

当前处理器 URL 字符串。

**示例：**

```javascript
import { getHandlerUrl } from 'jetop-service';

const currentUrl = getHandlerUrl();
console.log('Using handler URL:', currentUrl);
```

---

## 错误处理

### 常见错误模式

```javascript
import { query } from 'jetop-service';

// Try-catch 模式
const fetchData = async (sectionId) => {
    try {
        const result = await query(sectionId, {
            where: { status: 'active' }
        });
        return result;
    } catch (error) {
        console.error('Query failed:', error);
        throw error;
    }
};

// 带用户反馈
const fetchDataWithFeedback = async (sectionId) => {
    try {
        const result = await query(sectionId);
        console.log('Data loaded successfully');
        return result;
    } catch (error) {
        if (error.message.includes('HTTP error')) {
            console.error('Network error:', error);
            alert('Failed to connect to server');
        } else {
            console.error('Query error:', error);
            alert('Failed to load data');
        }
        throw error;
    }
};

// 重试模式
const fetchDataWithRetry = async (sectionId, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await query(sectionId);
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            console.log(`Retry ${i + 1}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
};
```

### 错误类型

| 错误消息 | 原因 | 解决方案 |
|---------------|-------|----------|
| "区块ID不能为空" | 缺少区块 ID | 提供有效的区块 ID |
| "插入数据不能为空" | 空的 inserted 数组 | 至少提供一条记录 |
| "更新数据不能为空" | 空的 updated 数组 | 至少提供一条记录 |
| "删除数据不能为空" | 空的 deleted 数组 | 至少提供一条记录 |
| "HTTP error! status: XXX" | 网络或服务器错误 | 检查连接和 API 状态 |
| Base64 编码错误 | 无效的数据格式 | 验证数据结构 |

### 操作前验证

```javascript
// 插入前验证
const safeInsert = async (sectionId, records) => {
    if (!sectionId) {
        throw new Error('Section ID is required');
    }

    if (!records || !Array.isArray(records) || records.length === 0) {
        throw new Error('At least one record is required');
    }

    // 确保所有记录都有 sys_id
    const validated = records.map(record => ({
        ...record,
        sys_id: record.sys_id || generateUUID()
    }));

    return await insert(sectionId, { inserted: validated });
};

// 更新前验证
const safeUpdate = async (sectionId, records) => {
    if (!sectionId) {
        throw new Error('Section ID is required');
    }

    if (!records || !Array.isArray(records) || records.length === 0) {
        throw new Error('At least one record is required');
    }

    // 确保所有记录都有 sys_id
    const missing = records.filter(r => !r.sys_id);
    if (missing.length > 0) {
        throw new Error('All records must have sys_id for update');
    }

    return await update(sectionId, { updated: records });
};
```
