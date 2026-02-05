#!/usr/bin/env node
/**
 * 用于验证 jetop-service 连接和配置的测试脚本。
 *
 * 用法：
 *    node test_connection.js
 *    node test_connection.js --api-url https://test1.tepc.cn/jetopcms
 *    node test_connection.js --token your-token
 *
 * 此脚本帮助验证 API 端点是否可访问且配置正确。
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * 解析命令行参数
 */
function parseArgs() {
    const args = {
        apiUrl: '',
        token: '',
        timeout: 10000
    };

    for (let i = 2; i < process.argv.length; i++) {
        const arg = process.argv[i];
        if (arg === '--api-url' && i + 1 < process.argv.length) {
            args.apiUrl = process.argv[++i];
        } else if (arg === '--token' && i + 1 < process.argv.length) {
            args.token = process.argv[++i];
        } else if (arg === '--timeout' && i + 1 < process.argv.length) {
            args.timeout = parseInt(process.argv[++i]) * 1000;
        } else if (arg === '--help' || arg === '-h') {
            console.log(`
用法：
    node test_connection.js [选项]

选项：
    --api-url <url>     API 基础 URL（例如：https://test1.tepc.cn/jetopcms）
    --token <token>     身份验证令牌
    --timeout <秒>      请求超时时间（秒）（默认：10）
    --help, -h          显示此帮助信息
`);
            process.exit(0);
        }
    }

    return args;
}

/**
 * 发起 HTTP 请求
 */
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : http;

        const timeout = options.timeout || 10000;
        const reqOptions = {
            method: options.method || 'HEAD',
            headers: options.headers || {},
            timeout: timeout
        };

        const req = client.request(url, reqOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error(`连接超时，超过 ${timeout / 1000} 秒`));
        });

        if (options.body) {
            req.write(options.body);
        }

        req.end();
    });
}

/**
 * 测试 API 端点是否可访问
 */
async function testApiConnection(apiUrl, timeout = 10000) {
    try {
        const url = new URL('/ks/sectionHandler.ashx', apiUrl).href;
        console.log(`正在测试连接到：${url}`);

        const response = await makeRequest(url, { timeout });

        if (response.statusCode < 500) {
            console.log(`✓ 连接成功（状态：${response.statusCode}）`);
            return true;
        } else {
            console.log(`✗ 服务器错误（状态：${response.statusCode}）`);
            return false;
        }
    } catch (err) {
        if (err.message.includes('超时')) {
            console.log(`✗ ${err.message}`);
        } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
            console.log(`✗ 连接失败：${err.message}`);
        } else {
            console.log(`✗ 意外错误：${err.message}`);
        }
        return false;
    }
}

/**
 * 测试身份验证令牌是否有效
 */
async function testAuthToken(apiUrl, token, timeout = 10000) {
    try {
        const url = new URL('/ks/sectionHandler.ashx', apiUrl).href;
        console.log('\n正在使用令牌测试身份验证...');

        const formData = new URLSearchParams({
            mode: 'query',
            id: 'test-section-id',
            _pageindex: '1',
            _pagesize: '1'
        });

        const response = await makeRequest(url, {
            method: 'POST',
            headers: {
                'X-JetopDebug-User': token,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(formData.toString())
            },
            body: formData.toString(),
            timeout
        });

        if (response.statusCode === 200) {
            console.log('✓ 身份验证成功');
            return true;
        } else if (response.statusCode === 401) {
            console.log('✗ 身份验证失败：令牌无效');
            return false;
        } else if (response.statusCode === 403) {
            console.log('✗ 身份验证失败：禁止访问');
            return false;
        } else {
            console.log(`✓ 令牌已接受（状态：${response.statusCode}）`);
            console.log('  注意：测试查询可能失败，但令牌未被拒绝');
            return true;
        }
    } catch (err) {
        console.log(`✗ 身份验证测试失败：${err.message}`);
        return false;
    }
}

/**
 * 打印配置信息
 */
function printConfigInfo(apiUrl, token) {
    console.log('\n配置信息：');
    console.log('='.repeat(50));
    console.log(`API 基础 URL：${apiUrl}`);
    console.log(`处理器 URL：${new URL('/ks/sectionHandler.ashx', apiUrl).href}`);
    console.log(`身份验证令牌：${token ? '已设置' : '未设置'}（${token ? token.length : 0} 个字符）`);
    console.log();
}

/**
 * 打印环境设置说明
 */
function printEnvironmentSetup() {
    console.log('\n环境设置说明：');
    console.log('='.repeat(50));
    console.log('\n1. 对于 Vite 项目，创建 .env 文件：');
    console.log('   VITE_API_BASE_URL=https://test1.tepc.cn/jetopcms');
    console.log('   VITE_AUTH_TOKEN=your-token-here');
    console.log('\n2. 对于 React 项目，创建 .env 文件：');
    console.log('   REACT_APP_API_BASE_URL=https://test1.tepc.cn/jetopcms');
    console.log('   REACT_APP_AUTH_TOKEN=your-token-here');
    console.log('\n3. 对于 Node.js 项目：');
    console.log('   NODE_API_BASE_URL=https://test1.tepc.cn/jetopcms');
    console.log('   NODE_AUTH_TOKEN=your-token-here');
    console.log('\n4. 在代码中：');
    console.log("   import { appConfig } from 'jetop-service';");
    console.log('   appConfig.init({');
    console.log("       apiBaseUrl: 'https://test1.tepc.cn/jetopcms',");
    console.log("       authToken: 'your-token'");
    console.log('   });');
    console.log();
}

/**
 * 主函数
 */
async function main() {
    const args = parseArgs();

    if (args.apiUrl) {
        printConfigInfo(args.apiUrl, args.token);

        // 测试连接
        const connectionOk = await testApiConnection(args.apiUrl, args.timeout);

        // 如果提供了令牌，测试身份验证
        let authOk = false;
        if (args.token && connectionOk) {
            authOk = await testAuthToken(args.apiUrl, args.token, args.timeout);
        } else if (!args.token && connectionOk) {
            console.log('\n跳过身份验证测试（未提供令牌）');
        }

        // 打印摘要
        console.log('\n测试摘要：');
        console.log('='.repeat(50));
        console.log(`连接：${connectionOk ? '✓ 通过' : '✗ 失败'}`);
        if (args.token) {
            console.log(`身份验证：${authOk ? '✓ 通过' : '✗ 失败'}`);
        } else {
            console.log('身份验证：已跳过（无令牌）');
        }

        // 退出代码
        if (connectionOk && (authOk || !args.token)) {
            console.log('\n✓ 所有测试通过');
            process.exit(0);
        } else {
            console.log('\n✗ 部分测试失败');
            process.exit(1);
        }
    } else {
        console.log('未提供 API URL。');
        printEnvironmentSetup();
        process.exit(0);
    }
}

// 运行主函数
main().catch((err) => {
    console.error('发生错误：', err.message);
    process.exit(1);
});
