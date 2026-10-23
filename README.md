# Aegis

冰川蓝液态玻璃风格的 Vue 移动数据工具。H5 与 Telegram Mini App 共用前端，当前保留首页演示，并在「监测」页展示平台产品调研；「对比」展示体育报价、套利试算与排名，AI、我的等其余页面继续文案占位。

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
src/pages      首页、监测产品调研、体育对比、通用占位页与 404
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

演示赛事、平台和资金数据均为虚构。未连接真实大模型、内部知识库或链上服务。首页 AI 输入进入 AI 占位页，不发起分析请求；资金相关入口进入监测页。

监测页 `/monitor` 承载链上存款趋势、平台卡片、纯净度与异动提示，支持时间切换、搜索、覆盖公链筛选、排序与演示弹窗。UID 绑定和工单仅本地演示，不提交或持久化。API 模式展示未接入状态，不回退演示数据。

`/compare` 承载体育报价、套利机会、平台赔率排名及必要工具面板。按用户要求不显示“演示”“快照”字样；数据来源面板明确说明本地样本及真实服务尚未接入。提醒仅保存本机设置，不发送外部通知。API 模式不回退样本。首页平台观察及旧资金对比入口转向 `/monitor`；AI、我的、VIP 和代理继续占位。底层数据契约、服务及排名逻辑保留，供后续逐页实现使用。

详见 [接口与后续范围](docs/API.md)、[部署步骤](docs/DEPLOYMENT.md)、[开发路线](docs/ROADMAP.md)。
