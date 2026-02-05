# Jetop 数据访问技能

一个用于在 OA 办公系统中处理 jetop-service 数据操作的综合技能包。

## ⚠️ 前置要求

**使用此技能前，必须先验证环境配置！**

### 第一步：验证环境配置

在执行任何数据操作前，运行环境验证脚本：

```bash
python .claude/skills/jetop-data-access/scripts/validate_env.py
```

### 如果验证失败

1. 运行配置文件生成脚本：
```bash
python .claude/skills/jetop-data-access/scripts/generate_env.py
```
这会在项目根目录创建 .env 文件，默认使用占位符 `your-token-here`

2. **手动编辑**项目根目录的 `.env` 文件，配置身份验证令牌：

```env
VITE_API_BASE_URL=https://test1.tepc.cn/jetopcms
VITE_AUTH_TOKEN=your-token-here
```

3. 将 `your-token-here` 替换为实际的身份验证令牌

4. 重新运行验证脚本确认配置正确。

**重要安全提示：**
- `VITE_AUTH_TOKEN` 必须由**用户手动填写**
- 技能不会自动填入 token 值
- Token 不能为空或默认占位符 'your-token-here'
- `.env` 文件应添加到 `.gitignore`
- 修改 `.env` 后需要重启开发服务器

## 概述

此技能为 Claude 提供以下专业知识和工具：
- 通过区块 ID 检索数据架构
- 执行 CRUD 操作（创建、读取、更新、删除）
- 批量更新多个区块
- 生成组件数据访问代码
- 根据架构验证数据

## 安装

1. 打包技能：
   ```bash
   cd /path/to/skill-creator
   python scripts/package_skill.py /path/to/jetop-data-access
   ```

2. 在 Claude Code 中安装生成的 `.zip` 文件

## 包含内容

### SKILL.md
主要技能说明，涵盖：
- 用途和使用场景
- 核心概念和架构
- 如何使用技能进行各种操作
- 常见模式和最佳实践
- 故障排除指南

### 参考文档 (`references/`)
详细文档文件：
- `dataService-api.md` - 所有方法的完整 API 参考
- `schema-structure.md` - 数据架构系统文档
- `config-management.md` - 配置指南

### 脚本 (`scripts/`)
实用工具脚本：
- `validate_env.py` - **验证环境配置（使用技能前必须运行）**
- `generate_env.py` - 生成 .env 配置文件模板
- `get_schema.py` - 检索并显示区块 ID 的架构
- `test_connection.py` - 测试 API 连接和身份验证

## 快速开始

安装后，Claude 可以使用此技能来：

### 1. 获取数据架构

```javascript
import { getScheme } from 'jetop-service';

const scheme = await getScheme('section-id');
// 返回包含类型、约束等的字段定义数组
```

### 2. 查询数据

```javascript
import { query } from 'jetop-service';

const result = await query('section-id', {
    where: { status: 'active' },
    pageIndex: 1,
    pageSize: 20
});
```

### 3. 插入数据

```javascript
import { insert, generateUUID } from 'jetop-service';

await insert('section-id', {
    inserted: [{
        name: 'Product Name',
        sys_id: generateUUID()
    }]
});
```

### 4. 更新数据

```javascript
import { update } from 'jetop-service';

await update('section-id', {
    updated: [{
        sys_id: 'existing-id',
        name: 'Updated Name'
    }]
});
```

### 5. 删除数据

```javascript
import { remove } from 'jetop-service';

await remove('section-id', {
    deleted: [{ sys_id: 'id-to-delete' }]
});
```

## 何时使用此技能

在以下情况下使用此技能：
- 处理 jetop-service 数据操作
- 需要检索或理解数据架构
- 构建需要数据访问的组件
- 实现 CRUD 功能
- 需要正确错误处理的示例
- 开发 OA 办公系统功能

## 技能功能

### 架构操作
- 通过区块 ID 检索完整架构
- 理解字段类型、约束和默认值
- 从架构生成表单字段
- 根据架构验证数据

### 数据操作
- 带过滤和分页的查询
- 使用正确的 UUID 生成插入新记录
- 更新现有记录
- 删除记录
- 批量更新多个区块

### 代码生成
- 生成组件 CRUD 代码
- 创建架构驱动的表单
- 实现验证逻辑
- 设置正确的错误处理

## 示例任务

询问 Claude：

- "获取区块 ID xyz 的架构"
- "为产品区块创建带过滤的查询函数"
- "为文件传阅功能生成 CRUD 操作"
- "根据架构验证此数据"
- "基于区块架构创建表单"
- "帮我实现多个区块的批量更新"

## 技术细节

### 所需配置

使用 jetop-service 之前：

```javascript
import { appConfig } from 'jetop-service';

appConfig.init({
    apiBaseUrl: 'https://your-api.com',
    authToken: 'your-token'
});
```

或使用环境变量：
```env
VITE_API_BASE_URL=https://your-api.com
VITE_AUTH_TOKEN=your-token
```

### 关键概念

1. **区块 ID**：标识数据区块的 UUID
2. **架构**：描述字段结构（名称、类型、约束）
3. **sys_id**：所有记录必需的 UUID 字段
4. **CRUD 操作**：创建（insert）、读取（query）、更新（update）、删除（remove）
5. **批量更新**：在一个事务中更新多个区块

## 实用工具

### 验证环境配置（必需的第一步）

```bash
python .claude/skills/jetop-data-access/scripts/validate_env.py
# 验证 .env 文件和 token 配置是否正确
```

### 生成配置文件

```bash
python .claude/skills/jetop-data-access/scripts/generate_env.py
# 自动生成 .env 配置文件模板
```

### 获取架构脚本

```bash
python .claude/skills/jetop-data-access/scripts/get_schema.py <section-id>
python .claude/skills/jetop-data-access/scripts/get_schema.py <section-id> --output json
python .claude/skills/jetop-data-access/scripts/get_schema.py <section-id> --output summary
```

### 测试连接脚本

```bash
python .claude/skills/jetop-data-access/scripts/test_connection.py --api-url https://api.com --token your-token
```

## 开发

此技能专为以下环境设计：
- React/Vue/JavaScript 应用程序
- OA 办公系统开发
- jetop-service v1.x

## 支持

如有问题或疑问：
1. 查看 `references/` 中的参考文档
2. 查阅 SKILL.md 中的常见模式
3. 使用故障排除指南
4. 查看 jetop-service 包文档

## 版本

版本：1.1.0
最后更新：2026-02-03

### 更新日志

**v1.1.0 (2026-02-03)**
- ✨ 新增：`validate_env.py` 环境验证脚本
- 🔒 安全：强制要求在执行数据操作前验证 token 配置
- 📝 文档：更新 SKILL.md 和 README.md，强调环境验证的重要性
- 🛡️ 改进：增强 token 格式验证（长度、占位符检查）
- 📚 更新：调整工作流，将环境验证作为必需的第一步

**v1.0.0 (初始版本)**
- 基础数据访问功能
- 架构获取和 CRUD 操作
- 配置生成和连接测试脚本
