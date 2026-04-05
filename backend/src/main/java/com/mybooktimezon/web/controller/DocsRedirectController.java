package com.mybooktimezon.web.controller;

import com.mybooktimezon.config.ApiConstants;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.servlet.view.RedirectView;

/**
 * Swagger UI lives at the server root ({@code /swagger-ui.html}), not under {@code /api/v1}. These redirects fix
 * common mistaken URLs.
 */
@Controller
public class DocsRedirectController {

    @GetMapping(ApiConstants.API_V1_PREFIX + "/docs")
    public RedirectView redirectApiDocs() {
        return new RedirectView("/swagger-ui.html", true, false);
    }

    @GetMapping(ApiConstants.API_V1_PREFIX + "/swagger-ui.html")
    public RedirectView redirectApiSwaggerUiHtml() {
        return new RedirectView("/swagger-ui.html", true, false);
    }

    @GetMapping(ApiConstants.API_V1_PREFIX + "/swagger-ui")
    public RedirectView redirectApiSwaggerUiRoot() {
        return new RedirectView("/swagger-ui.html", true, false);
    }

    @GetMapping(ApiConstants.API_V1_PREFIX + "/swagger-ui/{*remaining}")
    public RedirectView redirectApiSwaggerUiNested(@PathVariable String remaining) {
        return new RedirectView("/swagger-ui/" + remaining, true, false);
    }
}
