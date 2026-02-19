package com.quickcatalog.ondc.beckn.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BecknAck {
    private String status;

    public static BecknAck ack() {
        return new BecknAck("ACK");
    }

    public static BecknAck nack() {
        return new BecknAck("NACK");
    }
}
