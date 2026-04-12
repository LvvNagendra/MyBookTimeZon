package com.mybooktimezon;

import com.mybooktimezon.config.BeautyCoachProperties;
import com.mybooktimezon.config.JwtProperties;
import com.mybooktimezon.config.NotificationProperties;
import com.mybooktimezon.config.RazorpayProperties;
import com.mybooktimezon.config.SaaSProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableJpaAuditing
@EnableScheduling
@EnableConfigurationProperties({
    JwtProperties.class,
    SaaSProperties.class,
    RazorpayProperties.class,
    BeautyCoachProperties.class,
    NotificationProperties.class
})
public class MyBookTimeZonApplication {

    public static void main(String[] args) {
        SpringApplication.run(MyBookTimeZonApplication.class, args);
    }
}
