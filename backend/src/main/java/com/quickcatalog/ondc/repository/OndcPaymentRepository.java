package com.quickcatalog.ondc.repository;

import com.quickcatalog.ondc.entity.OndcPayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OndcPaymentRepository extends JpaRepository<OndcPayment, UUID> {

    List<OndcPayment> findByOndcOrderId(UUID ondcOrderId);

    Optional<OndcPayment> findFirstByOndcOrderId(UUID ondcOrderId);
}
