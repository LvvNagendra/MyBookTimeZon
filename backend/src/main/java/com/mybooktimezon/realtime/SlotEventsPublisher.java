package com.mybooktimezon.realtime;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SlotEventsPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    /** Notify browsers on the public booking page to refresh availability. */
    public void publishSlotsChanged(UUID clinicId) {
        messagingTemplate.convertAndSend(
                "/topic/clinics/" + clinicId + "/slots",
                Map.of("type", "SLOTS_CHANGED", "at", Instant.now().toString()));
    }
}
