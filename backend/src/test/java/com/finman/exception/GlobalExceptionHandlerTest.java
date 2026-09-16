package com.finman.exception;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finman.dto.response.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.*;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandlerTest.DummyTestController.class)
class GlobalExceptionHandlerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @RestController
    @RequestMapping("/test/exceptions")
    static class DummyTestController {

        static class TestDto {
            @NotBlank(message = "Tên không được để trống")
            private String name;

            @Min(value = 1, message = "Số tiền phải lớn hơn 0")
            private long amount;

            public String getName() {
                return name;
            }

            public void setName(String name) {
                this.name = name;
            }

            public long getAmount() {
                return amount;
            }

            public void setAmount(long amount) {
                this.amount = amount;
            }
        }

        @PostMapping("/validation")
        public ApiResponse<String> testValidation(@Valid @RequestBody TestDto dto) {
            return ApiResponse.success("Dữ liệu hợp lệ");
        }

        @GetMapping("/not-found")
        public void testNotFound() {
            throw new ResourceNotFoundException("Tài khoản", "id", 999L);
        }

        @GetMapping("/business-error")
        public void testBusinessError() {
            throw new BusinessValidationException("Số dư không đủ để thực hiện giao dịch", "INSUFFICIENT_BALANCE");
        }
    }

    @Test
    void whenValidationFails_thenReturn400AndStandardJson() throws Exception {
        DummyTestController.TestDto invalidDto = new DummyTestController.TestDto();
        invalidDto.setName("");
        invalidDto.setAmount(0);

        mockMvc.perform(post("/test/exceptions/validation")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidDto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.error.details.name").value("Tên không được để trống"))
                .andExpect(jsonPath("$.error.details.amount").value("Số tiền phải lớn hơn 0"));
    }

    @Test
    void whenResourceNotFound_thenReturn404AndStandardJson() throws Exception {
        mockMvc.perform(get("/test/exceptions/not-found"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("RESOURCE_NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("Không tìm thấy Tài khoản với id: '999'"));
    }

    @Test
    void whenBusinessError_thenReturn400AndStandardJson() throws Exception {
        mockMvc.perform(get("/test/exceptions/business-error"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("INSUFFICIENT_BALANCE"))
                .andExpect(jsonPath("$.message").value("Số dư không đủ để thực hiện giao dịch"));
    }
}
