import type { WPCLICommandInput } from "@/types/wpcli";
import { coreCommands } from "./core";
import { pluginCommands, themeCommands } from "./plugins-themes";
import { databaseCommands, migrationCommands } from "./database-migrations";
import {
  userCommands,
  roleCommands,
  postCommands,
  commentCommands,
  termCommands,
} from "./content";
import {
  mediaCommands,
  cacheCommands,
  configCommands,
  maintenanceCommands,
} from "./ops";
import {
  multisiteCommands,
  scaffoldCommands,
  packageCommands,
  languageCommands,
  exportCommands,
} from "./advanced";
import { wooCommands } from "./woocommerce";

export const defaultCommands: WPCLICommandInput[] = [
  ...coreCommands,
  ...pluginCommands,
  ...themeCommands,
  ...databaseCommands,
  ...migrationCommands,
  ...userCommands,
  ...roleCommands,
  ...postCommands,
  ...commentCommands,
  ...termCommands,
  ...mediaCommands,
  ...cacheCommands,
  ...configCommands,
  ...maintenanceCommands,
  ...multisiteCommands,
  ...scaffoldCommands,
  ...packageCommands,
  ...languageCommands,
  ...exportCommands,
  ...wooCommands,
];
