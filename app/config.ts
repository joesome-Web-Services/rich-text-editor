export type Configuration = {
  name: string;
  description: string;
  company: string;
  email: string;
};

const defaultConfiguration: Configuration = {
  name: "The Writing Platform",
  description: "A platform to write books for your fans.",
  company: "Company, LLC",
  email: "test@exampe.com",
};

export const configuration: Configuration = (() => {
  try {
    if (!process.env.VITE_CONFIGURATION) {
      return defaultConfiguration;
    }

    const decodedConfig = atob(process.env.VITE_CONFIGURATION);
    const config = JSON.parse(decodedConfig);

    // Validate that all required fields are present
    if (
      !config.name ||
      !config.description ||
      !config.company ||
      !config.email
    ) {
      console.warn(
        "Invalid configuration: missing required fields, using defaults"
      );
      return defaultConfiguration;
    }
    return config;
  } catch (error) {
    console.warn("Failed to parse configuration:", error);
    return defaultConfiguration;
  }
})();
