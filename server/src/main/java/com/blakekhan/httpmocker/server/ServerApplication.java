package com.blakekhan.httpmocker.server;

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

	private static final String ARG_NAME_TARGET_HOST = "target_host";
	private static final String ARG_NAME_TARGET_PORT = "target_port";

	public static void main(String[] args) {
		SpringApplication.run(ServerApplication.class, args);
	}

	@Override
	public void run(ApplicationArguments args) throws Exception {
		if (!args.containsOption(ARG_NAME_TARGET_HOST) || !args.containsOption(ARG_NAME_TARGET_PORT)) {
			LOGGER.severe("Must run with parameters %s and %s".formatted(ARG_NAME_TARGET_HOST, ARG_NAME_TARGET_PORT));
			System.exit(-1);
		}

		LOGGER.info("Configured target host: %s".formatted(targetHost(args)));
		LOGGER.info("Configured target port: %d".formatted(targetPort(args)));
	}

	@Bean
	public String targetHost(ApplicationArguments args) {
		return args.getOptionValues(ARG_NAME_TARGET_HOST).get(0);
	}

	@Bean
	public int targetPort(ApplicationArguments args) {
		return Integer.parseInt(args.getOptionValues(ARG_NAME_TARGET_PORT).get(0));
	}

}
