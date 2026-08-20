package com.lingxi.market.infra.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.lingxi.market.domain.MktSearchTrend;
import com.lingxi.market.domain.RegionHeatView;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface MktSearchTrendMapper extends BaseMapper<MktSearchTrend> {

    @Select("""
            <script>
            SELECT region,
                   ROUND(AVG(index_value)) AS heat_value,
                   COUNT(*) AS trend_count
            FROM lingxi_biz.mkt_search_trend
            WHERE tenant_id = #{tenantId}
              AND is_deleted = 0
            <if test="keyword != null and keyword != ''">
              AND keyword = #{keyword}
            </if>
            GROUP BY region
            ORDER BY heat_value DESC
            </script>
            """)
    List<RegionHeatView> aggregateRegionHeat(@Param("tenantId") Long tenantId,
                                              @Param("keyword") String keyword);
}
