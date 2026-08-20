package com.lingxi.tenant.infra.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.lingxi.tenant.domain.SysTenant;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface SysTenantMapper extends BaseMapper<SysTenant> {
}
