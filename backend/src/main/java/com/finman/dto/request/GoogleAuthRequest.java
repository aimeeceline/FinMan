package com.finman.dto.request;

public class GoogleAuthRequest {

    private String idToken;
    private String accessToken;
    private String email;
    private String fullName;
    private String avatarUrl;

    public GoogleAuthRequest() {
    }

    public GoogleAuthRequest(String email, String fullName, String avatarUrl) {
        this.email = email;
        this.fullName = fullName;
        this.avatarUrl = avatarUrl;
    }

    public GoogleAuthRequest(String idToken, String accessToken, String email, String fullName, String avatarUrl) {
        this.idToken = idToken;
        this.accessToken = accessToken;
        this.email = email;
        this.fullName = fullName;
        this.avatarUrl = avatarUrl;
    }

    public String getIdToken() {
        return idToken;
    }

    public void setIdToken(String idToken) {
        this.idToken = idToken;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
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
