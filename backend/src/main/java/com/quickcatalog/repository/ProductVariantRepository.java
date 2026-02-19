package com.quickcatalog.repository;

import com.quickcatalog.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, UUID> {

    List<ProductVariant> findByProductIdOrderByCreatedAtAsc(UUID productId);

    Optional<ProductVariant> findByIdAndProductId(UUID id, UUID productId);

    long countByProductId(UUID productId);

    void deleteByIdAndProductId(UUID id, UUID productId);
}
