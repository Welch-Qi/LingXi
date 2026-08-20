package com.lingxi.market.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import com.lingxi.starter.mybatis.domain.BaseEntity;

@TableName(value = "mkt_hot_keyword", schema = "lingxi_biz")
public class MktHotKeyword extends BaseEntity {

    private String keyword;
    private String category;
    private String region;
    private Integer heatScore;
    private String trend;

    public String getKeyword() {
        return keyword;
    }

    public void setKeyword(String keyword) {
        this.keyword = keyword;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public Integer getHeatScore() {
        return heatScore;
    }

    public void setHeatScore(Integer heatScore) {
        this.heatScore = heatScore;
    }

    public String getTrend() {
        return trend;
    }

    public void setTrend(String trend) {
        this.trend = trend;
    }
}
