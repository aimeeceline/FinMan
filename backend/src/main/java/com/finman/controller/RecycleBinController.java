package com.finman.controller;

import com.finman.dto.request.RecycleBinActionRequest;
import com.finman.dto.response.ApiResponse;
import com.finman.dto.response.RecycleBinItemResponse;
import com.finman.exception.UnauthorizedException;
import com.finman.security.UserPrincipal;
import com.finman.service.RecycleBinService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/recycle-bin")
public class RecycleBinController {

    private final RecycleBinService recycleBinService;

    public RecycleBinController(RecycleBinService recycleBinService) {
        this.recycleBinService = recycleBinService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<RecycleBinItemResponse>>> getRecycleBinItems(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) String type) {
        validateUser(userPrincipal);
        List<RecycleBinItemResponse> items = recycleBinService.getItems(userPrincipal.getId(), type);
        return ResponseEntity.ok(ApiResponse.success(items, "Lấy danh sách thùng rác thành công"));
    }

    @PostMapping("/restore")
    public ResponseEntity<ApiResponse<Void>> restoreItems(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody RecycleBinActionRequest request) {
        validateUser(userPrincipal);
        recycleBinService.restore(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(null, "Khôi phục thành công"));
    }

    @PostMapping("/permanent-delete")
    public ResponseEntity<ApiResponse<Void>> permanentDeletePost(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody RecycleBinActionRequest request) {
        validateUser(userPrincipal);
        recycleBinService.permanentDelete(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa vĩnh viễn thành công"));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> permanentDelete(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody RecycleBinActionRequest request) {
        validateUser(userPrincipal);
        recycleBinService.permanentDelete(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa vĩnh viễn thành công"));
    }

    private void validateUser(UserPrincipal userPrincipal) {
        if (userPrincipal == null || userPrincipal.getId() == null) {
            throw new UnauthorizedException("Người dùng chưa được xác thực");
        }
    }
}
