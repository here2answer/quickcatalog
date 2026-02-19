package com.quickcatalog.ondc.beckn.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Location {

    private String id;
    private String gps;
    private Address address;
    private LocationTime time;

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class LocationTime {
        private String label;
        private String timestamp;
        private String days;
        private Schedule schedule;
        private TimeRange range;
    }

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Schedule {
        private List<String> holidays;
    }

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class TimeRange {
        private String start;
        private String end;
    }
}
