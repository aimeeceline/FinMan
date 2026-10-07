package com.finman;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FinManApplication {

    public static void main(String[] args) {
        SpringApplication.run(FinManApplication.class, args);
    }
}
