package com.blakekhan.httpmocker.server.mock.config;

import java.util.List;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpMethod;

@NoArgsConstructor
@Data
public class MockedEndpoint {

  private String endpoint; // e.g. /hello-world
  public String httpMethod; // e.g. GET
  private List<MockedResponse> responses;

  public HttpMethod getHttpMethod() {
    return HttpMethod.valueOf(httpMethod);
  }

}
