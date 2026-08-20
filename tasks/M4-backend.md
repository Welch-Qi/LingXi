# M4-backend — 市场域后端（搜索指数/热词/机会扫描）

## 目标
对齐 contracts.md M4.2 契约，补齐缺失端点 + 测试覆盖。

## 仓库信息
- 仓库: https://github.com/Welch-Qi/LingXi
- 分支: cursor/feat-m4-backend
- 基线: main

## 契约要求（contracts.md M4.2）

| 资源 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 搜索趋势 | GET | /api/v1/market/search-trends | 按品类/地区查询搜索热度趋势 |
| 地域热度 | GET | /api/v1/market/region-heat | 按国家/地区展示搜索热度分布 |
| 热搜词排行 | GET | /api/v1/market/hot-keywords | 按行业/品类/地区展示热门关键词 |
| 上升词 | GET | /api/v1/market/rising-keywords | 识别搜索热度上升最快的新兴关键词 |
| 机会扫描 | GET | /api/v1/market/opportunities | AI 综合推荐高潜力目标产品/市场组合 |

## 现有代码分析

已有代码在 `lingxi-biz/lingxi-biz-market` 模块（包 `com.lingxi.market`）：
- `MarketController.java`：已有 3 个端点
  - GET `/api/v1/market/trends?keyword=&region=` — 搜索趋势（路径与契约不符，契约是 search-trends）
  - GET `/api/v1/market/keywords` — 返回 `{hot, rising}` 合并数据（契约要求拆成两个独立端点）
  - GET `/api/v1/market/opportunities` — 已对齐契约 ✓
- Entity 已就位：`MktSearchTrend.java`（keyword/region/metricDate/indexValue）、`MktHotKeyword.java`（keyword/category/region/heatScore/trend）、`MktOpportunity.java`（bizCode/title/productHint/targetMarket/score/summary/status）
- 3 个 Mapper 已就位（BaseMapper 空接口）
- 表已由 Flyway 脚本 `V202608171920__market_insight.sql` 创建，种子数据在 `R__novatech_demo_seed.sql`
- 无 Service 层、无测试

## 任务清单

### T1: 补齐契约端点 search-trends / hot-keywords / rising-keywords
在 `MarketController.java` 新增 3 个契约端点（**保留** 现有 `/trends` 和 `/keywords` 端点不动，前端兼容）：
- GET `/api/v1/market/search-trends`：参数 keyword（可选）、region（可选）、pageNo/pageSize，查询 MktSearchTrend 按 metricDate 降序分页
- GET `/api/v1/market/hot-keywords`：参数 category（可选）、region（可选）、pageNo/pageSize，查询 MktHotKeyword 按 heatScore 降序分页
- GET `/api/v1/market/rising-keywords`：参数 category（可选）、region（可选）、pageNo/pageSize，查询 MktHotKeyword 中 trend 为上升（如 trend=RISING 或含"上升"语义的记录，以实际种子数据为准）按 heatScore 降序分页
- 权限码统一使用现有 `mkt:trend:view`

### T2: 补齐地域热度端点 region-heat
新增 GET `/api/v1/market/region-heat`：参数 keyword（可选）、pageNo/pageSize。基于 MktSearchTrend 按 region 聚合（SQL GROUP BY region，AVG/SUM index_value），返回每地区的热度汇总。实现方式：
- 在 `MktSearchTrendMapper` 增加 `@Select` 注解方法（GROUP BY region）或使用 QueryWrapper 的 groupBy + selectAliases
- 返回结构：`{region, heatValue, trendCount}` 列表
- 权限码 `mkt:trend:view`

### T3: 机会扫描领域事件（TODO 标记）
契约 M4.4 要求发布 `lx.mkt.opportunity.discovered` 事件。当前无事件基础设施（无 MQ/事件总线），在 `MarketController` 的 opportunities 查询处或单独 TODO 注释中标记：
```java
// TODO: 待事件总线基础设施就绪后发布 lx.mkt.opportunity.discovered 事件
```
不强制实现实际发布逻辑。

### T4: 单元测试
为 MarketController 编写单元测试 `MarketControllerTest.java`（放在 `lingxi-biz-market/src/test/java/com/lingxi/market/app/`）：
- 参考 `lingxi-mdata` 的 `MdataControllerTest.java` 测试风格（@WebMvcTest 或 @SpringBootTest + MockBean Mapper）
- 测试用例（至少 8 个）：
  1. 查询 search-trends 返回分页数据
  2. search-trends 按 keyword 过滤
  3. 查询 hot-keywords 返回按 heatScore 降序
  4. 查询 rising-keywords 只返回上升词
  5. 查询 region-heat 返回聚合结果
  6. 查询 opportunities 按 score 降序
  7. 无权限时返回 403（如测试风格支持）
  8. 分页参数默认值处理

### T5: 编译验证 + result.json
- 运行 `./mvnw compile -pl lingxi-biz/lingxi-biz-market -am` 确保编译通过
- 运行 `./mvnw test -pl lingxi-biz/lingxi-biz-market` 确保测试通过
- 将结果写入 `artifacts/M4-backend/result.json`，格式：
```json
{
  "taskId": "M4-backend",
  "status": "COMPLETED",
  "summary": "补齐search-trends/hot-keywords/rising-keywords/region-heat端点+8个单元测试",
  "testCount": 8,
  "testPassed": 8,
  "testFailed": 0,
  "files": ["list all changed/created files"],
  "notes": "任何需要说明的事项"
}
```

## 技术参考
- 契约文件：contracts.md M4 章节
- 基类：lingxi-starter-mybatis 的 BaseEntity
- 统一响应：lingxi-starter-core 的 Result
- 权限注解：@RequirePermission（lingxi-starter-security）
- 租户上下文：TenantContext.getTenantId() / UserContext.require().getTenantId()
- 分页：MyBatis-Plus 的 Page / IPage

## 注意事项
- 不要修改已有 Entity 的 @TableName schema 和字段定义
- 保留现有 `/trends` 和 `/keywords` 端点（前端兼容），新增契约端点
- 种子数据在 `R__novatech_demo_seed.sql`，测试用 MockBean Mapper 不依赖真实数据库
- rising-keywords 的过滤条件以种子数据中 trend 字段实际值为准（先查看 R__novatech_demo_seed.sql 中 mkt_hot_keyword 的数据）
