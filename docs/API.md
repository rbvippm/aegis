# 后端接口与边界

当前显式演示前端：模拟进度后返回结构化结果，不调用大模型/知识库，也不是 token 流。继续提问为独立请求，尚无模型历史上下文。

## 分析契约草案

`VITE_DATA_MODE=api` 时，`POST {VITE_API_BASE_URL}/ai/analyses`，JSON `{ message, requestId, timezone }`。同源 fetch 携带同源凭据，但尚未实现真实登录会话。

响应必须满足 `src/shared/contracts/analysis.ts` 中 AnalysisSchema、返回相同 requestId、demo=false。HTTP/schema/关联错误明确展示，不回退演示。支持 AbortController 停止与重试。

后端应确定性查询和计算排名，校验来源权限与引用，再交给模型解释。未来扩展 conversationId、消息历史、token 流、鉴权和限流。

## 排名

赔率同 fixtureId/market/selection/line/period/phase/settlementRuleId 比较，十进制降序、同值并列。资金 rows 共用 cohort（链/资产/金额/窗口/测量方法），按出金中位耗时升序；缺失/过期/样本不足不排名。入金与出金样本独立统计。

demo 为固定虚构快照，fresh/stale 为演示场景状态，不代表现实实时性。真实模式应由后端按实际时效和可用地区标记。

首页、监测与独立对比接口尚未实现；API 模式不展示演示数据。这些模块需按真实服务新增各自契约和 adapter。

## TG

platform 使用官方 JS bridge，按启动参数加载；桥接连接不代表登录，不信任 initDataUnsafe，不模拟身份。真实后端需完成 initData 验签、时效与会话后再接私有数据。TG 实机尚未验证。
