package com.quickcatalog.ondc.repository;

import com.quickcatalog.ondc.entity.OndcOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OndcOrderItemRepository extends JpaRepository<OndcOrderItem, UUID> {

    List<OndcOrderItem> findByOndcOrderId(UUID ondcOrderId);
}
