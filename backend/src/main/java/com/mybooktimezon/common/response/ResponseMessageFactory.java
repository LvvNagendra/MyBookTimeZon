package com.mybooktimezon.common.response;

import java.util.List;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class ResponseMessageFactory {

    public static <T> ResponseMessage<T> success(HttpStatus status, String message, T data) {
        return new ResponseMessage<T>()
                .setStatus(status)
                .setResponseMessage(message)
                .setData(data);
    }

    public static <T> ResponseMessage<T> success(HttpStatus status, String message, T data, int count) {
        return success(status, message, data).setCount(count);
    }

    public static ResponseMessage<Void> success(HttpStatus status, String message) {
        return new ResponseMessage<Void>().setStatus(status).setResponseMessage(message);
    }

    public static ResponseMessage<Void> error(HttpStatus status, String message) {
        return new ResponseMessage<Void>().setStatus(status).setResponseMessage(message);
    }

    public static ResponseMessage<Void> error(HttpStatus status, String message, String send) {
        return error(status, message).setSend(send);
    }

    public static <T> ResponseMessage<T> withList(HttpStatus status, String message, List<?> list, int count) {
        return new ResponseMessage<T>()
                .setStatus(status)
                .setResponseMessage(message)
                .setList(list)
                .setCount(count);
    }
}
