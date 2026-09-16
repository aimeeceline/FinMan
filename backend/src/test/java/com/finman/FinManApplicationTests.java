package com.finman;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.sql.DataSource;
import java.sql.Connection;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class FinManApplicationTests {

    @Autowired
    private DataSource dataSource;

    @Test
    void contextLoadsAndDatabaseConnects() throws Exception {
        assertNotNull(dataSource, "DataSource must not be null");
        try (Connection connection = dataSource.getConnection()) {
            assertNotNull(connection, "Database connection must not be null");
            assertTrue(connection.isValid(2), "Database connection must be valid");
        }
    }
}
