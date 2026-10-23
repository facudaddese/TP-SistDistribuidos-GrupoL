package com.unla.grupol.rentar.rentar_dssd.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración central de RabbitMQ para Spring Boot.
 * Declara el TopicExchange principal y la serialización JSON universal
 * para interoperabilidad con los microservicios en Node.js/TypeScript.
 */
@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_NAME = "rentar.topic.exchange";

    @Value("${rentar.rabbitmq.exchange:" + EXCHANGE_NAME + "}")
    private String topicExchangeName;

    /**
     * Declara el TopicExchange principal como durable (persiste ante reinicios del
     * broker).
     */
    @Bean
    public TopicExchange topicExchange() {
        return new TopicExchange(topicExchangeName, true, false);
    }

    /**
     * Configura el convertidor de mensajes a formato JSON usando Jackson.
     * Incluye soporte para tipos de fecha/hora de Java 8+ (ISO-8601) como
     * LocalDateTime.
     */
    @Bean
    public MessageConverter jsonMessageConverter() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return new Jackson2JsonMessageConverter(objectMapper);
    }

    /**
     * Configura RabbitTemplate asignándole el convertidor JSON.
     * Esto garantiza que cualquier DTO enviado con template.convertAndSend()
     * viaje automáticamente como payload JSON legible para los servicios satélite.
     */
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter jsonMessageConverter) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(jsonMessageConverter);
        rabbitTemplate.setMandatory(true); // Permite rastrear mensajes no enrutables
        return rabbitTemplate;
    }
}
