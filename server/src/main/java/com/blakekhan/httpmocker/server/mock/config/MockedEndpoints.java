package com.blakekhan.httpmocker.server.mock.config;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import java.io.InputStreamReader;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;

public class MockedEndpoints {

  private static final Gson GSON = new Gson();

  public static List<MockedEndpoint> fromInputStreamReader(InputStreamReader isr) {
    Type listType = new TypeToken<ArrayList<MockedEndpoint>>(){}.getType();
    return GSON.fromJson(isr, listType);
  }

}
