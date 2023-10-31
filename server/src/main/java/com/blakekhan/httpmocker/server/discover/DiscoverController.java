package com.blakekhan.httpmocker.server.discover;

import com.blakekhan.httpmocker.server.proxy.ProxyService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.net.URISyntaxException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DiscoverController {

  public static final String ENDPOINT_DISCOVER = "/discover";

  private final ProxyService proxyService;

  public DiscoverController(@Autowired ProxyService proxyService) {
    this.proxyService = proxyService;
  }

  @RequestMapping(ENDPOINT_DISCOVER + "/**")
  public DiscoverResponse<String> handleRequest(@RequestBody(required = false) String body,
      HttpMethod method, HttpServletRequest request, HttpServletResponse response)
      throws URISyntaxException {
    ResponseEntity<String> proxyResponse = proxyService.processProxyRequest(body, method, request,
        response);
    DiscoverResponse<String> discoverResponse = new DiscoverResponse<>();
    discoverResponse.setHttpStatusCode(proxyResponse.getStatusCode().value());
    discoverResponse.setHeaders(proxyResponse.getHeaders().toSingleValueMap());
    discoverResponse.setBody(proxyResponse.getBody());
    return discoverResponse;
  }

}
