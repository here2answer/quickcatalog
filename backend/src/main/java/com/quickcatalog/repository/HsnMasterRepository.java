package com.quickcatalog.repository;

import com.quickcatalog.entity.HsnMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface HsnMasterRepository extends JpaRepository<HsnMaster, String> {

    @Query(value = """
            SELECT * FROM hsn_master
            WHERE description ILIKE '%' || :query || '%'
               OR code LIKE :query || '%'
            ORDER BY CASE WHEN code LIKE :query || '%' THEN 0 ELSE 1 END, code
            LIMIT 20
            """, nativeQuery = true)
    List<HsnMaster> searchHsn(@Param("query") String query);
}
