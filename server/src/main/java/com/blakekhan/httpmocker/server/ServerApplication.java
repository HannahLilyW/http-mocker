package com.blakekhan.httpmocker.server;

import com.blakekhan.httpmocker.server.mock.service.MockConfigService;
import java.io.File;
import java.util.logging.Logger;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@SpringBootApplication
@Configuration
public class ServerApplication implements ApplicationRunner {

	private static final Logger LOGGER = Logger.getLogger(ServerApplication.class.getName());

	private static final String ARG_DISCOVER_MODE = "mode_discover";
	private static final String ARG_NAME_TARGET_HOST = "target_host";
	private static final String ARG_NAME_TARGET_PORT = "target_port";
	private static final String ARG_MOCK_CONFIG_LOCATION = "mock_config_file"; // full path including filename

	public static void main(String[] args) {
		SpringApplication.run(ServerApplication.class, args);
	}

	@Override
	public void run(ApplicationArguments args) throws Exception {
		if (args.containsOption(ARG_DISCOVER_MODE)) {
			if (!args.containsOption(ARG_NAME_TARGET_HOST) || !args.containsOption(ARG_NAME_TARGET_PORT)) {
				LOGGER.severe("Must run with parameters %s and %s for discover mode".formatted(ARG_NAME_TARGET_HOST, ARG_NAME_TARGET_PORT));
				System.exit(-1);
			}

			LOGGER.info("Configured target host: %s".formatted(targetHost(args)));
			LOGGER.info("Configured target port: %d".formatted(targetPort(args)));
		} else {
			if (!args.containsOption(ARG_MOCK_CONFIG_LOCATION)) {
				LOGGER.severe("Must run with parameter %s or use %s for discover mode.".formatted(ARG_MOCK_CONFIG_LOCATION, ARG_DISCOVER_MODE));
				System.exit(-1);
			}
			LOGGER.info("Running in mock mode.");
		}
	}

	@Bean
	public String targetHost(ApplicationArguments args) {
		if (args.getOptionValues(ARG_NAME_TARGET_HOST) == null) {
			return "";
		}
		return args.getOptionValues(ARG_NAME_TARGET_HOST).get(0);
	}

	@Bean
	public int targetPort(ApplicationArguments args) {
		if (args.getOptionValues(ARG_NAME_TARGET_PORT) == null) {
			return -1;
		}
		return Integer.parseInt(args.getOptionValues(ARG_NAME_TARGET_PORT).get(0));
	}

	@Bean
	public File mockedEndpointsFile(ApplicationArguments args) {
		return new File(args.getOptionValues(ARG_MOCK_CONFIG_LOCATION).get(0));
	}

}
