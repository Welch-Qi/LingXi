# 触点开放 API（P0 骨架）对接说明

配套：《触点独立站集成规约 V1.0》。模块：`lingxi-open-site`。

## 基址

```
http://localhost:8080/api/v1/open/site
```

## 必填请求头

| Header | 说明 |
|--------|------|
| `X-Tenant-Id` | 租户，如 `10086` |
| `X-Site-Id` | 站点，演示默认 `site_demo` |
| `X-Site-Channel` | 渠道，演示默认 `storefront` |
| `X-Site-Client-Secret` | P0 站点密钥，演示默认 `demo-secret`（有 Bearer JWT 时可省略） |
| `X-Idempotency-Key` | **写操作必填**（UUID） |
| `X-Trace-Id` | 可选；不传则服务端生成 |

配置见 `lingxi-server` → `lingxi.open-site.sites`。

## P0 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 联通与站点绑定 |
| GET | `/products?updatedAfter=&pageNo=1&pageSize=20` | 商品增量（内存演示数据） |
| POST | `/leads` | 线索回传 |
| POST | `/orders` | 订单回传（幂等键=`siteId+siteOrderId` 业务层另存） |
| PATCH | `/orders/{siteOrderId}` | 订单状态更新 |
| POST | `/knowledge/search` | 知识检索占位 |

## 联调示例

```bash
curl -s "http://localhost:8080/api/v1/open/site/health" \
  -H "X-Tenant-Id: 10086" \
  -H "X-Site-Id: site_demo" \
  -H "X-Site-Channel: storefront" \
  -H "X-Site-Client-Secret: demo-secret"
```

```bash
curl -s "http://localhost:8080/api/v1/open/site/products?pageNo=1&pageSize=10" \
  -H "X-Tenant-Id: 10086" \
  -H "X-Site-Id: site_demo" \
  -H "X-Site-Channel: storefront" \
  -H "X-Site-Client-Secret: demo-secret"
```

```bash
curl -s -X POST "http://localhost:8080/api/v1/open/site/leads" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: 10086" \
  -H "X-Site-Id: site_demo" \
  -H "X-Site-Channel: storefront" \
  -H "X-Site-Client-Secret: demo-secret" \
  -H "X-Idempotency-Key: $(uuidgen)" \
  -d '{"sourceChannel":"storefront","intent":"inquiry","buyer":{"email":"a@b.com","name":"Alice"},"note":"demo"}'
```

## 错误码（节选）

| code | 含义 |
|------|------|
| `030001` | 站点无效 / 头缺失 / 渠道不匹配 |
| `030002` | 站点与租户不匹配 |
| `030003` | 站点凭证无效 |
| `030005` | 幂等键冲突（同 key 不同 body） |
| `010004` | 参数校验失败 / 缺幂等键 |

## 后续（非 P0）

- 商品/知识对接 `lingxi-mdata` / `lingxi-knowledge`
- 线索/订单写入销售域 + 领域事件
- 生产关闭 `allow-client-secret-auth`，去掉 permit-all，改用 Casdoor M2M JWT
- 幂等表换 Redis；站点注册换 SiteConnector + DB
