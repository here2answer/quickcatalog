package com.quickcatalog.ondc.beckn.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BecknResponse {

    private BecknContext context;
    private ResponseMessage message;
    private BecknError error;

    @Data
    public static class ResponseMessage {
        private BecknAck ack;
    }

    public static BecknResponse ack(BecknContext context) {
        BecknResponse response = new BecknResponse();
        response.setContext(context);
        ResponseMessage msg = new ResponseMessage();
        msg.setAck(BecknAck.ack());
        response.setMessage(msg);
        return response;
    }

    public static BecknResponse nack(BecknContext context, BecknError error) {
        BecknResponse response = new BecknResponse();
        response.setContext(context);
        ResponseMessage msg = new ResponseMessage();
        msg.setAck(BecknAck.nack());
        response.setMessage(msg);
        response.setError(error);
        return response;
    }
}
