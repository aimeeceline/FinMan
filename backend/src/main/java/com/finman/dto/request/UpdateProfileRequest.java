package com.finman.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateProfileRequest {

    @NotBlank(message = "Họ và tên không được để trống")
    @Size(max = 100, message = "Họ và tên tối đa 100 ký tự")
    private String fullName;

    @Size(max = 500, message = "URL ảnh đại diện tối đa 500 ký tự")
    private String avatarUrl;

    public UpdateProfileRequest() {
    }

    public UpdateProfileRequest(String fullName) {
        this.fullName = fullName;
    }

    public UpdateProfileRequest(String fullName, String avatarUrl) {
        this.fullName = fullName;
        this.avatarUrl = avatarUrl;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }
}
