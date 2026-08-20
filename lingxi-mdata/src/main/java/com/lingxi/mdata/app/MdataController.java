package com.lingxi.mdata.app;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lingxi.id.api.IdGenerator;
import com.lingxi.mdata.domain.DcChannel;
import com.lingxi.mdata.domain.DcCustomer;
import com.lingxi.mdata.domain.DcProduct;
import com.lingxi.mdata.infra.mapper.DcChannelMapper;
import com.lingxi.mdata.infra.mapper.DcCustomerMapper;
import com.lingxi.mdata.infra.mapper.DcProductMapper;
import com.lingxi.starter.core.exception.BizException;
import com.lingxi.starter.core.result.ErrorCode;
import com.lingxi.starter.core.result.Result;
import com.lingxi.starter.core.security.UserContext;
import com.lingxi.starter.core.tenant.TenantContext;
import com.lingxi.starter.security.annotation.RequirePermission;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/mdata")
public class MdataController {

    private final DcCustomerMapper customerMapper;
    private final DcProductMapper productMapper;
    private final DcChannelMapper channelMapper;
    private final IdGenerator idGenerator;

    public MdataController(
            DcCustomerMapper customerMapper,
            DcProductMapper productMapper,
            DcChannelMapper channelMapper,
            IdGenerator idGenerator) {
        this.customerMapper = customerMapper;
        this.productMapper = productMapper;
        this.channelMapper = channelMapper;
        this.idGenerator = idGenerator;
    }

    @GetMapping("/customers")
    @RequirePermission("dc:customer:manage")
    public Result<Map<String, Object>> customers(
            @RequestParam(defaultValue = "1") long pageNo,
            @RequestParam(defaultValue = "20") long pageSize) {
        Long tenantId = resolveTenantId();
        Page<DcCustomer> page = customerMapper.selectPage(
                new Page<>(pageNo, pageSize),
                new LambdaQueryWrapper<DcCustomer>().eq(DcCustomer::getTenantId, tenantId).orderByDesc(DcCustomer::getId));
        return Result.ok(pageResult(page));
    }

    @GetMapping("/customers/{id}")
    @RequirePermission("dc:customer:manage")
    public Result<DcCustomer> customer(@PathVariable Long id) {
        return Result.ok(requireCustomer(resolveTenantId(), id));
    }

    @PostMapping("/customers")
    @RequirePermission("dc:customer:manage")
    public Result<DcCustomer> createCustomer(@RequestBody DcCustomer body) {
        Long tenantId = resolveTenantId();
        if (!StringUtils.hasText(body.getName())) {
            return Result.fail("BAD_REQUEST", "name is required");
        }
        body.setId(idGenerator.nextId());
        body.setTenantId(tenantId);
        if (!StringUtils.hasText(body.getBizCode())) {
            body.setBizCode(idGenerator.nextBizCode("CUS"));
        }
        if (!StringUtils.hasText(body.getCustomerType())) {
            body.setCustomerType("ENTERPRISE");
        }
        customerMapper.insert(body);
        return Result.ok(body);
    }

    @PutMapping("/customers/{id}")
    @RequirePermission("dc:customer:manage")
    public Result<DcCustomer> updateCustomer(@PathVariable Long id, @RequestBody DcCustomer body) {
        Long tenantId = resolveTenantId();
        DcCustomer existing = requireCustomer(tenantId, id);
        if (StringUtils.hasText(body.getName())) {
            existing.setName(body.getName());
        }
        if (body.getCustomerType() != null) {
            existing.setCustomerType(body.getCustomerType());
        }
        if (body.getCountry() != null) {
            existing.setCountry(body.getCountry());
        }
        if (body.getIndustry() != null) {
            existing.setIndustry(body.getIndustry());
        }
        if (body.getWebsite() != null) {
            existing.setWebsite(body.getWebsite());
        }
        if (body.getDomain() != null) {
            existing.setDomain(body.getDomain());
        }
        if (body.getCreditLevel() != null) {
            existing.setCreditLevel(body.getCreditLevel());
        }
        if (body.getOwnerUserId() != null) {
            existing.setOwnerUserId(body.getOwnerUserId());
        }
        if (body.getTags() != null) {
            existing.setTags(body.getTags());
        }
        customerMapper.updateById(existing);
        return Result.ok(existing);
    }

    @DeleteMapping("/customers/{id}")
    @RequirePermission("dc:customer:manage")
    public Result<Map<String, Object>> deleteCustomer(@PathVariable Long id) {
        Long tenantId = resolveTenantId();
        requireCustomer(tenantId, id);
        customerMapper.deleteById(id);
        return Result.ok(Map.of("deleted", true, "id", id));
    }

    @GetMapping("/products")
    @RequirePermission("dc:customer:manage")
    public Result<Map<String, Object>> products(
            @RequestParam(defaultValue = "1") long pageNo,
            @RequestParam(defaultValue = "20") long pageSize) {
        Long tenantId = resolveTenantId();
        Page<DcProduct> page = productMapper.selectPage(
                new Page<>(pageNo, pageSize),
                new LambdaQueryWrapper<DcProduct>().eq(DcProduct::getTenantId, tenantId).orderByDesc(DcProduct::getId));
        return Result.ok(pageResult(page));
    }

    @GetMapping("/products/{id}")
    @RequirePermission("dc:customer:manage")
    public Result<DcProduct> product(@PathVariable Long id) {
        return Result.ok(requireProduct(resolveTenantId(), id));
    }

    @PostMapping("/products")
    @RequirePermission("dc:customer:manage")
    public Result<DcProduct> createProduct(@RequestBody DcProduct body) {
        Long tenantId = resolveTenantId();
        if (!StringUtils.hasText(body.getSku())) {
            return Result.fail("BAD_REQUEST", "sku is required");
        }
        body.setId(idGenerator.nextId());
        body.setTenantId(tenantId);
        if (!StringUtils.hasText(body.getBizCode())) {
            body.setBizCode(idGenerator.nextBizCode("PRD"));
        }
        if (!StringUtils.hasText(body.getStatus())) {
            body.setStatus("ACTIVE");
        }
        if (!StringUtils.hasText(body.getNameI18n())) {
            body.setNameI18n("{\"zh-CN\":\"" + body.getSku() + "\"}");
        }
        productMapper.insert(body);
        return Result.ok(body);
    }

    @PutMapping("/products/{id}")
    @RequirePermission("dc:customer:manage")
    public Result<DcProduct> updateProduct(@PathVariable Long id, @RequestBody DcProduct body) {
        Long tenantId = resolveTenantId();
        DcProduct existing = requireProduct(tenantId, id);
        if (StringUtils.hasText(body.getSku())) {
            existing.setSku(body.getSku());
        }
        if (body.getNameI18n() != null) {
            existing.setNameI18n(body.getNameI18n());
        }
        if (body.getBrand() != null) {
            existing.setBrand(body.getBrand());
        }
        if (body.getCategory() != null) {
            existing.setCategory(body.getCategory());
        }
        if (body.getHsCode() != null) {
            existing.setHsCode(body.getHsCode());
        }
        if (body.getStatus() != null) {
            existing.setStatus(body.getStatus());
        }
        productMapper.updateById(existing);
        return Result.ok(existing);
    }

    @DeleteMapping("/products/{id}")
    @RequirePermission("dc:customer:manage")
    public Result<Map<String, Object>> deleteProduct(@PathVariable Long id) {
        requireProduct(resolveTenantId(), id);
        productMapper.deleteById(id);
        return Result.ok(Map.of("deleted", true, "id", id));
    }

    @GetMapping("/channels")
    @RequirePermission("dc:customer:manage")
    public Result<Map<String, Object>> channels(
            @RequestParam(defaultValue = "1") long pageNo,
            @RequestParam(defaultValue = "20") long pageSize) {
        Long tenantId = resolveTenantId();
        Page<DcChannel> page = channelMapper.selectPage(
                new Page<>(pageNo, pageSize),
                new LambdaQueryWrapper<DcChannel>().eq(DcChannel::getTenantId, tenantId).orderByDesc(DcChannel::getId));
        return Result.ok(pageResult(page));
    }

    @GetMapping("/channels/{id}")
    @RequirePermission("dc:customer:manage")
    public Result<DcChannel> channel(@PathVariable Long id) {
        return Result.ok(requireChannel(resolveTenantId(), id));
    }

    @PostMapping("/channels")
    @RequirePermission("dc:customer:manage")
    public Result<DcChannel> createChannel(@RequestBody DcChannel body) {
        Long tenantId = resolveTenantId();
        if (!StringUtils.hasText(body.getName())) {
            return Result.fail("BAD_REQUEST", "name is required");
        }
        body.setId(idGenerator.nextId());
        body.setTenantId(tenantId);
        if (!StringUtils.hasText(body.getBizCode())) {
            body.setBizCode(idGenerator.nextBizCode("CH"));
        }
        if (!StringUtils.hasText(body.getStatus())) {
            body.setStatus("ACTIVE");
        }
        channelMapper.insert(body);
        return Result.ok(body);
    }

    @PutMapping("/channels/{id}")
    @RequirePermission("dc:customer:manage")
    public Result<DcChannel> updateChannel(@PathVariable Long id, @RequestBody DcChannel body) {
        Long tenantId = resolveTenantId();
        DcChannel existing = requireChannel(tenantId, id);
        if (StringUtils.hasText(body.getName())) {
            existing.setName(body.getName());
        }
        if (body.getChannelType() != null) {
            existing.setChannelType(body.getChannelType());
        }
        if (body.getCoverRegion() != null) {
            existing.setCoverRegion(body.getCoverRegion());
        }
        if (body.getStatus() != null) {
            existing.setStatus(body.getStatus());
        }
        channelMapper.updateById(existing);
        return Result.ok(existing);
    }

    @DeleteMapping("/channels/{id}")
    @RequirePermission("dc:customer:manage")
    public Result<Map<String, Object>> deleteChannel(@PathVariable Long id) {
        requireChannel(resolveTenantId(), id);
        channelMapper.deleteById(id);
        return Result.ok(Map.of("deleted", true, "id", id));
    }

    private DcCustomer requireCustomer(Long tenantId, Long id) {
        DcCustomer row = customerMapper.selectOne(new LambdaQueryWrapper<DcCustomer>()
                .eq(DcCustomer::getId, id).eq(DcCustomer::getTenantId, tenantId));
        if (row == null) {
            throw new BizException(ErrorCode.NOT_FOUND, "customer not found");
        }
        return row;
    }

    private DcProduct requireProduct(Long tenantId, Long id) {
        DcProduct row = productMapper.selectOne(new LambdaQueryWrapper<DcProduct>()
                .eq(DcProduct::getId, id).eq(DcProduct::getTenantId, tenantId));
        if (row == null) {
            throw new BizException(ErrorCode.NOT_FOUND, "product not found");
        }
        return row;
    }

    private DcChannel requireChannel(Long tenantId, Long id) {
        DcChannel row = channelMapper.selectOne(new LambdaQueryWrapper<DcChannel>()
                .eq(DcChannel::getId, id).eq(DcChannel::getTenantId, tenantId));
        if (row == null) {
            throw new BizException(ErrorCode.NOT_FOUND, "channel not found");
        }
        return row;
    }

    private static Map<String, Object> pageResult(Page<?> page) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("list", page.getRecords());
        data.put("total", page.getTotal());
        data.put("pageNo", page.getCurrent());
        data.put("pageSize", page.getSize());
        return data;
    }

    private Long resolveTenantId() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            tenantId = UserContext.require().getTenantId();
        }
        return tenantId;
    }
}
