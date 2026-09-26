package com.mybooktimezon.meta;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Curated India states and major cities for UI dropdowns (offline, OSS-friendly). */
public final class IndiaGeoCatalog {

    private IndiaGeoCatalog() {}

    public static Map<String, List<String>> citiesByState() {
        Map<String, List<String>> m = new LinkedHashMap<>();
        m.put(
                "Karnataka",
                List.of("Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi", "Kalaburagi"));
        m.put("Maharashtra", List.of("Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Thane"));
        m.put("Telangana", List.of("Hyderabad", "Warangal", "Nizamabad", "Karimnagar"));
        m.put("Tamil Nadu", List.of("Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"));
        m.put("Kerala", List.of("Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur"));
        m.put("Delhi", List.of("New Delhi", "Dwarka", "Rohini"));
        m.put("Gujarat", List.of("Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"));
        m.put("West Bengal", List.of("Kolkata", "Howrah", "Durgapur", "Siliguri"));
        m.put("Uttar Pradesh", List.of("Lucknow", "Kanpur", "Varanasi", "Noida", "Ghaziabad", "Agra"));
        m.put("Rajasthan", List.of("Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer"));
        return m;
    }
}
