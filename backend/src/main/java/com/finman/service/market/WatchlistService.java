package com.finman.service.market;

import com.finman.dto.request.WatchlistAddRequest;
import com.finman.dto.request.WatchlistUpdateRequest;
import com.finman.dto.response.UserWatchlistResponse;
import com.finman.entity.StockSymbol;
import com.finman.entity.User;
import com.finman.entity.UserWatchlist;
import com.finman.exception.ResourceNotFoundException;
import com.finman.repository.StockSymbolRepository;
import com.finman.repository.UserRepository;
import com.finman.repository.UserWatchlistRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class WatchlistService {

    private static final Logger log = LoggerFactory.getLogger(WatchlistService.class);

    private final UserWatchlistRepository userWatchlistRepository;
    private final StockSymbolRepository stockSymbolRepository;
    private final UserRepository userRepository;

    public WatchlistService(
            UserWatchlistRepository userWatchlistRepository,
            StockSymbolRepository stockSymbolRepository,
            UserRepository userRepository
    ) {
        this.userWatchlistRepository = userWatchlistRepository;
        this.stockSymbolRepository = stockSymbolRepository;
        this.userRepository = userRepository;
    }

    /**
     * Lấy danh sách theo dõi của người dùng.
     */
    @Transactional(readOnly = true)
    public List<UserWatchlistResponse> getUserWatchlist(Long userId) {
        return userWatchlistRepository.findByUserIdOrderByDisplayOrderAscCreatedAtDesc(userId)
                .stream()
                .map(UserWatchlistResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Thêm một mã cổ phiếu vào danh sách theo dõi.
     */
    @Transactional
    public UserWatchlistResponse addToWatchlist(Long userId, WatchlistAddRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", userId));

        StockSymbol stock = stockSymbolRepository.findBySymbolIgnoreCase(request.getSymbol().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mã cổ phiếu: " + request.getSymbol()));

        if (userWatchlistRepository.existsByUserIdAndStockSymbolId(userId, stock.getId())) {
            throw new IllegalArgumentException("Mã cổ phiếu " + stock.getSymbol() + " đã có trong danh sách theo dõi của bạn.");
        }

        int maxOrder = (int) userWatchlistRepository.countByUserId(userId);

        UserWatchlist watchlist = new UserWatchlist();
        watchlist.setUser(user);
        watchlist.setStockSymbol(stock);
        watchlist.setNote(request.getNote());
        watchlist.setTargetPrice(request.getTargetPrice());
        watchlist.setAlertEnabled(request.getAlertEnabled() != null && request.getAlertEnabled());
        watchlist.setDisplayOrder(maxOrder + 1);

        UserWatchlist saved = userWatchlistRepository.save(watchlist);
        log.info("User {} đã thêm mã {} vào watchlist (ID={})", userId, stock.getSymbol(), saved.getId());
        return UserWatchlistResponse.fromEntity(saved);
    }

    /**
     * Cập nhật thông tin ghi chú, giá mục tiêu của mã theo dõi.
     */
    @Transactional
    public UserWatchlistResponse updateWatchlistItem(Long userId, Long watchlistId, WatchlistUpdateRequest request) {
        UserWatchlist watchlist = userWatchlistRepository.findById(watchlistId)
                .orElseThrow(() -> new ResourceNotFoundException("Mục theo dõi không tồn tại (ID=" + watchlistId + ")"));

        if (!watchlist.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Bạn không có quyền chỉnh sửa mục theo dõi này.");
        }

        if (request.getNote() != null) watchlist.setNote(request.getNote());
        if (request.getTargetPrice() != null) watchlist.setTargetPrice(request.getTargetPrice());
        if (request.getAlertEnabled() != null) watchlist.setAlertEnabled(request.getAlertEnabled());
        if (request.getDisplayOrder() != null) watchlist.setDisplayOrder(request.getDisplayOrder());

        UserWatchlist updated = userWatchlistRepository.save(watchlist);
        return UserWatchlistResponse.fromEntity(updated);
    }

    /**
     * Xóa một mã cổ phiếu khỏi danh sách theo dõi (hỗ trợ xóa theo ID hoặc theo Mã symbol).
     */
    @Transactional
    public void removeFromWatchlist(Long userId, String symbolOrId) {
        try {
            Long watchlistId = Long.parseLong(symbolOrId);
            UserWatchlist watchlist = userWatchlistRepository.findById(watchlistId).orElse(null);
            if (watchlist != null) {
                if (!watchlist.getUser().getId().equals(userId)) {
                    throw new AccessDeniedException("Bạn không có quyền xóa mục theo dõi này.");
                }
                userWatchlistRepository.delete(watchlist);
                log.info("User {} đã xóa mục watchlist ID={}", userId, watchlistId);
                return;
            }
        } catch (NumberFormatException ignored) {
            // Không phải ID số nguyên, xử lý theo Symbol bên dưới
        }

        StockSymbol stock = stockSymbolRepository.findBySymbolIgnoreCase(symbolOrId.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mã cổ phiếu: " + symbolOrId));

        if (userWatchlistRepository.existsByUserIdAndStockSymbolId(userId, stock.getId())) {
            userWatchlistRepository.deleteByUserIdAndStockSymbolId(userId, stock.getId());
            log.info("User {} đã xóa mã {} khỏi watchlist", userId, stock.getSymbol());
        }
    }
}

