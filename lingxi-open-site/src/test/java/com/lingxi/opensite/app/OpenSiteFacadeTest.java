package com.lingxi.opensite.app;

import com.lingxi.opensite.api.dto.OpenSiteDtos.LeadCreateRequest;
import com.lingxi.opensite.api.dto.OpenSiteDtos.Buyer;
import com.lingxi.opensite.config.OpenSiteProperties;
import com.lingxi.opensite.domain.SiteBinding;
import com.lingxi.opensite.infra.IdempotencyStore;
import com.lingxi.opensite.infra.SiteRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class OpenSiteFacadeTest {

    private OpenSiteFacade facade;
    private SiteRegistry siteRegistry;

    @BeforeEach
    void setUp() {
        OpenSiteProperties properties = new OpenSiteProperties();
        OpenSiteProperties.Site site = new OpenSiteProperties.Site();
        site.setSiteId("site_demo");
        site.setTenantId(10086L);
        site.setChannel("storefront");
        site.setClientSecret("demo-secret");
        properties.getSites().add(site);
        siteRegistry = new SiteRegistry(properties);
        facade = new OpenSiteFacade(new IdempotencyStore(Jackson2ObjectMapperBuilder.json().build()));
    }

    @Test
    void createLeadIsIdempotent() {
        SiteBinding binding = siteRegistry.require("site_demo");
        com.lingxi.opensite.domain.SiteContext.set(binding);
        try {
            LeadCreateRequest req = new LeadCreateRequest(
                    "storefront", "inquiry", "sess1", "P1001", "SKU-EVA-01",
                    new Buyer("a@b.com", "Alice", null, "u1"), "hi");
            var first = facade.createLead(req, "idem-1");
            var second = facade.createLead(req, "idem-1");
            assertEquals(first.leadId(), second.leadId());
        } finally {
            com.lingxi.opensite.domain.SiteContext.clear();
        }
    }

    @Test
    void unknownSiteRejected() {
        assertThrows(com.lingxi.starter.core.exception.BizException.class,
                () -> siteRegistry.require("missing"));
    }
}
