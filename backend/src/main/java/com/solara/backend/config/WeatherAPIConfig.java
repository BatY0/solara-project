package com.solara.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class WeatherAPIConfig { // You can rename this class to RestTemplateConfig if you want
    
    @Primary
    @Bean
    public RestTemplate defaultRestTemplate() {
        // Defaults to infinite timeout (or system default) - good for LLMs
        return new RestTemplate();     
    }

    @Bean
    public RestTemplate weatherRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();

        factory.setConnectTimeout(5000);
        factory.setReadTimeout(5000);

        return new RestTemplate(factory);
    }
    
    @Bean
    public RestTemplate chatbotRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        
        factory.setConnectTimeout(10000); // 10 seconds connection timeout
        factory.setReadTimeout(60000);    // 60 seconds read timeout for Gemini/LLMs
        
        return new RestTemplate(factory);
    }
}
