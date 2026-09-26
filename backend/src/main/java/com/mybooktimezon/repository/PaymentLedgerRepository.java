package com.mybooktimezon.repository;

import com.mybooktimezon.domain.entity.PaymentLedger;
import com.mybooktimezon.domain.enums.LedgerPaymentPurpose;
import com.mybooktimezon.domain.enums.PaymentStatus;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentLedgerRepository extends JpaRepository<PaymentLedger, UUID> {

    long countByPurposeAndStatus(LedgerPaymentPurpose purpose, PaymentStatus status);
}
