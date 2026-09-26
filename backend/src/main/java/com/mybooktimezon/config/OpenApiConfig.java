package com.mybooktimezon.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    public static final String BEARER_AUTH = "bearerAuth";

    @Bean
    public OpenAPI myBookTimeZonOpenApi() {
        return new OpenAPI()
                .info(
                        new Info()
                                .title("MyBookTimeZon API")
                                .version("v1")
                                .description(
                                        "Appointment booking SaaS for clinics, salons, and fitness businesses. "
                                                + "**Swagger UI (correct URL):** `http://localhost:8080/swagger-ui.html` "
                                                + "or `http://localhost:8080/api/v1/docs` (redirect). "
                                                + "Do not use `/api/v1/swagger-ui/...` — that path is not the UI. "
                                                + "Platform super admin is seeded by Flyway Java migration `db.migration.V1__Bootstrap_users_and_super_admin`. "
                                                + "Use **Authorize** with JWT from login/register. "
                                                + "Public: `GET /clinics/slug/{slug}`.")
                                .contact(new Contact().name("MyBookTimeZon").email("support@example.com")))
                .components(
                        new Components()
                                .addSecuritySchemes(
                                        BEARER_AUTH,
                                        new SecurityScheme()
                                                .name(BEARER_AUTH)
                                                .type(SecurityScheme.Type.HTTP)
                                                .scheme("bearer")
                                                .bearerFormat("JWT")
                                                .description(
                                                        "Paste only the token value from `POST /auth/login` or "
                                                                + "`POST /auth/register` response (`data.accessToken`).")));
    }
}
