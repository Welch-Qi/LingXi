package com.lingxi.iam.infra.casbin;

import com.lingxi.iam.config.CasbinProperties;
import org.casbin.jcasbin.main.Enforcer;
import org.casbin.jcasbin.model.Model;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * 构建 Casbin Enforcer（默认从 classpath 加载 model/policy）。
 */
@Component
public class CasbinEnforcerFactory {

    private final CasbinProperties properties;
    private final ResourceLoader resourceLoader;

    public CasbinEnforcerFactory(CasbinProperties properties, ResourceLoader resourceLoader) {
        this.properties = properties;
        this.resourceLoader = resourceLoader;
    }

    public Enforcer create() {
        try {
            String modelText = readText(properties.getModelPath());
            Model model = new Model();
            model.loadModelFromText(modelText);
            Enforcer enforcer = new Enforcer(model);
            loadPolicies(enforcer, properties.getPolicyPath());
            enforcer.enableAutoSave(false);
            return enforcer;
        } catch (IOException ex) {
            throw new IllegalStateException("failed to init casbin enforcer", ex);
        }
    }

    private void loadPolicies(Enforcer enforcer, String policyPath) throws IOException {
        String content = readText(policyPath);
        for (String raw : content.split("\\R")) {
            String line = raw.trim();
            if (line.isEmpty() || line.startsWith("#")) {
                continue;
            }
            String[] parts = line.split("\\s*,\\s*");
            if (parts.length < 2) {
                continue;
            }
            if ("p".equals(parts[0]) && parts.length >= 5) {
                enforcer.addPolicy(parts[1], parts[2], parts[3], parts[4]);
            } else if ("g".equals(parts[0]) && parts.length >= 4) {
                enforcer.addGroupingPolicy(parts[1], parts[2], parts[3]);
            }
        }
    }

    private String readText(String location) throws IOException {
        if (location.startsWith("classpath:")) {
            Resource resource = resourceLoader.getResource(location);
            try (InputStream in = resource.getInputStream()) {
                return StreamUtils.copyToString(in, StandardCharsets.UTF_8);
            }
        }
        return Files.readString(Path.of(location));
    }
}
