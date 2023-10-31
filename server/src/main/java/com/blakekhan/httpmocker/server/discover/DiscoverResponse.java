package com.blakekhan.httpmocker.server.discover;

import java.util.Map;
import lombok.Data;

@Data
public class DiscoverResponse<T> {

  private int httpStatusCode;
  private Map<String, String> headers;
  private T body;

}
