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
    const configurationString = import.meta.env.VITE_CONFIGURATION;
    if (!configurationString) {
      return defaultConfiguration;
    }

    const decodedConfig = atob(configurationString);
    const config = JSON.parse(decodedConfig);

    // Validate that all required fields are present
    const missingFields = [];
    if (!config.name) missingFields.push("name");
    if (!config.description) missingFields.push("description");
    if (!config.company) missingFields.push("company");
    if (!config.email) missingFields.push("email");

    if (missingFields.length > 0) {
      console.warn(
        `Invalid configuration: missing required fields [${missingFields.join(", ")}], using defaults`
      );
      return defaultConfiguration;
    }
    return config;
  } catch (error) {
    console.warn("Failed to parse configuration:", error);
    return defaultConfiguration;
  }
})();
