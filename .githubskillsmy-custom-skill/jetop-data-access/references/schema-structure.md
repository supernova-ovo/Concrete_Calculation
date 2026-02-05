# 架构结构文档

本文档解释 jetop-service 中使用的数据架构系统。

## 概述

系统中的每个数据区块都有一个定义其结构的架构。架构描述区块中的所有字段，包括它们的名称、类型、约束和元数据。

## 架构字段定义

架构中的每个字段包含以下属性：

### 字段属性

| 属性 | 类型 | 描述 | 示例值 |
|----------|------|-------------|----------------|
| `XuHao` | number | 字段的顺序号 | 1, 2, 3, ... |
| `ZiDuanMC` | string | 字段名称（数据库列名） | "productid", "sys_id", "created_date" |
| `ZiDuanMS` | string | 字段描述（显示标签） | "产品ID", "系统ID", "创建日期" |
| `ShuJuLX` | string | 数据类型 | "nvarchar", "decimal" |
| `ZiDuanCD` | number | 字段长度（用于字符串类型） | 50, 100, 255 |
| `JingDu` | number | 精度（用于 decimal 类型） | 0, 2, 4 |
| `YunXuKZ` | string | 允许空值标志 | "Y" (允许), "N" (不允许) |
| `MoRenZ` | string | 默认值 | "", "0", "active" |
| `data_id` | string | 数据源 ID | UUID |
| `sys_id` | string | 此架构记录的系统 ID | UUID |

## 数据类型

### nvarchar（字符串类型）

用于文本数据。

**属性：**
- `ZiDuanCD`: 最大字符长度（例如，50, 100, 255）
- `JingDu`: 字符串类型始终为 0

**示例：**
```javascript
{
    ZiDuanMC: 'productname',
    ZiDuanMS: '产品名称',
    ShuJuLX: 'nvarchar',
    ZiDuanCD: 100,
    JingDu: 0
}
```

**验证：**
- 检查长度不超过 `ZiDuanCD`
- 值必须是字符串类型

### decimal（数值类型）

用于数值数据（整数和小数）。

**属性：**
- `ZiDuanCD`: 总位数（精度）
- `JingDu`: 小数位数（标度）

**示例：**
```javascript
// 整数
{
    ZiDuanMC: 'quantity',
    ZiDuanMS: '数量',
    ShuJuLX: 'decimal',
    ZiDuanCD: 10,
    JingDu: 0
}

// 带 2 位小数的小数
{
    ZiDuanMC: 'unitcost',
    ZiDuanMS: '单价',
    ShuJuLX: 'decimal',
    ZiDuanCD: 18,
    JingDu: 2
}
```

**验证：**
- 值必须是数值（不是 NaN）
- 小数位数不应超过 `JingDu`

## 空值约束

`YunXuKZ` 属性确定字段是否可以为空。

| 值 | 含义 | 验证 |
|-------|---------|------------|
| "N" | 不为空（必填） | 必须提供值 |
| "Y" | 可为空（可选） | 值可以为 null/undefined |

**示例：**

```javascript
// 必填字段
{
    ZiDuanMC: 'productid',
    ZiDuanMS: '产品ID',
    YunXuKZ: 'N'  // 必须提供值
}

// 可选字段
{
    ZiDuanMC: 'description',
    ZiDuanMS: '描述',
    YunXuKZ: 'Y'  // 可以为 null
}
```

## 默认值

`MoRenZ` 属性指定未提供字段时的默认值。

**示例：**

```javascript
// 字符串默认值
{
    ZiDuanMC: 'status',
    ZiDuanMS: '状态',
    MoRenZ: 'active'
}

// 数值默认值
{
    ZiDuanMC: 'quantity',
    ZiDuanMS: '数量',
    MoRenZ: '0'
}

// 无默认值（空字符串）
{
    ZiDuanMC: 'notes',
    ZiDuanMS: '备注',
    MoRenZ: ''
}
```

## 架构检索过程

`getScheme()` 函数通过多个步骤检索架构：

### 步骤 1：获取数据库信息

```javascript
const dbinfo = await getSectionData('d8879104-fc53-4509-97e4-da4aea628c12', {
    '_p_sid': sectionId
});
```

这将检索有关数据源的元数据，包括：
- `id`: 数据源 ID
- `dsType`: 数据源类型（"表视图"或基于查询）

### 步骤 2：获取基础架构

```javascript
const scheme = await getSectionData('2d89f7b7-8be8-4d90-9500-fb3cd96c8c92', {
    '_p_did': dbinfo.id
});
```

这将从架构表检索基础字段定义。

### 步骤 3：获取表数据（如果需要）

对于非表视图源：

```javascript
const data = await getSectionData('9c88c101-e30f-4d2c-ac06-63cd61227250', {
    '_p_did': dbinfo.id
});
```

### 步骤 4：转换为架构格式

```javascript
function convertDataToScheme(tablescheme, oldscheme, dbinfo) {
    const scheme = [];
    let index = 0;

    tablescheme[0].forEach(function(value, key) {
        index += 1;
        const oldField = oldscheme.filter(item =>
            item.ZiDuanMC.toLowerCase() == key.toLowerCase()
        );

        scheme.push({
            XuHao: index,
            ZiDuanMC: key,
            ZiDuanMS: oldField.length > 0 ? oldField[0].ZiDuanMS : key,
            ShuJuLX: (typeof value === 'number') ? 'decimal' : 'nvarchar',
            ZiDuanCD: 50,
            JingDu: 0,
            YunXuKZ: oldField.length > 0 ? oldField[0].YunXuKZ : "N",
            MoRenZ: oldField.length > 0 ? oldField[0].MoRenZ : "",
            data_id: dbinfo.id,
            sys_id: generateUUID()
        });
    });

    return scheme;
}
```

**转换逻辑：**
- 从样本值推断数据类型（number → decimal，否则 → nvarchar）
- 如果可用，使用现有架构元数据（ZiDuanMS、YunXuKZ、MoRenZ）
- 为每个字段生成新的 sys_id
- 分配顺序号

## 使用架构进行验证

### 基础验证函数

```javascript
async function validateData(sectionId, data) {
    const scheme = await getScheme(sectionId);
    const errors = [];

    for (const field of scheme) {
        const value = data[field.ZiDuanMC];

        // 检查必填字段
        if (field.YunXuKZ === 'N') {
            if (value === null || value === undefined || value === '') {
                errors.push({
                    field: field.ZiDuanMC,
                    message: `${field.ZiDuanMS} is required`
                });
            }
        }

        // 检查数据类型
        if (value !== null && value !== undefined && value !== '') {
            if (field.ShuJuLX === 'decimal') {
                if (isNaN(value)) {
                    errors.push({
                        field: field.ZiDuanMC,
                        message: `${field.ZiDuanMS} must be a number`
                    });
                }
            } else if (field.ShuJuLX === 'nvarchar') {
                if (typeof value !== 'string') {
                    errors.push({
                        field: field.ZiDuanMC,
                        message: `${field.ZiDuanMS} must be a string`
                    });
                } else if (value.length > field.ZiDuanCD) {
                    errors.push({
                        field: field.ZiDuanMC,
                        message: `${field.ZiDuanMS} exceeds maximum length of ${field.ZiDuanCD}`
                    });
                }
            }
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}
```

### 使用示例

```javascript
// 插入前验证
const data = {
    productid: 'PROD-001',
    productname: 'Test Product',
    unitcost: 299.99
};

const validation = await validateData('section-id', data);

if (validation.isValid) {
    await insert('section-id', {
        inserted: [{
            ...data,
            sys_id: generateUUID()
        }]
    });
} else {
    console.error('Validation errors:', validation.errors);
    // 处理验证错误
}
```

## 使用架构生成表单

### 生成表单字段

```javascript
async function generateFormFields(sectionId) {
    const scheme = await getScheme(sectionId);

    return scheme.map(field => {
        const formField = {
            name: field.ZiDuanMC,
            label: field.ZiDuanMS,
            required: field.YunXuKZ === 'N',
            defaultValue: field.MoRenZ
        };

        // 根据数据类型设置输入类型
        if (field.ShuJuLX === 'decimal') {
            formField.type = 'number';
            formField.step = field.JingDu > 0 ? (1 / Math.pow(10, field.JingDu)).toString() : '1';
        } else {
            formField.type = 'text';
            formField.maxLength = field.ZiDuanCD;
        }

        return formField;
    });
}
```

### 示例表单字段输出

```javascript
const formFields = await generateFormFields('product-section-id');

// 结果:
[
    {
        name: 'productid',
        label: '产品ID',
        type: 'text',
        maxLength: 50,
        required: true,
        defaultValue: ''
    },
    {
        name: 'productname',
        label: '产品名称',
        type: 'text',
        maxLength: 100,
        required: true,
        defaultValue: ''
    },
    {
        name: 'unitcost',
        label: '单价',
        type: 'number',
        step: '0.01',
        required: false,
        defaultValue: '0'
    }
]
```

## 应用默认值

### 应用默认值的函数

```javascript
async function applyDefaults(sectionId, data) {
    const scheme = await getScheme(sectionId);
    const result = { ...data };

    for (const field of scheme) {
        // 如果字段缺失且有默认值，则应用默认值
        if (!(field.ZiDuanMC in result) && field.MoRenZ) {
            // 将默认值转换为正确的类型
            if (field.ShuJuLX === 'decimal') {
                result[field.ZiDuanMC] = parseFloat(field.MoRenZ);
            } else {
                result[field.ZiDuanMC] = field.MoRenZ;
            }
        }
    }

    return result;
}
```

### 使用示例

```javascript
// 不完整的数据
const data = {
    productid: 'PROD-001',
    productname: 'Test Product'
    // status 字段缺失
};

// 从架构应用默认值
const completeData = await applyDefaults('section-id', data);

// 结果:
// {
//     productid: 'PROD-001',
//     productname: 'Test Product',
//     status: 'active'  // 应用了默认值
// }

await insert('section-id', {
    inserted: [{
        ...completeData,
        sys_id: generateUUID()
    }]
});
```

## 架构缓存

为了性能，考虑缓存架构：

```javascript
class SchemaCache {
    constructor() {
        this.cache = new Map();
        this.ttl = 5 * 60 * 1000; // 5 分钟
    }

    async getScheme(sectionId) {
        const cached = this.cache.get(sectionId);

        if (cached && Date.now() - cached.timestamp < this.ttl) {
            return cached.scheme;
        }

        const scheme = await getScheme(sectionId);

        this.cache.set(sectionId, {
            scheme,
            timestamp: Date.now()
        });

        return scheme;
    }

    clear(sectionId) {
        if (sectionId) {
            this.cache.delete(sectionId);
        } else {
            this.cache.clear();
        }
    }
}

// 使用方法
const schemaCache = new SchemaCache();
const scheme = await schemaCache.getScheme('section-id');
```

## 常见字段命名约定

基于 jetop-service 实现：

| 字段名称 | 描述 | 类型 | 注释 |
|------------|-------------|------|-------|
| `sys_id` | 系统 ID | nvarchar | 必需，UUID 格式 |
| `created_date` | 创建时间戳 | nvarchar | ISO 日期字符串 |
| `updated_date` | 更新时间戳 | nvarchar | ISO 日期字符串 |
| `status` | 记录状态 | nvarchar | 例如，"active", "inactive" |
| `*_id` | 外键引用 | nvarchar | 以 "_id" 结尾 |
| `*_date` | 日期字段 | nvarchar | ISO 格式 |
| `*_cost` 或 `*_price` | 货币值 | decimal | 通常 JingDu: 2 |
| `quantity` 或 `count` | 数量 | decimal | 通常 JingDu: 0 |

## 最佳实践

### 1. 始终先检索架构

```javascript
// 好的做法
const scheme = await getScheme(sectionId);
// 现在使用架构构建查询、验证数据等

// 不好的做法
// 在不检查架构的情况下硬编码字段名称
await insert(sectionId, {
    inserted: [{ field: 'value' }]  // 可能在架构中不存在
});
```

### 2. 遵守字段约束

```javascript
// 在允许空值之前检查 YunXuKZ
const field = scheme.find(f => f.ZiDuanMC === 'productid');
if (field.YunXuKZ === 'N' && !data.productid) {
    throw new Error('productid is required');
}
```

### 3. 使用正确的数据类型

```javascript
// 根据架构转换类型
const prepareValue = (field, value) => {
    if (field.ShuJuLX === 'decimal') {
        return parseFloat(value);
    }
    return String(value);
};
```

### 4. 应用长度约束

```javascript
// 截断或验证字符串长度
const validateLength = (field, value) => {
    if (field.ShuJuLX === 'nvarchar') {
        if (value.length > field.ZiDuanCD) {
            throw new Error(`${field.ZiDuanMS} too long (max: ${field.ZiDuanCD})`);
        }
    }
};
```

## 完整示例

```javascript
import { getScheme, insert, generateUUID } from 'jetop-service';

async function createRecord(sectionId, inputData) {
    // 步骤 1：获取架构
    const scheme = await getScheme(sectionId);

    // 步骤 2：验证数据
    const errors = [];
    const record = { sys_id: generateUUID() };

    for (const field of scheme) {
        const value = inputData[field.ZiDuanMC];

        // 检查必填
        if (field.YunXuKZ === 'N' && !value) {
            if (field.MoRenZ) {
                record[field.ZiDuanMC] = field.MoRenZ;
            } else {
                errors.push(`${field.ZiDuanMS} is required`);
            }
        } else if (value !== null && value !== undefined) {
            // 验证类型
            if (field.ShuJuLX === 'decimal' && isNaN(value)) {
                errors.push(`${field.ZiDuanMS} must be a number`);
            } else if (field.ShuJuLX === 'nvarchar') {
                if (String(value).length > field.ZiDuanCD) {
                    errors.push(`${field.ZiDuanMS} exceeds max length`);
                }
            }

            // 添加到记录
            record[field.ZiDuanMC] = field.ShuJuLX === 'decimal'
                ? parseFloat(value)
                : String(value);
        }
    }

    // 步骤 3：检查错误
    if (errors.length > 0) {
        throw new Error('Validation failed: ' + errors.join(', '));
    }

    // 步骤 4：插入记录
    return await insert(sectionId, {
        inserted: [record]
    });
}
```
