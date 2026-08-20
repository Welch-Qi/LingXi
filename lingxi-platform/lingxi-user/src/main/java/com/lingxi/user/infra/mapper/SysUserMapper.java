package com.lingxi.user.infra.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.lingxi.user.domain.SysUser;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface SysUserMapper extends BaseMapper<SysUser> {
}
