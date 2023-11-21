package com.blakekhan.httpmocker.server.mock;

import com.blakekhan.httpmocker.server.mock.config.MockedResponse;
import com.blakekhan.httpmocker.server.mock.service.MockConfigService;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MockController {

  private final MockConfigService mockConfigService;

  public MockController(@Autowired MockConfigService mockConfigService) {
    this.mockConfigService = mockConfigService;
  }

  @RequestMapping(value = "/{*endpoint}")
  public ResponseEntity<String> handle(@PathVariable String endpoint, @RequestHeader Map<String, String> headers, @RequestParam Map<String,String> requestParams) {
    Optional<MockedResponse> optionalResponse = mockConfigService.getMockedResponseFor(endpoint, headers, requestParams);
    if (optionalResponse.isEmpty()) {
      return new ResponseEntity<>("No configured mocked response fits this request.", HttpStatus.NOT_FOUND);
    }

    MockedResponse mockedResponse = optionalResponse.get();
    ResponseEntity.BodyBuilder builder = ResponseEntity.status(mockedResponse.getResponseHttpStatus().get());
    mockedResponse.getResponseHeaders().forEach(builder::header);
    return builder.body(mockedResponse.getBody());
  }

}
