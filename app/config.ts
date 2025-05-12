export type Configuration = {
  name: string;
  description: string;
  company: string;
  email: string;
};

export const configuration: Configuration = process.env.VITE_CONFIGURATION
  ? JSON.parse(process.env.VITE_CONFIGURATION)
  : {
      name: "The Writing Platform",
      description: "A platform to write books for your fans.",
      company: "Company, LLC",
      email: "test@exampe.com",
    };
