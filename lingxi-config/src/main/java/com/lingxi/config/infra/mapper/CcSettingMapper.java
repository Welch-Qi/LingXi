package com.lingxi.config.infra.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.lingxi.config.domain.CcSetting;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface CcSettingMapper extends BaseMapper<CcSetting> {
}
