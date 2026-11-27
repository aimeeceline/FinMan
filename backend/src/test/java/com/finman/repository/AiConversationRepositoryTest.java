package com.finman.repository;

import com.finman.entity.AiConversation;
import com.finman.entity.AiMessage;
import com.finman.entity.AiMessageSource;
import com.finman.entity.User;
import com.finman.entity.enums.AiMessageRole;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
public class AiConversationRepositoryTest {

    @Autowired
    private AiConversationRepository conversationRepository;

    @Autowired
    private AiMessageRepository messageRepository;

    @Autowired
    private AiMessageSourceRepository sourceRepository;

    @Autowired
    private UserRepository userRepository;

    private User createTestUser(String email) {
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash("hashed_secret_password");
        user.setFullName("Nguyen Van Test");
        return userRepository.save(user);
    }

    @Test
    @DisplayName("Kiểm tra lưu phiên hội thoại, tin nhắn và dẫn nguồn bài báo (Citations)")
    void testCreateConversationAndMessagesWithCitations() {
        User user = createTestUser("ai_user_test1@finman.com");

        AiConversation conv = new AiConversation(user, "Tư vấn phân bổ tài khoản lương");
        conv.setModelVersion("gemini-2.5-flash");

        AiMessage userMsg = new AiMessage(conv, AiMessageRole.USER, "Lương tháng này 30 triệu nên chia thế nào?");
        conv.addMessage(userMsg);

        AiMessage assistantMsg = new AiMessage(conv, AiMessageRole.ASSISTANT,
                "Theo quy tắc 50/30/20 [1], bạn nên dành 15 triệu cho chi tiêu thiết yếu và 6 triệu cho tích lũy.");
        assistantMsg.setTokensUsed(120);

        AiMessageSource source = new AiMessageSource(
                assistantMsg,
                1,
                "Quy tắc phân bổ 50/30/20 cải tiến cho tài chính cá nhân",
                "https://cafef.vn/tai-chinh-ca-nhan.chn",
                "CafeF"
        );
        source.setSnippet("Tách biệt dòng tiền chi tiêu và tích lũy giúp gia tăng tỷ lệ tiết kiệm.");
        source.setRelevanceScore(new BigDecimal("0.9250"));
        assistantMsg.addSource(source);

        conv.addMessage(assistantMsg);

        AiConversation saved = conversationRepository.save(conv);
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getMessages()).hasSize(2);

        // Kiểm tra truy vấn danh sách tin nhắn
        List<AiMessage> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(saved.getId());
        assertThat(messages).hasSize(2);
        assertThat(messages.get(0).getRole()).isEqualTo(AiMessageRole.USER);
        assertThat(messages.get(1).getRole()).isEqualTo(AiMessageRole.ASSISTANT);
        assertThat(messages.get(1).isHasCitations()).isTrue();

        // Kiểm tra truy vấn nguồn trích dẫn
        List<AiMessageSource> citations = sourceRepository.findByMessageIdOrderByCitationIndexAsc(messages.get(1).getId());
        assertThat(citations).hasSize(1);
        assertThat(citations.get(0).getCitationIndex()).isEqualTo(1);
        assertThat(citations.get(0).getSourceName()).isEqualTo("CafeF");
        assertThat(citations.get(0).getRelevanceScore()).isEqualByComparingTo("0.9250");
    }

    @Test
    @DisplayName("Kiểm tra phân quyền nghiêm ngặt cô lập dữ liệu theo user_id (Multi-tenant Security)")
    void testMultiTenantIsolation() {
        User userA = createTestUser("user_a@finman.com");
        User userB = createTestUser("user_b@finman.com");

        AiConversation convA = conversationRepository.save(new AiConversation(userA, "Hội thoại User A"));
        AiConversation convB = conversationRepository.save(new AiConversation(userB, "Hội thoại User B"));

        // User A chỉ thấy hội thoại của User A
        List<AiConversation> listA = conversationRepository.findByUserIdAndIsArchivedFalseOrderByIsPinnedDescUpdatedAtDesc(userA.getId());
        assertThat(listA).hasSize(1);
        assertThat(listA.get(0).getId()).isEqualTo(convA.getId());

        // User A không thể truy vấn hội thoại của User B
        Optional<AiConversation> crossUserCheck = conversationRepository.findByIdAndUserId(convB.getId(), userA.getId());
        assertThat(crossUserCheck).isEmpty();

        // Kiểm tra existsByIdAndUserId
        assertThat(conversationRepository.existsByIdAndUserId(convA.getId(), userA.getId())).isTrue();
        assertThat(conversationRepository.existsByIdAndUserId(convB.getId(), userA.getId())).isFalse();
    }

    @Test
    @DisplayName("Kiểm tra xóa tầng bậc (Cascade Delete) khi xóa cuộc trò chuyện")
    void testCascadeDeleteConversation() {
        User user = createTestUser("cascade_user@finman.com");

        AiConversation conv = new AiConversation(user, "Hội thoại cần xóa");
        AiMessage msg = new AiMessage(conv, AiMessageRole.USER, "Câu hỏi");
        AiMessageSource src = new AiMessageSource(msg, 1, "Tiêu đề nguồn", "https://vnexpress.net", "VnExpress");
        msg.addSource(src);
        conv.addMessage(msg);

        AiConversation saved = conversationRepository.save(conv);
        Long convId = saved.getId();
        Long msgId = saved.getMessages().get(0).getId();
        Long srcId = saved.getMessages().get(0).getSources().get(0).getId();

        assertThat(messageRepository.existsById(msgId)).isTrue();
        assertThat(sourceRepository.existsById(srcId)).isTrue();

        // Xóa cuộc trò chuyện
        conversationRepository.delete(saved);

        // Tin nhắn và nguồn trích dẫn phải tự động bị xóa theo (Cascade Delete)
        assertThat(conversationRepository.existsById(convId)).isFalse();
        assertThat(messageRepository.existsById(msgId)).isFalse();
        assertThat(sourceRepository.existsById(srcId)).isFalse();
    }
}

