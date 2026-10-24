# Aegis

冰川蓝液态玻璃风格的 Vue 移动数据工具。H5 与 Telegram Mini App 共用前端，当前保留首页演示，并在「监测」页展示平台产品调研；「对比」展示体育报价、套利试算与排名；「AI」已提供对话界面与结构化推荐样例，「我的」等其余页面继续文案占位。

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
src/pages      首页、监测产品调研、体育对比、AI 对话、通用占位页与 404
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

演示赛事、平台和资金数据均为虚构。未连接真实大模型、内部知识库或链上服务。首页 AI 输入将问题带入 `/ai` 输入框，由用户发送；资金相关入口进入监测页。

监测页 `/monitor` 承载链上存款趋势、平台卡片、纯净度与异动提示，支持时间切换、搜索、覆盖公链筛选、排序与演示弹窗。UID 绑定和工单仅本地演示，不提交或持久化。API 模式展示未接入状态，不回退演示数据。

`/compare` 承载体育报价、套利机会、平台赔率排名及必要工具面板。按用户要求不显示“演示”“快照”字样；数据来源面板明确说明本地样本及真实服务尚未接入。提醒仅保存本机设置，不发送外部通知。API 模式不回退样本。首页平台观察及旧资金对比入口转向 `/monitor`；个人中心与 VIP／代理服务见下方说明。底层数据契约、服务及排名逻辑保留，供后续逐页实现使用。

AI 页 `/ai` 按效果图实现欢迎、赛事与出金样例卡片、来源详情抽屉、追问、停止重试和内存会话历史。仅 `demo` 模式返回预设卡片，未知赛事与缺失金额档会要求确认；API 模式明确提示未接入，不回退样例。语音服务未接入，补充背景仅支持文字，不读取剪贴板或上传文件。

个人中心 `/me` 按确认设计提供收益记录、UID 与资格分离的绑定状态、私密工单草稿、消息、关注与 AI 记录，并新增意见反馈和关于我们。按要求移除福利码、公开活动、评价公开、减少透明度与注销入口。真实身份／结算／工单／反馈服务未接入，API 模式不回退样例；不保管资金，不提供充值或提现。保留 `/me?section=vip` 和 `/me?section=agents` 的已有服务页。

详见 [个人中心与服务边界](docs/PROFILE-CENTER.md)、[AI 对话界面与边界](docs/AI-CONVERSATION.md)、[开发路线](docs/ROADMAP.md)、[提交规范](docs/PUSHING.md)。
