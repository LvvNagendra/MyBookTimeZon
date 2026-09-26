package com.mybooktimezon.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.io.Serializable;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;
import org.springframework.http.HttpStatus;

/**
 * Standard API envelope. Not a Spring bean — controllers construct instances per response.
 * (Avoid {@code @Component} on generic wrappers.)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
@JsonInclude(JsonInclude.Include.NON_DEFAULT)
public class ResponseMessage<T> implements Serializable {

    private static final long serialVersionUID = 1L;

    private HttpStatus status;
    private String responseMessage;
    private transient T data;
    private Integer count;
    private transient List<?> list;
    private String send;
}
