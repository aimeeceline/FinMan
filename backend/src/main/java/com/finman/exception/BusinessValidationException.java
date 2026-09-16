package com.finman.exception;

import org.springframework.http.HttpStatus;

public class BusinessValidationException extends AppException {

    public BusinessValidationException(String message, String errorCode, Object details) {
        super(message, HttpStatus.BAD_REQUEST, errorCode, details);
    }

    public BusinessValidationException(String message, String errorCode) {
        super(message, HttpStatus.BAD_REQUEST, errorCode);
    }

    public BusinessValidationException(String message) {
        super(message, HttpStatus.BAD_REQUEST, "BUSINESS_VALIDATION_ERROR");
    }
}
