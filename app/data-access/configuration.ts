import { database } from "~/db";
import {
  configuration,
  Configuration,
  configuration as configurationTable,
} from "~/db/schema";

const defaultConfiguration: Configuration = {
  name: "The Writing Platform",
  heading: "Stories That Inspire",
  subHeading:
    "Welcome to my corner of the internet where we explore life's beautiful moments, share meaningful stories, and find inspiration in everyday experiences.",
  about:
    "Hello! I'm Sarah, a passionate writer based in San Francisco with a love for crafting narratives that explore human connections and personal growth.",
  email: "hello@thewritingplatform.com",
  company: "The Writing Platform",
  id: 0,
};

export const getConfiguration = async () => {
  const configuration = await database.query.configuration.findFirst();
  if (!configuration) {
    const createdEntries = await database
      .insert(configurationTable)
      .values(defaultConfiguration)
      .returning();
    return createdEntries[0];
  }
  return configuration;
};

export const updateConfiguration = async (data: Partial<Configuration>) => {
  const [updated] = await database
    .update(configurationTable)
    .set(data)
    .returning();
  return updated;
};
