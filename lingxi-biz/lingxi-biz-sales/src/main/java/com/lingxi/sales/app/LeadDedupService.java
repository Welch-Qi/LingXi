package com.lingxi.sales.app;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.lingxi.mdata.domain.DcCustomer;
import com.lingxi.mdata.infra.mapper.DcCustomerMapper;
import com.lingxi.sales.domain.SalesLead;
import com.lingxi.sales.infra.mapper.SalesLeadMapper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 多维查重：公司名 / 邮箱 / 电话 / 域名 / 官网，对照线索与客户主数据。
 */
@Service
public class LeadDedupService {

    private static final Pattern DOMAIN_FROM_URL = Pattern.compile(
            "(?i)^(?:https?://)?(?:www\\.)?([^/:\\s]+)");

    private final SalesLeadMapper salesLeadMapper;
    private final DcCustomerMapper dcCustomerMapper;

    public LeadDedupService(SalesLeadMapper salesLeadMapper, DcCustomerMapper dcCustomerMapper) {
        this.salesLeadMapper = salesLeadMapper;
        this.dcCustomerMapper = dcCustomerMapper;
    }

    public Map<String, Object> check(Long tenantId, Map<String, Object> criteria) {
        String companyName = text(criteria.get("companyName"));
        String email = text(criteria.get("email"));
        String phone = text(criteria.get("phone"));
        String website = text(criteria.get("website"));
        String domain = text(criteria.get("domain"));
        if (!StringUtils.hasText(domain)) {
            domain = extractDomain(website);
        }
        if (!StringUtils.hasText(domain) && StringUtils.hasText(email) && email.contains("@")) {
            domain = email.substring(email.indexOf('@') + 1).toLowerCase(Locale.ROOT);
        }

        List<Map<String, Object>> matches = new ArrayList<>();
        List<SalesLead> leads = salesLeadMapper.selectList(
                new LambdaQueryWrapper<SalesLead>().eq(SalesLead::getTenantId, tenantId).last("LIMIT 500"));
        for (SalesLead lead : leads) {
            List<String> reasons = matchLead(lead, companyName, email, phone, domain, website);
            if (!reasons.isEmpty()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("entityType", "LEAD");
                row.put("id", lead.getId());
                row.put("bizCode", lead.getBizCode());
                row.put("name", lead.getCompanyName());
                row.put("email", lead.getEmail());
                row.put("phone", lead.getPhone());
                row.put("domain", lead.getDomain());
                row.put("status", lead.getStatus());
                row.put("ownerUserId", lead.getOwnerUserId());
                row.put("matchReasons", reasons);
                matches.add(row);
            }
        }

        List<DcCustomer> customers = dcCustomerMapper.selectList(
                new LambdaQueryWrapper<DcCustomer>().eq(DcCustomer::getTenantId, tenantId).last("LIMIT 500"));
        for (DcCustomer c : customers) {
            List<String> reasons = matchCustomer(c, companyName, domain, website);
            if (!reasons.isEmpty()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("entityType", "CUSTOMER");
                row.put("id", c.getId());
                row.put("bizCode", c.getBizCode());
                row.put("name", c.getName());
                row.put("domain", c.getDomain());
                row.put("website", c.getWebsite());
                row.put("ownerUserId", c.getOwnerUserId());
                row.put("matchReasons", reasons);
                matches.add(row);
            }
        }

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("hasDuplicate", !matches.isEmpty());
        data.put("count", matches.size());
        data.put("duplicates", matches);
        data.put("normalized", Map.of(
                "companyName", nullToEmpty(companyName),
                "email", nullToEmpty(email),
                "phone", normalizePhone(phone),
                "domain", nullToEmpty(domain),
                "website", nullToEmpty(website)));
        return data;
    }

    public static String extractDomain(String websiteOrHost) {
        if (!StringUtils.hasText(websiteOrHost)) {
            return null;
        }
        String raw = websiteOrHost.trim().toLowerCase(Locale.ROOT);
        Matcher m = DOMAIN_FROM_URL.matcher(raw);
        if (m.find()) {
            return m.group(1);
        }
        return raw.contains(".") ? raw : null;
    }

    private static List<String> matchLead(
            SalesLead lead, String companyName, String email, String phone, String domain, String website) {
        List<String> reasons = new ArrayList<>();
        if (StringUtils.hasText(companyName) && equalsIgnoreCase(companyName, lead.getCompanyName())) {
            reasons.add("COMPANY_NAME");
        }
        if (StringUtils.hasText(email) && equalsIgnoreCase(email, lead.getEmail())) {
            reasons.add("EMAIL");
        }
        if (StringUtils.hasText(phone)
                && StringUtils.hasText(lead.getPhone())
                && normalizePhone(phone).equals(normalizePhone(lead.getPhone()))) {
            reasons.add("PHONE");
        }
        if (StringUtils.hasText(domain)) {
            String leadDomain = StringUtils.hasText(lead.getDomain())
                    ? lead.getDomain()
                    : extractDomain(lead.getWebsite());
            if (!StringUtils.hasText(leadDomain) && StringUtils.hasText(lead.getEmail()) && lead.getEmail().contains("@")) {
                leadDomain = lead.getEmail().substring(lead.getEmail().indexOf('@') + 1);
            }
            if (equalsIgnoreCase(domain, leadDomain)) {
                reasons.add("DOMAIN");
            }
        }
        if (StringUtils.hasText(website)
                && StringUtils.hasText(lead.getWebsite())
                && equalsIgnoreCase(extractDomain(website), extractDomain(lead.getWebsite()))) {
            if (!reasons.contains("DOMAIN")) {
                reasons.add("WEBSITE");
            }
        }
        return reasons;
    }

    private static List<String> matchCustomer(DcCustomer c, String companyName, String domain, String website) {
        List<String> reasons = new ArrayList<>();
        if (StringUtils.hasText(companyName) && equalsIgnoreCase(companyName, c.getName())) {
            reasons.add("COMPANY_NAME");
        }
        if (StringUtils.hasText(domain) && equalsIgnoreCase(domain, c.getDomain())) {
            reasons.add("DOMAIN");
        }
        if (StringUtils.hasText(domain)
                && StringUtils.hasText(c.getWebsite())
                && equalsIgnoreCase(domain, extractDomain(c.getWebsite()))) {
            if (!reasons.contains("DOMAIN")) {
                reasons.add("WEBSITE");
            }
        }
        if (StringUtils.hasText(website)
                && StringUtils.hasText(c.getWebsite())
                && equalsIgnoreCase(extractDomain(website), extractDomain(c.getWebsite()))) {
            if (!reasons.contains("DOMAIN") && !reasons.contains("WEBSITE")) {
                reasons.add("WEBSITE");
            }
        }
        return reasons;
    }

    private static boolean equalsIgnoreCase(String a, String b) {
        return StringUtils.hasText(a) && StringUtils.hasText(b) && a.trim().equalsIgnoreCase(b.trim());
    }

    private static String normalizePhone(String phone) {
        if (!StringUtils.hasText(phone)) {
            return "";
        }
        return phone.replaceAll("[^0-9+]", "");
    }

    private static String text(Object v) {
        return v == null ? null : String.valueOf(v).trim();
    }

    private static String nullToEmpty(String v) {
        return v == null ? "" : v;
    }
}
