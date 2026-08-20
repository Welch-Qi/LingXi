package com.lingxi.market.domain;

public class RegionHeatView {

    private String region;
    private Integer heatValue;
    private Long trendCount;

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public Integer getHeatValue() {
        return heatValue;
    }

    public void setHeatValue(Integer heatValue) {
        this.heatValue = heatValue;
    }

    public Long getTrendCount() {
        return trendCount;
    }

    public void setTrendCount(Long trendCount) {
        this.trendCount = trendCount;
    }
}
