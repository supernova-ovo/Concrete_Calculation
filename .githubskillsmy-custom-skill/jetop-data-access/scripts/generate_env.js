#!/usr/bin/env node
/**
 * 用于生成 .env 配置文件的脚本
 *
 * 用法：
 *     node generate_env.js
 *     node generate_env.js --force
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const ENV_TEMPLATE = `# jetop-service 配置文件
# 此文件包含敏感信息，请勿提交到版本控制系统

# API 配置（必需）
# API 服务器地址
VITE_API_BASE_URL=https://test1.tepc.cn/jetopcms
# 身份验证令牌：从浏览器中访问 https://test1.tepc.cn/jetopcms/ks/protalpage_layui.aspx?id=137c1dbc-58b3-ddb0-0340-a029a324457d，复制请求头中 X-JetopDebug-User 的值
VITE_AUTH_TOKEN=your-token-here

# 可选配置
# 请求超时时间（毫秒）
VITE_REQUEST_TIMEOUT=30000
# 是否启用调试模式
VITE_DEBUG=true
`;

/**
 * 查找项目根目录
 */
function findProjectRoot() {
    let current = process.cwd();

    // 向上查找最多 5 层
    for (let i = 0; i < 5; i++) {
        const packageJsonPath = path.join(current, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            return current;
        }

        const parent = path.dirname(current);
        if (parent === current) {
            break;
        }
        current = parent;
    }

    return process.cwd();
}

/**
 * 创建readline接口
 */
function createReadline() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

/**
 * 询问用户输入
 */
function askQuestion(rl, question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim().toLowerCase());
        });
    });
}

/**
 * 检查并更新 .gitignore
 */
async function checkGitignore(projectRoot) {
    const gitignorePath = path.join(projectRoot, '.gitignore');

    if (!fs.existsSync(gitignorePath)) {
        console.log();
        console.log('⚠️  未找到 .gitignore 文件');

        const rl = createReadline();
        const response = await askQuestion(rl, '是否创建 .gitignore 并添加 .env？(Y/n): ');
        rl.close();

        if (response !== 'n') {
            try {
                fs.writeFileSync(gitignorePath, '# 环境变量文件\n.env\n.env.local\n', 'utf-8');
                console.log(`✅ 已创建 .gitignore: ${gitignorePath}`);
            } catch (error) {
                console.log(`❌ 创建 .gitignore 失败: ${error.message}`);
            }
        }
        return;
    }

    // 检查 .gitignore 是否包含 .env
    try {
        const content = fs.readFileSync(gitignorePath, 'utf-8');

        if (!content.includes('.env')) {
            console.log();
            console.log('⚠️  .gitignore 中未包含 .env');

            const rl = createReadline();
            const response = await askQuestion(rl, '是否添加到 .gitignore？(Y/n): ');
            rl.close();

            if (response !== 'n') {
                fs.appendFileSync(gitignorePath, '\n# 环境变量文件\n.env\n.env.local\n', 'utf-8');
                console.log('✅ 已将 .env 添加到 .gitignore');
            }
        } else {
            console.log();
            console.log('✅ .env 已在 .gitignore 中');
        }
    } catch (error) {
        console.log(`⚠️  检查 .gitignore 时出错: ${error.message}`);
    }
}

/**
 * 创建 .env 文件
 */
async function createEnvFile(projectRoot, force = false) {
    const envPath = path.join(projectRoot, '.env');

    // 检查文件是否存在
    if (fs.existsSync(envPath) && !force) {
        console.log(`⚠️  .env 文件已存在于: ${envPath}`);
        console.log();

        const rl = createReadline();
        const response = await askQuestion(rl, '是否要覆盖现有文件？(y/N): ');
        rl.close();

        if (response !== 'y') {
            console.log('❌ 操作已取消');
            return false;
        }
    }

    try {
        fs.writeFileSync(envPath, ENV_TEMPLATE, 'utf-8');

        console.log(`✅ 成功创建 .env 文件: ${envPath}`);
        console.log();
        console.log('📝 下一步操作：');
        console.log('1. 编辑 .env 文件');
        console.log('2. 将 \'your-token-here\' 替换为实际的身份验证令牌');
        console.log('3. 如有需要，修改 API_BASE_URL');
        console.log();
        console.log('⚠️  重要提示：');
        console.log('   - 请勿将 .env 文件提交到版本控制系统');
        console.log('   - 确保 .env 已添加到 .gitignore');

        await checkGitignore(projectRoot);

        return true;
    } catch (error) {
        console.log(`❌ 创建 .env 文件失败: ${error.message}`);
        return false;
    }
}

/**
 * 打印配置说明
 */
function printConfigInstructions() {
    console.log();
    console.log('='.repeat(60));
    console.log('jetop-service 配置说明');
    console.log('='.repeat(60));
    console.log();
    console.log('📋 必需配置：');
    console.log('   VITE_AUTH_TOKEN - 身份验证令牌');
    console.log();
    console.log('🔑 如何获取令牌：');
    console.log('   1. 联系系统管理员获取身份验证令牌');
    console.log('   2. 或在系统管理界面生成新令牌');
    console.log();
    console.log('🚀 配置完成后：');
    console.log('   1. 重启开发服务器（如果正在运行）');
    console.log('   2. 配置会自动加载');
    console.log('   3. 可以开始使用 jetop-service 进行数据操作');
    console.log();
    console.log('📖 更多信息：');
    console.log('   查看 references/config-management.md 了解详细配置选项');
    console.log();
}

/**
 * 主函数
 */
async function main() {
    const args = process.argv.slice(2);
    const force = args.includes('--force') || args.includes('-f');
    const showHelp = args.includes('--show-help');

    if (showHelp) {
        printConfigInstructions();
        return;
    }

    console.log();
    console.log('🔧 jetop-service .env 文件生成器');
    console.log('='.repeat(60));
    console.log();

    // 查找项目根目录
    const projectRoot = findProjectRoot();
    console.log(`📁 项目根目录: ${projectRoot}`);
    console.log();

    // 创建 .env 文件
    const success = await createEnvFile(projectRoot, force);

    if (success) {
        console.log();
        console.log('='.repeat(60));
        console.log();

        const rl = createReadline();
        const response = await askQuestion(rl, '是否查看配置说明？(Y/n): ');
        rl.close();

        if (response !== 'n') {
            printConfigInstructions();
        }
    }
}

// 执行主函数
main().catch(error => {
    console.error(`\n❌ 发生错误: ${error.message}`);
    process.exit(1);
});
