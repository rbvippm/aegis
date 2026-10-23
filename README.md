# Aegis

冰川蓝液态玻璃风格的 Vue 移动数据工具。H5 与 Telegram Mini App 共用前端，当前仅保留首页演示，其他导航页及二级入口统一为文案占位，后续逐页设计。

## 启动

```bash
nvm use
npm ci
npm run dev
```

默认演示模式，无需密钥。本地开发地址为 http://127.0.0.1:6173。端口被占用时会报错，请先释放端口。

```bash
npm run check
npx playwright install chromium
npm run test:e2e
```

## Cursor 与 Codex

共同打开 aegis 根目录并读取 AGENTS.md。共享技能：`.agents/skills/aegis-vue-liquid-glass/`；Cursor 规则指向同一规范。Codex 可输入 `使用 $aegis-vue-liquid-glass …`，Cursor 用 `/` 选择同名技能。请避免两个工具同时编辑同一文件。

## 结构

```text
src/app        路由与入口
src/pages      首页、通用占位页与 404
src/features   AI、监测、赔率、资金排名
src/shared     组件、样式、契约、基础服务
src/platform   Web / Telegram 官方 bridge
src/mocks      固定演示数据与请求阶段模拟
src/stores     显示偏好
tests          单元与移动端浏览器测试
docs           当前开发文档
doc            旧业务资料（仅本地保留，已忽略）
```

## 当前边界

演示赛事、平台和资金数据均为虚构。未连接真实大模型、内部知识库或链上服务。首页输入及快捷入口进入对应占位页，不发起分析请求。

监测、AI、对比、我的，以及 VIP、代理和资金对比二级入口仅显示页面标题与“页面设计中，敬请期待”。底层数据契约、服务及排名逻辑保留，供后续逐页实现使用。

详见 [接口与后续范围](docs/API.md)、[部署步骤](docs/DEPLOYMENT.md)、[开发路线](docs/ROADMAP.md)。
