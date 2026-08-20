package com.lingxi.mdata.app;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lingxi.id.api.IdGenerator;
import com.lingxi.mdata.domain.DcChannel;
import com.lingxi.mdata.domain.DcCustomer;
import com.lingxi.mdata.domain.DcEmployee;
import com.lingxi.mdata.domain.DcProduct;
import com.lingxi.mdata.infra.mapper.DcChannelMapper;
import com.lingxi.mdata.infra.mapper.DcCustomerMapper;
import com.lingxi.mdata.infra.mapper.DcEmployeeMapper;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
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
    private final DcEmployeeMapper employeeMapper;
    private final IdGenerator idGenerator;

    public MdataController(
            DcCustomerMapper customerMapper,
            DcProductMapper productMapper,
            DcChannelMapper channelMapper,
            DcEmployeeMapper employeeMapper,
            IdGenerator idGenerator) {
        this.customerMapper = customerMapper;
        this.productMapper = productMapper;
        this.channelMapper = channelMapper;
        this.employeeMapper = employeeMapper;
        this.idGenerator = idGenerator;
    }

    @GetMapping("/customers")
    @RequirePermission("dc:customer:manage")
    public Result<Map<String, Object>> customers(
            @RequestParam(defaultValue = "1") long pageNo,
            @RequestParam(defaultValue = "20") long pageSize,
            @RequestParam(required = false) String keyword) {
        Long tenantId = resolveTenantId();
        LambdaQueryWrapper<DcCustomer> wrapper = new LambdaQueryWrapper<DcCustomer>()
                .eq(DcCustomer::getTenantId, tenantId)
                .orderByDesc(DcCustomer::getId);
        applyNameOrBizCodeKeyword(wrapper, keyword, DcCustomer::getName, DcCustomer::getBizCode);
        Page<DcCustomer> page = customerMapper.selectPage(new Page<>(pageNo, pageSize), wrapper);
        return Result.ok(pageResult(page));
    }

    @GetMapping("/customers/{id}")
    @RequirePermission("dc:customer:manage")
    public Result<DcCustomer> customer(@PathVariable Long id) {
        return Result.ok(requireCustomer(resolveTenantId(), id));
    }

    @PostMapping("/customers")
    @RequirePermission("dc:customer:manage")
    public Result<DcCustomer> createCustomer(
            @RequestBody DcCustomer body,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey) {
        // TODO: implement idempotent create when X-Idempotency-Key is present
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
        applyCustomerUpdates(existing, body);
        customerMapper.updateById(existing);
        return Result.ok(existing);
    }

    @PatchMapping("/customers/{id}")
    @RequirePermission("dc:customer:manage")
    public Result<DcCustomer> patchCustomer(@PathVariable Long id, @RequestBody DcCustomer body) {
        Long tenantId = resolveTenantId();
        DcCustomer existing = requireCustomer(tenantId, id);
        applyCustomerUpdates(existing, body);
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
            @RequestParam(defaultValue = "20") long pageSize,
            @RequestParam(required = false) String keyword) {
        Long tenantId = resolveTenantId();
        LambdaQueryWrapper<DcProduct> wrapper = new LambdaQueryWrapper<DcProduct>()
                .eq(DcProduct::getTenantId, tenantId)
                .orderByDesc(DcProduct::getId);
        applyNameOrBizCodeKeyword(wrapper, keyword, DcProduct::getSku, DcProduct::getBizCode);
        Page<DcProduct> page = productMapper.selectPage(new Page<>(pageNo, pageSize), wrapper);
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
            @RequestParam(defaultValue = "20") long pageSize,
            @RequestParam(required = false) String keyword) {
        Long tenantId = resolveTenantId();
        LambdaQueryWrapper<DcChannel> wrapper = new LambdaQueryWrapper<DcChannel>()
                .eq(DcChannel::getTenantId, tenantId)
                .orderByDesc(DcChannel::getId);
        applyNameOrBizCodeKeyword(wrapper, keyword, DcChannel::getName, DcChannel::getBizCode);
        Page<DcChannel> page = channelMapper.selectPage(new Page<>(pageNo, pageSize), wrapper);
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

    @GetMapping("/employees")
    @RequirePermission("dc:customer:manage")
    public Result<Map<String, Object>> employees(
            @RequestParam(defaultValue = "1") long pageNo,
            @RequestParam(defaultValue = "20") long pageSize,
            @RequestParam(required = false) String keyword) {
        Long tenantId = resolveTenantId();
        LambdaQueryWrapper<DcEmployee> wrapper = new LambdaQueryWrapper<DcEmployee>()
                .eq(DcEmployee::getTenantId, tenantId)
                .orderByDesc(DcEmployee::getId);
        applyNameOrBizCodeKeyword(wrapper, keyword, DcEmployee::getName, DcEmployee::getBizCode);
        Page<DcEmployee> page = employeeMapper.selectPage(new Page<>(pageNo, pageSize), wrapper);
        return Result.ok(pageResult(page));
    }

    @GetMapping("/employees/{id}")
    @RequirePermission("dc:customer:manage")
    public Result<DcEmployee> employee(@PathVariable Long id) {
        return Result.ok(requireEmployee(resolveTenantId(), id));
    }

    @PostMapping("/employees")
    @RequirePermission("dc:customer:manage")
    public Result<DcEmployee> createEmployee(@RequestBody DcEmployee body) {
        Long tenantId = resolveTenantId();
        if (!StringUtils.hasText(body.getName())) {
            return Result.fail("BAD_REQUEST", "name is required");
        }
        body.setId(idGenerator.nextId());
        body.setTenantId(tenantId);
        if (!StringUtils.hasText(body.getBizCode())) {
            body.setBizCode(idGenerator.nextBizCode("EMP"));
        }
        if (!StringUtils.hasText(body.getStatus())) {
            body.setStatus("ACTIVE");
        }
        employeeMapper.insert(body);
        return Result.ok(body);
    }

    @PutMapping("/employees/{id}")
    @RequirePermission("dc:customer:manage")
    public Result<DcEmployee> updateEmployee(@PathVariable Long id, @RequestBody DcEmployee body) {
        Long tenantId = resolveTenantId();
        DcEmployee existing = requireEmployee(tenantId, id);
        if (StringUtils.hasText(body.getName())) {
            existing.setName(body.getName());
        }
        if (body.getDepartment() != null) {
            existing.setDepartment(body.getDepartment());
        }
        if (body.getPosition() != null) {
            existing.setPosition(body.getPosition());
        }
        if (body.getPhone() != null) {
            existing.setPhone(body.getPhone());
        }
        if (body.getEmail() != null) {
            existing.setEmail(body.getEmail());
        }
        if (body.getStatus() != null) {
            existing.setStatus(body.getStatus());
        }
        employeeMapper.updateById(existing);
        return Result.ok(existing);
    }

    private void applyCustomerUpdates(DcCustomer existing, DcCustomer body) {
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
    }

    private <T> void applyNameOrBizCodeKeyword(
            LambdaQueryWrapper<T> wrapper,
            String keyword,
            com.baomidou.mybatisplus.core.toolkit.support.SFunction<T, ?> nameField,
            com.baomidou.mybatisplus.core.toolkit.support.SFunction<T, ?> bizCodeField) {
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like(nameField, keyword).or().like(bizCodeField, keyword));
        }
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

    private DcEmployee requireEmployee(Long tenantId, Long id) {
        DcEmployee row = employeeMapper.selectOne(new LambdaQueryWrapper<DcEmployee>()
                .eq(DcEmployee::getId, id).eq(DcEmployee::getTenantId, tenantId));
        if (row == null) {
            throw new BizException(ErrorCode.NOT_FOUND, "employee not found");
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
