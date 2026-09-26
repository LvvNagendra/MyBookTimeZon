package com.mybooktimezon.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class BeautyCoachClientConfig {

    @Bean
    public RestClient beautyCoachRestClient(BeautyCoachProperties properties) {
        String base = properties.getEffectiveBaseUrl();
        return RestClient.builder().baseUrl(base).build();
    }
}
