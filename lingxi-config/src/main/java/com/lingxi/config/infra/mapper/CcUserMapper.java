package com.lingxi.config.infra.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.lingxi.config.domain.CcUser;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface CcUserMapper extends BaseMapper<CcUser> {
}
