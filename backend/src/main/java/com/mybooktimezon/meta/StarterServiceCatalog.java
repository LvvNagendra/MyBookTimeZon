package com.mybooktimezon.meta;

import com.mybooktimezon.domain.enums.BusinessType;
import com.mybooktimezon.web.dto.response.StarterServiceTemplateDto;
import java.util.ArrayList;
import java.util.List;

/** In-app suggestions only — not live data from any tenant. */
public final class StarterServiceCatalog {

    private StarterServiceCatalog() {}

    public static List<StarterServiceTemplateDto> forType(BusinessType type) {
        if (type == null) {
            type = BusinessType.OTHER;
        }
        return switch (type) {
            case SALON, BEAUTY -> salonPack();
            case SPA, WELLNESS -> spaPack();
            case FITNESS, GYM, COACHING -> fitnessPack();
            case CLINIC -> clinicPack();
            default -> genericPack();
        };
    }

    private static StarterServiceTemplateDto t(String name, String category, int mins, long pricePaise) {
        return StarterServiceTemplateDto.builder()
                .name(name)
                .category(category)
                .durationMinutes(mins)
                .priceCents(pricePaise)
                .build();
    }

    private static List<StarterServiceTemplateDto> salonPack() {
        List<StarterServiceTemplateDto> list = new ArrayList<>();
        list.add(t("Signature haircut", "Hair", 45, 49900));
        list.add(t("Beard trim & line-up", "Grooming", 30, 29900));
        list.add(t("Root touch-up colour", "Colour", 90, 350000));
        list.add(t("Classic facial", "Skin", 60, 149900));
        return list;
    }

    private static List<StarterServiceTemplateDto> spaPack() {
        List<StarterServiceTemplateDto> list = new ArrayList<>();
        list.add(t("Express facial", "Facial", 45, 129900));
        list.add(t("Swedish massage (60)", "Massage", 60, 199900));
        list.add(t("Manicure", "Nails", 45, 79900));
        return list;
    }

    private static List<StarterServiceTemplateDto> fitnessPack() {
        List<StarterServiceTemplateDto> list = new ArrayList<>();
        list.add(t("Personal training (1:1)", "Training", 60, 99900));
        list.add(t("Group HIIT", "Classes", 45, 49900));
        list.add(t("Nutrition consult", "Wellness", 30, 79900));
        return list;
    }

    private static List<StarterServiceTemplateDto> clinicPack() {
        List<StarterServiceTemplateDto> list = new ArrayList<>();
        list.add(t("General consultation", "Consult", 30, 59900));
        list.add(t("Follow-up visit", "Consult", 20, 39900));
        return list;
    }

    private static List<StarterServiceTemplateDto> genericPack() {
        List<StarterServiceTemplateDto> list = new ArrayList<>();
        list.add(t("Standard appointment", "General", 45, 79900));
        list.add(t("Quick service", "General", 30, 49900));
        return list;
    }
}
