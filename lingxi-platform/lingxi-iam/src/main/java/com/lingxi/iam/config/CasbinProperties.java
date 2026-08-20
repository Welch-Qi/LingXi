package com.lingxi.iam.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "lingxi.iam.casbin")
public class CasbinProperties {

    /**
     * file | memory
     */
    private String store = "file";

    private String modelPath = "classpath:casbin/model.conf";

    private String policyPath = "classpath:casbin/policy.csv";

    public String getStore() {
        return store;
    }

    public void setStore(String store) {
        this.store = store;
    }

    public String getModelPath() {
        return modelPath;
    }

    public void setModelPath(String modelPath) {
        this.modelPath = modelPath;
    }

    public String getPolicyPath() {
        return policyPath;
    }

    public void setPolicyPath(String policyPath) {
        this.policyPath = policyPath;
    }
}
