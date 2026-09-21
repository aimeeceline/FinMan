package com.finman.service;

import com.finman.dto.request.GoogleAuthRequest;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository,
                       AccountRepository accountRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider,
                       AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BusinessValidationException(
                    "Email này đã được sử dụng. Vui lòng chọn email khác.",
                    "EMAIL_ALREADY_EXISTS"
            );
        }

        User user = new User(
                normalizedEmail,
                passwordEncoder.encode(request.getPassword()),
                request.getFullName().trim()
        );
        User savedUser = userRepository.save(user);

        // Tự động khởi tạo ví "Tiền mặt" ban đầu với số dư 0đ
        Account defaultCashAccount = new Account(
                savedUser,
                "Tiền mặt",
                AccountType.CASH,
                0L
        );
        accountRepository.save(defaultCashAccount);

        String token = jwtTokenProvider.generateToken(savedUser.getId(), savedUser.getEmail());
        return new AuthResponse(token, UserResponse.from(savedUser));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

            User user = userRepository.findById(principal.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", principal.getId()));

            String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail());
            return new AuthResponse(token, UserResponse.from(user));
        } catch (BadCredentialsException | InternalAuthenticationServiceException e) {
            throw new BusinessValidationException(
                    "Email hoặc mật khẩu không chính xác",
                    "BAD_CREDENTIALS"
            );
        } catch (AuthenticationException e) {
            throw new BusinessValidationException(
                    "Đăng nhập thất bại: " + e.getMessage(),
                    "AUTH_FAILED"
            );
        }
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", userId));
        return UserResponse.from(user);
    }

    @Transactional
    public AuthResponse loginWithGoogle(GoogleAuthRequest request) {
        String email = null;
        String fullName = null;
        String avatarUrl = null;

        // 1. Xác thực Google idToken nếu được cung cấp
        if (request.getIdToken() != null && !request.getIdToken().trim().isEmpty()) {
            try {
                RestTemplate restTemplate = new RestTemplate();
                String verifyUrl = "https://oauth2.googleapis.com/tokeninfo?id_token=" + request.getIdToken().trim();
                Map<String, Object> googlePayload = restTemplate.getForObject(verifyUrl, Map.class);
                if (googlePayload != null && googlePayload.containsKey("email")) {
                    email = (String) googlePayload.get("email");
                    fullName = (String) googlePayload.get("name");
                    avatarUrl = (String) googlePayload.get("picture");
                }
            } catch (Exception e) {
                log.warn("Không thể xác thực idToken với Google: {}", e.getMessage());
                if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
                    throw new BusinessValidationException("Google ID Token không hợp lệ hoặc đã hết hạn", "INVALID_GOOGLE_TOKEN");
                }
            }
        }

        // 2. Dự phòng lấy email và họ tên trực tiếp từ request
        if (email == null && request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            email = request.getEmail().trim().toLowerCase();
            fullName = request.getFullName() != null && !request.getFullName().trim().isEmpty()
                    ? request.getFullName().trim()
                    : "Google User";
            avatarUrl = request.getAvatarUrl();
        }

        if (email == null || email.isEmpty()) {
            throw new BusinessValidationException("Email Google không được để trống", "GOOGLE_EMAIL_REQUIRED");
        }

        String normalizedEmail = email.trim().toLowerCase();
        Optional<User> existingUserOpt = userRepository.findByEmail(normalizedEmail);

        User user;
        if (existingUserOpt.isPresent()) {
            user = existingUserOpt.get();
            if (avatarUrl != null && (user.getAvatarUrl() == null || user.getAvatarUrl().isEmpty())) {
                user.setAvatarUrl(avatarUrl);
                user = userRepository.save(user);
            }
        } else {
            // Tự động đăng ký người dùng mới từ tài khoản Google
            String defaultName = (fullName != null && !fullName.isEmpty()) ? fullName : "Google User";
            String randomPassword = UUID.randomUUID().toString();
            user = new User(
                    normalizedEmail,
                    passwordEncoder.encode(randomPassword),
                    defaultName
            );
            if (avatarUrl != null) {
                user.setAvatarUrl(avatarUrl);
            }
            user = userRepository.save(user);

            // Tự động khởi tạo ví Tiền mặt (0đ) cho tài khoản Google mới
            Account defaultCashAccount = new Account(
                    user,
                    "Tiền mặt",
                    AccountType.CASH,
                    0L
            );
            accountRepository.save(defaultCashAccount);
        }

        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(token, UserResponse.from(user));
    }
}
