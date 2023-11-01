package com.blakekhan.httpmocker.server.proxy;

import com.blakekhan.httpmocker.server.discover.DiscoverController;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Enumeration;
import java.util.Objects;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.BufferingClientHttpRequestFactory;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class ProxyService {

  private final static Logger LOGGER = Logger.getLogger(ProxyService.class.getName());

  private final String targetDomain;
  private final int targetPort;

  @Autowired
  public ProxyService(String targetDomain, int targetPort) {
    this.targetDomain = targetDomain;
    this.targetPort = targetPort;
  }

  public ResponseEntity<String> processProxyRequest(String body, HttpMethod method,
      HttpServletRequest request) throws URISyntaxException {
    String requestUrl = request.getRequestURI().replaceFirst(DiscoverController.ENDPOINT_DISCOVER, "");

    URI uri = new URI("https", null, targetDomain, targetPort, null, null, null);
    uri = UriComponentsBuilder.fromUri(uri)
        .path(requestUrl)
        .query(request.getQueryString())
        .build(true).toUri();

    LOGGER.info("Sending request to %s".formatted(uri));

    HttpHeaders headers = new HttpHeaders();
    Enumeration<String> headerNames = request.getHeaderNames();

    // Set headers
    while (headerNames.hasMoreElements()) {
      String headerName = headerNames.nextElement();
      headers.set(headerName, request.getHeader(headerName));
    }

    headers.remove(HttpHeaders.ACCEPT_ENCODING);

    HttpEntity<String> httpEntity = new HttpEntity<>(body, headers);
    ClientHttpRequestFactory factory = new BufferingClientHttpRequestFactory(
        new SimpleClientHttpRequestFactory());
    RestTemplate restTemplate = new RestTemplate(factory);

    try {
      ResponseEntity<String> serverResponse = restTemplate.exchange(uri, method, httpEntity,
          String.class);
      HttpHeaders responseHeaders = new HttpHeaders();
      responseHeaders.put(HttpHeaders.CONTENT_TYPE,
          Objects.requireNonNull(serverResponse.getHeaders().get(HttpHeaders.CONTENT_TYPE)));
      LOGGER.info("HEADERS: " + responseHeaders);
      LOGGER.info("BODY: " + serverResponse.getBody());
      return serverResponse;
    } catch (HttpStatusCodeException e) {
      LOGGER.log(Level.SEVERE, e.getMessage());
      return ResponseEntity.status(e.getStatusCode().value())
          .headers(e.getResponseHeaders())
          .body(e.getResponseBodyAsString());
    }
  }

}
