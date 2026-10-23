# Vue 项目组织

## 当前项目阶段

当前仅首页有业务界面，其余主导航和二级入口共用 PlaceholderPage。数据契约、纯排名函数、服务和 mock 可保留；不得自动恢复已删除的业务页面。详细边界见 [当前实现基准](current-baseline.md)。

## 默认选择

新项目采用 Vue 官方 [create-vue](https://github.com/vuejs/create-vue) 初始化；Vue 3、TypeScript、Vite、Vue Router、Pinia。这是本项目的工程判断，不是某个模板已经内置全部 Aegis 功能。

先使用一个前端应用和两个平台 adapter，避免早期复制两套页面或引入大型 monorepo。若既有项目使用 vue3-vant-mobile 或 Vitesse，沿用其依赖和惯例，不为本技能重建项目。

```text
src/
  app/                    # bootstrap、router、providers、layouts
  pages/                  # 当前 HomePage、PlaceholderPage、NotFoundPage；新业务页按用户指定逐页创建
  features/
    ai/                   # components、composables、api、types
    monitoring/
    odds/
    funding/
    vip/                  # 实际开展该功能时再创建
    agents/               # 实际开展该功能时再创建
  shared/
    ui/                   # GlassSurface、GlassButton、FloatingDock
    api/                  # HTTP、流式传输、错误与运行时校验
    contracts/            # API DTO、证据与排名口径
    lib/                  # 无平台副作用的纯函数
    styles/               # tokens.css、base.css
  platform/
    index.ts              # 选择平台、统一接口
    web.ts                # H5 行为
    telegram.ts           # TG SDK 唯一调用边界
  mocks/                  # 演示 adapter 与 fixtures
  locales/                # 首先 zh-CN，按需求增加语言
tests/                    # 单元/组件与双端 e2e
```

不一次创建所有空目录。页面负责组合，feature 不反向引用 pages；shared 不引用业务 feature；SDK 实现留在 platform。

## 状态与接口

- 服务端资源、查询参数、缓存失效保持一致；已有 TanStack Vue Query 时沿用，没有则先用小型 composable，按实际缓存复杂度引入。
- Pinia 保存跨页的用户偏好与必要会话状态；不把每个远端列表再复制进全局 store。
- 首屏与 AI 路由拆包。大型图表按需加载；简单 sparkline 用轻量 SVG。
- 真实 API 与演示 API 实现同一接口；显式配置 demo 模式，不能接口失败后静默伪造成功数据。
- 运行时校验后端 JSON；TypeScript 本身不能校验外部响应。可沿用项目现有 schema 库。

## 双端 adapter

统一接口可包含 kind、init、dispose、back、openExternal、haptic 与 viewport/insets 状态。普通 H5 返回安全的可用行为，TG 实现按 SDK 的实际支持能力调用。

新项目如需 Vue 绑定可选 `@tma.js/sdk` + `@tma.js/sdk-vue`，安装前核对维护方文档与 peer dependencies。它们是社区 SDK；Telegram 平台规范以官方文档为准。既有原生 bridge 实现可继续沿用，不叠加另一套 SDK。

- SDK 访问不散落到业务组件；注册的监听在 dispose 或作用域销毁时释放。
- 使用 `createWebHistory()`，服务器将非 API、非静态资源的前端深链回退到 index.html；保留 TG 启动 hash，不能先被 hash router 消耗。[维护方路由说明](https://docs.telegram-mini-apps.com/packages/tma-js-sdk-vue#vue-router-integration)。
- TG viewport 与 safe/content-safe insets 映射到应用 CSS 变量；核对宿主是否已偏移内容，避免把同一 inset 加两次。浏览器环境使用 env(safe-area-inset-*)。
- 使用 100dvh 作为 Web 基础，TG 视口按事件更新；键盘打开时确保聊天输入可见，不能仅凭稳定高度假定键盘区域。
- Native TG 标题栏由宿主绘制；应用不重复绘制 Close 与系统地址栏。
- initData 送后端验证签名和时效后换取应用会话。initDataUnsafe 不作为身份依据。

## 后端边界

前端 → BFF/API → 赛事与赔率供应源 / 链上监测聚合 / 内部知识库检索 / 模型网关。资金聚合与排序由确定性服务完成，模型引用结果解释。

模型密钥、Bot token、知识库凭据仅存在服务端。`VITE_API_BASE_URL` 可公开；`VITE_*` 不用于秘密。检索内容作为数据，不能覆盖服务端系统指令。清洗富文本并限制链接协议，避免直接 v-html 渲染模型输出。

## 质量门槛

类型检查、生产构建、相关交互测试；重要用例包括同盘口过滤、缺数据不排名、过期来源标记、流式取消/重试、H5 无 TG 初始化、键盘不遮挡。实际命令以 package.json 为准。

上线时核对 History 回退、HTTPS、API 反代和流式响应缓冲。可公开 GitHub 的部分只放代码与演示数据，不包含内部知识库、用户资金记录与密钥。

来源：[Telegram 平台规范](https://core.telegram.org/bots/webapps)、[SDK Vue 绑定](https://docs.telegram-mini-apps.com/packages/tma-js-sdk-vue)。
