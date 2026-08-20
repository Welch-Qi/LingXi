package com.lingxi.sales.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SalesOpportunityTest {

    @Test
    void advanceToLegalTransition() {
        SalesOpportunity opp = new SalesOpportunity();
        opp.setStage("DISCOVER");

        opp.advanceTo("QUALIFY");

        assertThat(opp.getStage()).isEqualTo("QUALIFY");
    }

    @Test
    void advanceToIllegalTransitionThrows() {
        SalesOpportunity opp = new SalesOpportunity();
        opp.setStage("WON");

        assertThatThrownBy(() -> opp.advanceTo("NEGOTIATE"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("terminal stage");
    }
}
