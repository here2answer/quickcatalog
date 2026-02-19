package com.quickcatalog.dto.common;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PagedResponse<T> {
    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean last;

    public static <T> PagedResponse<T> of(List<T> content, int page, int size, long totalElements, int totalPages) {
        return new PagedResponse<>(content, page, size, totalElements, totalPages, page >= totalPages - 1);
    }
}
