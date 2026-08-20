package com.lingxi.id.app;

import com.lingxi.id.api.IdGenerator;
import com.lingxi.starter.core.result.Result;
import com.lingxi.starter.security.annotation.RequirePermission;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/id")
public class IdController {

    private final IdGenerator idGenerator;

    public IdController(IdGenerator idGenerator) {
        this.idGenerator = idGenerator;
    }

    @GetMapping("/next")
    @RequirePermission("cc:user:manage")
    public Result<Map<String, Object>> next(@RequestParam(defaultValue = "ID") String prefix) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", idGenerator.nextId());
        data.put("bizCode", idGenerator.nextBizCode(prefix));
        return Result.ok(data);
    }
}
