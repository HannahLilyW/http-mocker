package com.blakekhan.httpmocker.server.mock.config;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;

public class MockedEndpointsTest {

  @Test
  public void testFromInputStreamReader() throws IOException {
    File endpointsFile = new File("src/test/resources/endpoints.json");
    InputStreamReader reader = new InputStreamReader(new FileInputStream(endpointsFile));
    List<MockedEndpoint> list = MockedEndpoints.fromInputStreamReader(reader);

    Assertions.assertEquals(3, list.size());
    List<MockedResponse> responses = list.get(0).getResponses();

    Assertions.assertEquals("/hello-world", list.get(0).getEndpoint());
    Assertions.assertEquals(HttpMethod.GET, list.get(0).getHttpMethod());

    Assertions.assertEquals("Match no query or header", responses.get(0).getName());
    Assertions.assertEquals(200, responses.get(0).getResponseHttpCode());
    Assertions.assertTrue(responses.get(0).getQueryParameters().isEmpty());
    Assertions.assertTrue(responses.get(0).getRequestHeaders().isEmpty());
    Assertions.assertEquals("Response 1", responses.get(0).getResponseHeaders().get("response-name"));
    Assertions.assertEquals("{\"text\": \"this is a sample response body 1\"}", responses.get(0).getBody());

    Assertions.assertEquals("Only Query Param Match", responses.get(1).getName());
    Assertions.assertEquals(200, responses.get(1).getResponseHttpCode());
    Assertions.assertEquals("bob", responses.get(1).getQueryParameters().get("name"));
    Assertions.assertTrue(responses.get(1).getRequestHeaders().isEmpty());
    Assertions.assertEquals("Response 2", responses.get(1).getResponseHeaders().get("response-name"));
    Assertions.assertEquals("{\"text\": \"this is a sample response body 2\"}", responses.get(1).getBody());

    Assertions.assertEquals("Only Header Match", responses.get(2).getName());
    Assertions.assertEquals(200, responses.get(2).getResponseHttpCode());
    Assertions.assertEquals("abc", responses.get(2).getRequestHeaders().get("match-me"));
    Assertions.assertTrue(responses.get(2).getQueryParameters().isEmpty());
    Assertions.assertEquals("Response 3", responses.get(2).getResponseHeaders().get("response-name"));
    Assertions.assertEquals("{\"text\": \"this is a sample response body 3\"}", responses.get(2).getBody());

    Assertions.assertEquals("Both Query and Header Match", responses.get(3).getName());
    Assertions.assertEquals(200, responses.get(3).getResponseHttpCode());
    Assertions.assertEquals("abc", responses.get(3).getRequestHeaders().get("match-me"));
    Assertions.assertEquals("bob", responses.get(1).getQueryParameters().get("name"));
    Assertions.assertEquals("Response 4", responses.get(3).getResponseHeaders().get("response-name"));
    Assertions.assertEquals("{\"text\": \"this is a sample response body 4\"}", responses.get(3).getBody());
  }

}
