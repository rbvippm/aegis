# Aegis Vue 开源项目选型与结构

查阅日期：2026-10-22。以下是基于 Aegis 定制界面、H5/TG 共用、AI 对话与数据排名需求的工程判断；不是对所有 GitHub Vue 项目的全量评测。没有通过 star 数替代适配度，也未安装运行这些模板。

## 结论

**长期开发首选：Vue 官方 create-vue 初始化，再采用 feature 分区 + platform adapter。** 它是初始化器，不是现成 Aegis 应用。该选择减少主题和模板约定的束缚，便于精细实现液态玻璃。

**想尽快拿到较完整移动端模板：vue-zone/vue3-vant-mobile。** 它更接近移动业务项目的现成底座，但需要清理示例与不需要的插件。

没有一个已核实模板同时开箱提供 Aegis 风格、双端宿主适配、内部知识库、赛事分析和这两类可信排名。

## 候选比较

| 项目                                                                                      | 已核实定位/能力                                                           | Aegis 适配判断                               | 注意点                                                                                                       |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [vuejs/create-vue](https://github.com/vuejs/create-vue)                                   | Vue 推荐的 Vite 项目初始化器                                              | **默认首选**：自定义设计系统和显式架构较自由 | TG、AI、玻璃组件均需补齐，不是成熟业务模板                                                                   |
| [vue-zone/vue3-vant-mobile](https://github.com/vue-zone/vue3-vant-mobile)                 | Vue/TS 移动模板，含 Vant、Pinia、UnoCSS、i18n、mock 等                    | **移动现成模板首选**：适合快速搭业务         | 清理示例、PWA/调试插件按需求保留；不要把默认 Vant 外观当最终设计                                             |
| [antfu-collective/vitesse-lite](https://github.com/antfu-collective/vitesse-lite)         | 轻量 Vue/TS 模板，UnoCSS、文件路由、自动导入、Vitest                      | 适合熟悉该约定的团队                         | README 明确 lite 未预装 i18n/PWA 等；仍需 TG adapter                                                         |
| [Telegram-Mini-Apps/vuejs-template](https://github.com/Telegram-Mini-Apps/vuejs-template) | 社区维护的 Vue/TS/Vite Mini App 示例，含 TON Connect、SDK 接入和开发 mock | 作为 TG 接入参考                             | 不称为 Telegram 官方模板；本次页面未展示明确许可证文件，复用前核对。不要直接带入生产 mock 或无需求的钱包连接 |

以上结构与功能依据各仓库 README；是源码/文档审阅，未做性能、安全或运行完整性背书。

## 许可证和依赖核对

- [create-vue LICENSE](https://github.com/vuejs/create-vue/blob/main/LICENSE)：生成器核心 MIT，生成模板文件另有 CC0 声明；依赖仍有各自许可。
- [vue3-vant-mobile LICENSE](https://github.com/vue-zone/vue3-vant-mobile/blob/main/LICENSE)：MIT。复用源代码时保留相应版权与许可声明。
- Vitesse-lite 本次未成功读取独立许可证文件，不在此断言其许可证；正式复用前读取所选 commit 的许可。
- Telegram 社区模板同样需要核对所选 commit 的 LICENSE/授权，不能因仓库公开就假定任意复用。
- 当前 vue3-vant-mobile 的 README 与 [package.json](https://github.com/vue-zone/vue3-vant-mobile/blob/main/package.json) 在 Node 要求、build 脚本上不完全一致。以所选 commit 的 engines、scripts、锁文件和实际验证为准，不复制 README 中旧命令后假定成功。
- 文档查看不等于锁定版本。真正启动时记录所选 commit、依赖 lockfile、Node 和包管理器版本。

## 推荐技术组合

| 层        | 建议                                                                           |
| --------- | ------------------------------------------------------------------------------ |
| 前端      | Vue 3 Composition API、script setup、TypeScript、Vite                          |
| 路由/状态 | Vue Router；Pinia 存用户偏好和必要跨页会话                                     |
| 样式      | CSS variables + scoped CSS；已有 UnoCSS 的项目沿用，避免再加另一套原子 CSS     |
| 交互基础  | Vant 按需使用，核心玻璃壳和 AI 组件定制                                        |
| TG        | platform adapter；可选社区 @tma.js/sdk + @tma.js/sdk-vue，按当前维护方文档接入 |
| 数据      | 统一 API client + 运行时 schema；必要时加查询缓存库                            |
| AI        | 后端模型网关、检索和工具查询；前端结构化结果 + 可取消流式会话                  |
| 验证      | 项目类型检查/构建；Vitest 与 Playwright 按关键用例配置                         |

组件库参考：[Vant 仓库](https://github.com/youzan/vant)。SDK 当前 Vue 绑定参考：[维护方文档](https://docs.telegram-mini-apps.com/packages/tma-js-sdk-vue)。这两项是独立依赖，不能理解为 create-vue 已经内置。

## 推荐目录

```text
aegis-web/
  .agents/skills/aegis-vue-liquid-glass/  # 两个编码工具可共用
  src/
    app/                   # 入口、router、布局、providers
    pages/                 # 首页、监测、AI、对比、我的
    features/
      ai/                  # 对话、分析卡片、来源引用
      monitoring/          # 出金监控与平台观察
      odds/                # 同盘口报价与对比
      funding/             # 已知出入金排名
    shared/
      ui/                  # 玻璃基础组件、悬浮导航
      api/                 # HTTP、流、响应校验、错误
      contracts/           # DTO 与排名口径
      styles/              # tokens 与全局样式
      lib/                 # 纯函数
    platform/
      index.ts
      web.ts
      telegram.ts
    mocks/
    locales/
  tests/
    unit/
    e2e/
  docs/                    # 产品范围、接口、设计决策
  .env.example             # 仅变量名与公开配置示例
  package.json
  <一个包管理器对应的锁文件>
```

这是本次为 Aegis 推荐的 feature 分区，不是声称某仓库原本采用该目录。第一阶段只建实际使用的部分。后端仓库另行选型；团队需要统一工作区后再提取共享 contracts/UI，不先建立空的多包工程。

## H5/TG 共同发布

先用一个应用共用路由与业务，可在同一域名按宿主选择 adapter。TG 原生标题、返回和视口通过宿主能力处理，普通 H5 有独立降级。

使用 HTML5 History 路由并配置服务端深链回退，保留 TG 的启动 hash。[SDK 维护方路由说明](https://docs.telegram-mini-apps.com/packages/tma-js-sdk-vue#vue-router-integration)。静态 GitHub Pages 的路径限制需要专门处理；正式部署建议选支持回退与 API 代理的托管方式。

TG 身份数据应由后端验证后使用；相关 safe area、viewport 和校验规则以 [Telegram 官方规范](https://core.telegram.org/bots/webapps) 为准。H5 上不模拟已登录 TG 用户。

若后续公开内容页需要 SEO/服务端渲染，再评估独立 Nuxt 内容站；当前互动工具和 TG Mini App 不因尚未确认的 SEO 需求引入额外框架。

## 建议开发次序

1. 初始化、安装技能、导入设计 token，完成 H5/TG 外壳和五项导航。
2. 用明确标注的演示数据完成首页 → AI 对话 → 分析与双排名。
3. 对齐后端契约，接入赛事、赔率、链上聚合及知识库来源。
4. 完成身份验证、流式中断/重试、数据过期与样本不足处理。
5. 两端键盘、安全区、长内容与性能验证，再扩展 VIP、代理和 B 端能力。

## 主要来源

- [Vue 官方初始化器与使用方法](https://github.com/vuejs/create-vue)
- [移动模板功能](https://github.com/vue-zone/vue3-vant-mobile)
- [Vitesse-lite 功能边界](https://github.com/antfu-collective/vitesse-lite)
- [Telegram 社区 Vue 模板及 mock 说明](https://github.com/Telegram-Mini-Apps/vuejs-template)
- [Telegram 官方 Mini Apps](https://core.telegram.org/bots/webapps)
- [Codex 技能](https://learn.chatgpt.com/docs/customization/overview)
- [Cursor 技能](https://cursor.com/docs/skills)
