package com.quickcatalog.ondc.repository;

import com.quickcatalog.ondc.entity.OndcFulfillment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OndcFulfillmentRepository extends JpaRepository<OndcFulfillment, UUID> {

    List<OndcFulfillment> findByOndcOrderId(UUID ondcOrderId);

    Optional<OndcFulfillment> findFirstByOndcOrderId(UUID ondcOrderId);
}
