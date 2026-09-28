package com.finman.client;

public interface GeminiClient {

    String generateContent(String prompt, boolean jsonMode);
}
