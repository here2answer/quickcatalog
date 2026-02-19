package com.quickcatalog.ondc.repository;

import com.quickcatalog.ondc.entity.OndcOrder;
import com.quickcatalog.ondc.entity.enums.OndcOrderState;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OndcOrderRepository extends JpaRepository<OndcOrder, UUID> {

    Optional<OndcOrder> findByBecknOrderId(String becknOrderId);

    Optional<OndcOrder> findByBecknOrderIdAndTenantId(String becknOrderId, UUID tenantId);

    List<OndcOrder> findByTenantIdAndState(UUID tenantId, OndcOrderState state);

    List<OndcOrder> findByOndcProviderId(UUID ondcProviderId);

    Page<OndcOrder> findByTenantIdOrderByCreatedAtDesc(UUID tenantId, Pageable pageable);

    Page<OndcOrder> findByTenantIdAndStateOrderByCreatedAtDesc(UUID tenantId, OndcOrderState state, Pageable pageable);

    Optional<OndcOrder> findByIdAndTenantId(UUID id, UUID tenantId);

    @Query("SELECT o FROM OndcOrder o LEFT JOIN FETCH o.orderItems WHERE o.id = :id AND o.tenantId = :tenantId")
    Optional<OndcOrder> findByIdAndTenantIdWithItems(@Param("id") UUID id, @Param("tenantId") UUID tenantId);
}
