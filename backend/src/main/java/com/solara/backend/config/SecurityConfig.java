package com.solara.backend.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {    

    private final JwtAuthFilter jwtAuthFilter;
    private final AuthenticationProvider authProvider;
    private final AuthenticationEntryPoint unauthorizedHandler = (request, response, authException) ->
            response.sendError(401, "Unauthorized");

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        // Use this handler so that Angular/React/Swagger can submit the cookie correctly 
        CsrfTokenRequestAttributeHandler requestHandler = new CsrfTokenRequestAttributeHandler();
        // Set the name of the attribute the CsrfToken will be populated on
        requestHandler.setCsrfRequestAttributeName(null);

        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
            .csrfTokenRequestHandler(requestHandler)
            .ignoringRequestMatchers(request -> {
                // Ignore CSRF for mobile/stateless clients using Bearer tokens
                String authHeader = request.getHeader("Authorization");
                return authHeader != null && authHeader.startsWith("Bearer ");
            })
            .ignoringRequestMatchers(
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/v1/auth/refresh",
            "/api/v1/auth/verify/**"
            )) // Disable CSRF for auth endpoints, enable for others
            .authorizeHttpRequests(
                auth -> auth
                    .requestMatchers(
                        "/v3/api-docs/**", 
                        "/swagger-ui/**", 
                        "/swagger-ui.html",
                        "/api/v1/auth/**",
                        "/api/v1/crop-guides/get-all-guides",
                        "/api/v1/crop-guides/get-guide/**",
                        "/api/v1/crop-guides/names-and-ids"
                    ).permitAll()

                    .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex.authenticationEntryPoint(unauthorizedHandler))
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authenticationProvider(authProvider)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Allow local development and production domains.
        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "https://solaraapp.com.tr",
                "https://www.solaraapp.com.tr"
        ));

        // Essential for JWTs and standard REST actions
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        // Allow headers required by cookie-based auth + CSRF protection
        configuration.setAllowedHeaders(Arrays.asList(
                "Authorization",
                "Content-Type",
                "Accept",
                "X-Requested-With",
                "X-XSRF-TOKEN",
                "X-CSRF-TOKEN"
        ));

        // Allow the browser to send cookies or auth headers
        configuration.setAllowCredentials(true);

        configuration.setExposedHeaders(Arrays.asList("Content-Disposition"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}