package com.quickcatalog.entity;

import com.quickcatalog.entity.enums.GstRate;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.Immutable;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Data
@Entity
@Immutable
@Table(name = "hsn_master")
public class HsnMaster {

    @Id
    @Column(name = "code")
    private String code;

    @Column(name = "description")
    private String description;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "gst_rate", columnDefinition = "gst_rate")
    private GstRate gstRate;

    @Column(name = "chapter")
    private String chapter;
}
