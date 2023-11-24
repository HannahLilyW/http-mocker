package com.blakekhan.httpmocker.server.mock.config;

import java.util.Collections;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.logging.Logger;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.InvalidMediaTypeException;
import org.springframework.http.MediaType;

@NoArgsConstructor
@Data
public class MockedResponse implements Comparable<MockedResponse> {

  private String name; // Some identifier
  private int responseHttpCode; // Status code to return
  private Map<String, String> queryParameters = Collections.emptyMap(); // Query (request) params to match (must be exact match)
  private Map<String, String> requestHeaders = Collections.emptyMap(); // Headers to match
  private Map<String, String> responseHeaders = Collections.emptyMap(); // Headers to return
  private String body; // Body to return

  public Optional<HttpStatus> getResponseHttpStatus() {
    return Optional.ofNullable(HttpStatus.resolve(responseHttpCode));
  }

  public boolean doQueryParamsMatch(Map<String, String> input) {
    if (queryParameters.isEmpty() && input.isEmpty()) {
      return true;
    }

    return queryParameters.equals(input);
  }

  public boolean doHeadersMatch(Map<String, String> input) {
    for (Entry<String, String> entry : requestHeaders.entrySet()) {
      String val = input.getOrDefault(entry.getKey(), null);

      if (val == null && entry.getValue() != null) {
        return false;
      }

      if (entry.getValue() == null && val != null) {
        return false;
      }

      if (val != null && !val.equals(entry.getValue())) {
        return false;
      }
    }

    return true;
  }

  @Override
  public int compareTo(MockedResponse o) {
    int result = Integer.compare(o.getRequestHeaders().size(), requestHeaders.size());
    if (result == 0) {
      result = Integer.compare(o.getQueryParameters().size(), queryParameters.size());
    }
    return result;
  }
}
