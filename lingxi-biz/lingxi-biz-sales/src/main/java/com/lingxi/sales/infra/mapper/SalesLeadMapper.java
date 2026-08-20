package com.lingxi.sales.infra.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.lingxi.sales.domain.SalesLead;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface SalesLeadMapper extends BaseMapper<SalesLead> {
}
