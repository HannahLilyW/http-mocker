package com.blakekhan.httpmocker.server.mock.service;

import com.blakekhan.httpmocker.server.mock.config.MockedEndpoint;
import com.blakekhan.httpmocker.server.mock.config.MockedEndpoints;
import com.blakekhan.httpmocker.server.mock.config.MockedResponse;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.logging.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class MockConfigService {

  private static final Logger LOGGER = Logger.getLogger(MockConfigService.class.getName());

  private final File mockedEndpointsFile;
  private final List<MockedEndpoint> endpoints;

  public MockConfigService(@Autowired File mockedEndpointsFile) {
    this.mockedEndpointsFile = mockedEndpointsFile;
    this.endpoints = new ArrayList<>();
    try {
      loadFile();
    } catch (FileNotFoundException ignored) {
    }
  }

  private void loadFile() throws FileNotFoundException {
    if (!mockedEndpointsFile.exists()) {
      LOGGER.severe(String.format("Mocked endpoints file at %s does not exist!", mockedEndpointsFile.getAbsolutePath()));
      System.exit(-1);
    }

    this.endpoints.addAll(MockedEndpoints.fromInputStreamReader(new InputStreamReader(new FileInputStream(mockedEndpointsFile))));
    LOGGER.info(String.format("Loaded %s mocked endpoints.", endpoints.size()));
    for (MockedEndpoint endpoint : endpoints) {
      LOGGER.info(String.format("Endpoint %s %s has %d configured responses.", endpoint.getHttpMethod().name(), endpoint.getEndpoint(), endpoint.getResponses().size()));
    }
  }

  private Optional<MockedEndpoint> getMockedEndpointFor(String path, String httpMethod) {
    return endpoints.stream()
        .filter(e -> e.getEndpoint().equalsIgnoreCase(path) && e.getHttpMethod().matches(httpMethod))
        .findFirst();
  }

  public Optional<MockedResponse> getMockedResponseFor(String path, String httpMethod, Map<String, String> requestHeaders, Map<String, String> requestParams) {
    Optional<MockedEndpoint> optionalEndpoint = getMockedEndpointFor(path, httpMethod);

    LOGGER.info(String.format("Finding response for endpoint %s, headers %s, params %s.", path, requestHeaders, requestParams));

    if (optionalEndpoint.isEmpty()) {
      return Optional.empty();
    }

    MockedEndpoint endpoint = optionalEndpoint.get();
    return endpoint.getResponses().stream()
        .sorted()
        .filter(resp -> resp.doQueryParamsMatch(requestParams))
        .filter(resp -> resp.doHeadersMatch(requestHeaders))
        .findFirst();
  }

}
