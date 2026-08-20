package com.lingxi.mdata.infra.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.lingxi.mdata.domain.DcEmployee;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface DcEmployeeMapper extends BaseMapper<DcEmployee> {
}
