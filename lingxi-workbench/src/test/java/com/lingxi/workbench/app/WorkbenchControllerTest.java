package com.lingxi.workbench.app;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.lingxi.decision.domain.DmKpiSnapshot;
import com.lingxi.decision.infra.mapper.DmKpiSnapshotMapper;
import com.lingxi.id.api.IdGenerator;
import com.lingxi.starter.core.exception.GlobalExceptionHandler;
import com.lingxi.starter.core.security.DataScope;
import com.lingxi.starter.core.security.UserContext;
import com.lingxi.workbench.domain.UwInquiryEvent;
import com.lingxi.workbench.domain.UwTask;
import com.lingxi.workbench.infra.mapper.UwInquiryEventMapper;
import com.lingxi.workbench.infra.mapper.UwTaskMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = WorkbenchController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class WorkbenchControllerTest {

    private static final Long TENANT_ID = 10086L;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DmKpiSnapshotMapper kpiSnapshotMapper;

    @MockBean
    private UwTaskMapper uwTaskMapper;

    @MockBean
    private UwInquiryEventMapper inquiryEventMapper;

    @MockBean
    private IdGenerator idGenerator;

    @BeforeEach
    void setUp() {
        UserContext.set(new UserContext.UserPrincipal(
                "10086001", "admin", "Admin", TENANT_ID, List.of("role_admin"), DataScope.ALL, "10086001"));
    }

    @AfterEach
    void tearDown() {
        UserContext.clear();
    }

    @Test
    void testDashboardReturnsResult() throws Exception {
        when(kpiSnapshotMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(3L);
        when(uwTaskMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(sampleTask()));
        when(inquiryEventMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(2L);

        mockMvc.perform(get("/api/v1/workbench/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.kpiCount").value(3))
                .andExpect(jsonPath("$.data.taskCount").value(1))
                .andExpect(jsonPath("$.data.inquiryCount").value(2))
                .andExpect(jsonPath("$.data.userId").value("10086001"));
    }

    @Test
    void testListTasks() throws Exception {
        UwTask task = sampleTask();
        when(uwTaskMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(task));

        mockMvc.perform(get("/api/v1/workbench/tasks")
                        .param("status", "OPEN")
                        .param("mineOnly", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.total").value(1))
                .andExpect(jsonPath("$.data.list[0].title").value("Follow up lead"))
                .andExpect(jsonPath("$.data.list[0].status").value("OPEN"));
    }

    @Test
    void testCompleteTask() throws Exception {
        UwTask task = sampleTask();
        when(uwTaskMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(task);
        when(uwTaskMapper.updateById(any(UwTask.class))).thenReturn(1);

        mockMvc.perform(post("/api/v1/workbench/tasks/9001/complete"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.status").value("DONE"))
                .andExpect(jsonPath("$.data.completedAt").exists());

        ArgumentCaptor<UwTask> captor = ArgumentCaptor.forClass(UwTask.class);
        verify(uwTaskMapper).updateById(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo("DONE");
        assertThat(captor.getValue().getCompletedAt()).isNotNull();
    }

    @Test
    void testUpdateTask() throws Exception {
        UwTask task = sampleTask();
        when(uwTaskMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(task);
        when(uwTaskMapper.updateById(any(UwTask.class))).thenReturn(1);

        mockMvc.perform(patch("/api/v1/workbench/tasks/9001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"IN_PROGRESS","priority":80,"assigneeId":20001}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.data.priority").value(80))
                .andExpect(jsonPath("$.data.assigneeId").value(20001));

        ArgumentCaptor<UwTask> captor = ArgumentCaptor.forClass(UwTask.class);
        verify(uwTaskMapper).updateById(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo("IN_PROGRESS");
        assertThat(captor.getValue().getPriority()).isEqualTo(80);
        assertThat(captor.getValue().getAssigneeId()).isEqualTo(20001L);
    }

    @Test
    void testUpdateTaskStatusToDone() throws Exception {
        UwTask task = sampleTask();
        when(uwTaskMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(task);
        when(uwTaskMapper.updateById(any(UwTask.class))).thenReturn(1);

        mockMvc.perform(patch("/api/v1/workbench/tasks/9001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"DONE"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.status").value("DONE"))
                .andExpect(jsonPath("$.data.completedAt").exists());

        ArgumentCaptor<UwTask> captor = ArgumentCaptor.forClass(UwTask.class);
        verify(uwTaskMapper).updateById(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo("DONE");
        assertThat(captor.getValue().getCompletedAt()).isNotNull();
    }

    @Test
    void testListInquiries() throws Exception {
        UwInquiryEvent inquiry = sampleInquiry();
        when(inquiryEventMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(inquiry));

        mockMvc.perform(get("/api/v1/workbench/inquiries").param("status", "NEW"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.total").value(1))
                .andExpect(jsonPath("$.data.list[0].title").value("Website inquiry"))
                .andExpect(jsonPath("$.data.list[0].status").value("NEW"));
    }

    @Test
    void testAcknowledgeInquiry() throws Exception {
        UwInquiryEvent inquiry = sampleInquiry();
        when(inquiryEventMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(inquiry);
        when(inquiryEventMapper.updateById(any(UwInquiryEvent.class))).thenReturn(1);

        mockMvc.perform(post("/api/v1/workbench/inquiries/7001/acknowledge"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.status").value("ACKED"))
                .andExpect(jsonPath("$.data.acknowledgedBy").value(10086001))
                .andExpect(jsonPath("$.data.acknowledgedAt").exists());

        ArgumentCaptor<UwInquiryEvent> captor = ArgumentCaptor.forClass(UwInquiryEvent.class);
        verify(inquiryEventMapper).updateById(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo("ACKED");
        assertThat(captor.getValue().getAcknowledgedBy()).isEqualTo(10086001L);
        assertThat(captor.getValue().getAcknowledgedAt()).isNotNull();
    }

    private static UwTask sampleTask() {
        UwTask task = new UwTask();
        task.setId(9001L);
        task.setTenantId(TENANT_ID);
        task.setBizCode("TASK-001");
        task.setTitle("Follow up lead");
        task.setTaskType("FOLLOW_UP");
        task.setStatus("OPEN");
        task.setPriority(50);
        task.setAssigneeId(10086001L);
        task.setDueAt(Instant.parse("2026-08-20T08:00:00Z"));
        return task;
    }

    private static UwInquiryEvent sampleInquiry() {
        UwInquiryEvent event = new UwInquiryEvent();
        event.setId(7001L);
        event.setTenantId(TENANT_ID);
        event.setBizCode("INQ-001");
        event.setTitle("Website inquiry");
        event.setChannel("WEB");
        event.setContactName("Jane Doe");
        event.setContactEmail("jane@example.com");
        event.setStatus("NEW");
        return event;
    }
}
