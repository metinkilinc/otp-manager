package com.otpmanager.client;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;

/**
 * Spring Boot Auto-Configuration class for registering <see cref="OtpManagerClient"/> bean automatically.
 */
@AutoConfiguration
@EnableConfigurationProperties(OtpManagerProperties.class)
public class OtpManagerAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public OtpManagerClient otpManagerClient(OtpManagerProperties properties) {
        return new OtpManagerClient(properties);
    }
}
