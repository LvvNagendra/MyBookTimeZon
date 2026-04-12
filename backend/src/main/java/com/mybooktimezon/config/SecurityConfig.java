package com.mybooktimezon.config;

import com.mybooktimezon.security.CustomUserDetailsService;
import com.mybooktimezon.security.JwtAuthenticationFilter;
import com.mybooktimezon.security.RestAccessDeniedHandler;
import com.mybooktimezon.security.RestAuthenticationEntryPoint;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RestAuthenticationEntryPoint restAuthenticationEntryPoint;
    private final RestAccessDeniedHandler restAccessDeniedHandler;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationProvider authenticationProvider(PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration)
            throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http, AuthenticationProvider authenticationProvider) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .cors(c -> c.configurationSource(corsConfigurationSource()))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(
                        ex ->
                                ex.authenticationEntryPoint(restAuthenticationEntryPoint)
                                        .accessDeniedHandler(restAccessDeniedHandler))
                .authorizeHttpRequests(
                        auth ->
                                auth.requestMatchers(
                                                "/v3/api-docs/**",
                                                "/swagger-ui/**",
                                                "/swagger-ui.html")
                                        .permitAll()
                                        .requestMatchers(
                                                ApiConstants.API_V1_PREFIX + "/docs",
                                                ApiConstants.API_V1_PREFIX + "/swagger-ui",
                                                ApiConstants.API_V1_PREFIX + "/swagger-ui.html",
                                                ApiConstants.API_V1_PREFIX + "/swagger-ui/**")
                                        .permitAll()
                                        .requestMatchers(HttpMethod.GET, ApiConstants.API_V1_PREFIX + "/auth/me")
                                        .authenticated()
                                        .requestMatchers(ApiConstants.API_V1_PREFIX + "/auth/**")
                                        .permitAll()
                                        .requestMatchers(ApiConstants.API_V1_PREFIX + "/health/**")
                                        .permitAll()
                                        .requestMatchers(HttpMethod.GET, ApiConstants.API_V1_PREFIX + "/meta/**")
                                        .permitAll()
                                        .requestMatchers("/ws/**")
                                        .permitAll()
                                        .requestMatchers(HttpMethod.GET, ApiConstants.API_V1_PREFIX + "/public/**")
                                        .permitAll()
                                        .requestMatchers(HttpMethod.POST, ApiConstants.API_V1_PREFIX + "/public/**")
                                        .permitAll()
                                        .requestMatchers(HttpMethod.POST, ApiConstants.API_V1_PREFIX + "/beauty-coach/**")
                                        .permitAll()
                                        .requestMatchers(HttpMethod.GET, ApiConstants.API_V1_PREFIX + "/clinics/slug/**")
                                        .permitAll()
                                        .requestMatchers("/h2-console/**")
                                        .permitAll()
                                        .anyRequest()
                                        .authenticated())
                .headers(h -> h.frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin))
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Dev: Vite may use 5173, 5174, etc.; Origin must match or browser gets 403 on API calls.
        configuration.setAllowedOriginPatterns(
                List.of("http://localhost:*", "http://127.0.0.1:*", "http://[::1]:*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
