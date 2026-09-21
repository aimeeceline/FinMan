package com.finman.service;

import com.finman.dto.request.LoginRequest;
import com.finman.dto.request.RegisterRequest;
import com.finman.dto.response.AuthResponse;
import com.finman.dto.response.UserResponse;
import com.finman.entity.Account;
import com.finman.entity.User;
import com.finman.entity.enums.AccountType;
import com.finman.exception.BusinessValidationException;
import com.finman.exception.ResourceNotFoundException;
import com.finman.repository.AccountRepository;
import com.finman.repository.UserRepository;
import com.finman.security.JwtTokenProvider;
import com.finman.security.UserPrincipal;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    private static final String TEST_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private static final long EXPIRATION_MS = 3600000; // 1 hour

    @Mock
    private UserRepository userRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    private JwtTokenProvider jwtTokenProvider;
    private AuthService authService;
    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
        SecurityContextHolder.clearContext();

        jwtTokenProvider = new JwtTokenProvider(TEST_SECRET, EXPIRATION_MS);
        authService = new AuthService(
                userRepository,
                accountRepository,
                passwordEncoder,
                jwtTokenProvider,
                authenticationManager
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("TC_AUTH_01: Đăng ký thành công - tạo User, tạo ví Tiền mặt (0đ) và sinh JWT Token hợp lệ")
    void testRegisterSuccess_CreatesUserAndDefaultCashAccount() {
        RegisterRequest request = new RegisterRequest("test@finman.com", "Password@123", "Nguyễn Văn A");

        when(userRepository.existsByEmail("test@finman.com")).thenReturn(false);
        when(passwordEncoder.encode("Password@123")).thenReturn("encodedPasswordHash");

        User mockSavedUser = new User("test@finman.com", "encodedPasswordHash", "Nguyễn Văn A");
        mockSavedUser.setId(100L);

        when(userRepository.save(any(User.class))).thenReturn(mockSavedUser);

        AuthResponse response = authService.register(request);

        // Verify response and JWT validity
        assertNotNull(response);
        assertNotNull(response.getToken());
        assertTrue(jwtTokenProvider.validateToken(response.getToken()));
        assertEquals(100L, jwtTokenProvider.getUserIdFromToken(response.getToken()));
        assertEquals("test@finman.com", jwtTokenProvider.getEmailFromToken(response.getToken()));

        assertNotNull(response.getUser());
        assertEquals(100L, response.getUser().getId());
        assertEquals("test@finman.com", response.getUser().getEmail());
        assertEquals("Nguyễn Văn A", response.getUser().getFullName());

        // Verify user saved with encoded password
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User capturedUser = userCaptor.getValue();
        assertEquals("test@finman.com", capturedUser.getEmail());
        assertEquals("encodedPasswordHash", capturedUser.getPasswordHash());
        assertEquals("Nguyễn Văn A", capturedUser.getFullName());

        // Verify default cash wallet created with 0 balance
        ArgumentCaptor<Account> accountCaptor = ArgumentCaptor.forClass(Account.class);
        verify(accountRepository).save(accountCaptor.capture());
        Account capturedAccount = accountCaptor.getValue();
        assertEquals("Tiền mặt", capturedAccount.getName());
        assertEquals(AccountType.CASH, capturedAccount.getType());
        assertEquals(0L, capturedAccount.getInitialBalance());
        assertEquals(0L, capturedAccount.getCurrentBalance());
        assertEquals(mockSavedUser, capturedAccount.getUser());
    }

    @Test
    @DisplayName("TC_AUTH_02: Đăng ký thất bại khi email đã tồn tại - Ném BusinessValidationException")
    void testRegisterDuplicateEmail_ThrowsBusinessValidationException() {
        RegisterRequest request = new RegisterRequest("duplicate@finman.com", "Password@123", "Trần Văn B");

        when(userRepository.existsByEmail("duplicate@finman.com")).thenReturn(true);

        BusinessValidationException ex = assertThrows(BusinessValidationException.class, () -> {
            authService.register(request);
        });

        assertEquals("EMAIL_ALREADY_EXISTS", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("Email này đã được sử dụng"));

        verify(userRepository, never()).save(any(User.class));
        verify(accountRepository, never()).save(any(Account.class));
    }

    @Test
    @DisplayName("TC_AUTH_03 (Unit): Đăng ký chuẩn hóa email viết hoa và khoảng trắng thừa")
    void testRegisterNormalizesEmailAndTrimsFullName() {
        RegisterRequest request = new RegisterRequest("  USER.Test@FinMan.Com  ", "Secret@123", "  Lê Minh Khang  ");

        when(userRepository.existsByEmail("user.test@finman.com")).thenReturn(false);
        when(passwordEncoder.encode("Secret@123")).thenReturn("hashedPass");

        User mockSavedUser = new User("user.test@finman.com", "hashedPass", "Lê Minh Khang");
        mockSavedUser.setId(101L);
        when(userRepository.save(any(User.class))).thenReturn(mockSavedUser);

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("user.test@finman.com", response.getUser().getEmail());
        assertEquals("Lê Minh Khang", response.getUser().getFullName());
        assertTrue(jwtTokenProvider.validateToken(response.getToken()));
        assertEquals(101L, jwtTokenProvider.getUserIdFromToken(response.getToken()));

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertEquals("user.test@finman.com", captor.getValue().getEmail());
        assertEquals("Lê Minh Khang", captor.getValue().getFullName());
    }

    @Test
    @DisplayName("TC_AUTH_03 (Bean Validation): Kiểm tra ràng buộc dữ liệu RegisterRequest và LoginRequest")
    void testBeanValidationConstraintsOnAuthRequests() {
        // Invalid RegisterRequest: blank email, password < 6 chars, blank name
        RegisterRequest invalidRegister = new RegisterRequest("", "12345", "");
        Set<ConstraintViolation<RegisterRequest>> regViolations = validator.validate(invalidRegister);
        assertFalse(regViolations.isEmpty());
        assertTrue(regViolations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("email")));
        assertTrue(regViolations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("password")));
        assertTrue(regViolations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("fullName")));

        // Invalid email format
        RegisterRequest invalidEmail = new RegisterRequest("not-an-email", "ValidPass123", "Valid Name");
        Set<ConstraintViolation<RegisterRequest>> emailViolations = validator.validate(invalidEmail);
        assertTrue(emailViolations.stream().anyMatch(v -> v.getMessage().contains("không đúng định dạng")));

        // Valid RegisterRequest
        RegisterRequest validRegister = new RegisterRequest("valid@finman.com", "ValidPass123", "Valid User");
        assertTrue(validator.validate(validRegister).isEmpty());

        // Invalid LoginRequest: blank fields
        LoginRequest invalidLogin = new LoginRequest("", "");
        Set<ConstraintViolation<LoginRequest>> loginViolations = validator.validate(invalidLogin);
        assertEquals(2, loginViolations.size());

        // Valid LoginRequest
        LoginRequest validLogin = new LoginRequest("valid@finman.com", "ValidPass123");
        assertTrue(validator.validate(validLogin).isEmpty());
    }

    @Test
    @DisplayName("TC_AUTH_04: Đăng nhập thành công - Trả về Token và thông tin User")
    void testLoginSuccess_ReturnsAuthResponse() {
        LoginRequest request = new LoginRequest("user@finman.com", "ValidPass123");

        User user = new User("user@finman.com", "encodedHash", "Nguyễn Văn C");
        user.setId(200L);

        UserPrincipal principal = UserPrincipal.create(user);
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, "ValidPass123", principal.getAuthorities());

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(auth);
        when(userRepository.findById(200L)).thenReturn(Optional.of(user));

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertNotNull(response.getToken());
        assertTrue(jwtTokenProvider.validateToken(response.getToken()));
        assertEquals(200L, jwtTokenProvider.getUserIdFromToken(response.getToken()));

        assertEquals(200L, response.getUser().getId());
        assertEquals("user@finman.com", response.getUser().getEmail());
        assertEquals("Nguyễn Văn C", response.getUser().getFullName());
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    @DisplayName("TC_AUTH_05: Đăng nhập sai mật khẩu - Ném BusinessValidationException BAD_CREDENTIALS")
    void testLoginBadCredentials_ThrowsBusinessValidationException() {
        LoginRequest request = new LoginRequest("user@finman.com", "WrongPassword");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        BusinessValidationException ex = assertThrows(BusinessValidationException.class, () -> {
            authService.login(request);
        });

        assertEquals("BAD_CREDENTIALS", ex.getErrorCode());
        assertEquals("Email hoặc mật khẩu không chính xác", ex.getMessage());
    }

    @Test
    @DisplayName("TC_AUTH_05: Đăng nhập email không tồn tại - Ném BusinessValidationException BAD_CREDENTIALS")
    void testLoginInternalAuthException_ThrowsBusinessValidationException() {
        LoginRequest request = new LoginRequest("nonexistent@finman.com", "AnyPassword");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new InternalAuthenticationServiceException("User not found"));

        BusinessValidationException ex = assertThrows(BusinessValidationException.class, () -> {
            authService.login(request);
        });

        assertEquals("BAD_CREDENTIALS", ex.getErrorCode());
        assertEquals("Email hoặc mật khẩu không chính xác", ex.getMessage());
    }

    @Test
    @DisplayName("TC_AUTH_05: Đăng nhập gặp lỗi AuthenticationException khác - Ném BusinessValidationException AUTH_FAILED")
    void testLoginGenericAuthException_ThrowsBusinessValidationException() {
        LoginRequest request = new LoginRequest("user@finman.com", "AnyPassword");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new DisabledException("Account is disabled"));

        BusinessValidationException ex = assertThrows(BusinessValidationException.class, () -> {
            authService.login(request);
        });

        assertEquals("AUTH_FAILED", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("Đăng nhập thất bại: Account is disabled"));
    }

    @Test
    @DisplayName("TC_AUTH_06: Lấy thông tin cá nhân getCurrentUser thành công")
    void testGetCurrentUserSuccess() {
        User user = new User("profile@finman.com", "hashedPass", "Hồ Thị Mai");
        user.setId(300L);
        user.setAvatarUrl("https://finman.com/avatars/mai.png");

        when(userRepository.findById(300L)).thenReturn(Optional.of(user));

        UserResponse userResponse = authService.getCurrentUser(300L);

        assertNotNull(userResponse);
        assertEquals(300L, userResponse.getId());
        assertEquals("profile@finman.com", userResponse.getEmail());
        assertEquals("Hồ Thị Mai", userResponse.getFullName());
        assertEquals("https://finman.com/avatars/mai.png", userResponse.getAvatarUrl());
    }

    @Test
    @DisplayName("TC_AUTH_07: Lấy thông tin cá nhân getCurrentUser không tìm thấy - Ném ResourceNotFoundException")
    void testGetCurrentUserNotFound_ThrowsResourceNotFoundException() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class, () -> {
            authService.getCurrentUser(999L);
        });

        assertTrue(ex.getMessage().contains("Người dùng"));
        assertTrue(ex.getMessage().contains("999"));
    }

    @Test
    @DisplayName("Google Auth: Đăng nhập với tài khoản Google mới - Tạo User và ví Tiền mặt 0đ")
    void testLoginWithGoogle_NewUser_CreatesUserAndCashWallet() {
        com.finman.dto.request.GoogleAuthRequest request =
                new com.finman.dto.request.GoogleAuthRequest("google.user@gmail.com", "Google User", "https://avatar.url");

        when(userRepository.findByEmail("google.user@gmail.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("randomPasswordHash");

        User savedUser = new User("google.user@gmail.com", "randomPasswordHash", "Google User");
        savedUser.setId(500L);
        savedUser.setAvatarUrl("https://avatar.url");

        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        AuthResponse response = authService.loginWithGoogle(request);

        assertNotNull(response);
        assertNotNull(response.getToken());
        assertTrue(jwtTokenProvider.validateToken(response.getToken()));
        assertEquals(500L, jwtTokenProvider.getUserIdFromToken(response.getToken()));
        assertEquals("google.user@gmail.com", response.getUser().getEmail());

        // Verify cash wallet was created
        ArgumentCaptor<Account> accountCaptor = ArgumentCaptor.forClass(Account.class);
        verify(accountRepository).save(accountCaptor.capture());
        assertEquals("Tiền mặt", accountCaptor.getValue().getName());
        assertEquals(AccountType.CASH, accountCaptor.getValue().getType());
        assertEquals(0L, accountCaptor.getValue().getCurrentBalance());
    }

    @Test
    @DisplayName("Google Auth: Đăng nhập với tài khoản Google đã có trong hệ thống - Trả về Token ngay")
    void testLoginWithGoogle_ExistingUser_ReturnsToken() {
        com.finman.dto.request.GoogleAuthRequest request =
                new com.finman.dto.request.GoogleAuthRequest("existing.google@gmail.com", "Existing User", null);

        User existingUser = new User("existing.google@gmail.com", "existingHash", "Existing User");
        existingUser.setId(501L);

        when(userRepository.findByEmail("existing.google@gmail.com")).thenReturn(Optional.of(existingUser));

        AuthResponse response = authService.loginWithGoogle(request);

        assertNotNull(response);
        assertNotNull(response.getToken());
        assertEquals(501L, response.getUser().getId());
        assertEquals("existing.google@gmail.com", response.getUser().getEmail());

        verify(accountRepository, never()).save(any(Account.class));
    }

    @Test
    @DisplayName("Google Auth: Thiếu email Google - Ném BusinessValidationException")
    void testLoginWithGoogle_EmptyEmail_ThrowsException() {
        com.finman.dto.request.GoogleAuthRequest request =
                new com.finman.dto.request.GoogleAuthRequest("", "No Email", null);

        BusinessValidationException ex = assertThrows(BusinessValidationException.class, () -> {
            authService.loginWithGoogle(request);
        });

        assertEquals("GOOGLE_EMAIL_REQUIRED", ex.getErrorCode());
    }
}
