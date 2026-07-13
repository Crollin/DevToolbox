/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** DevToolbox API URL - URL de base de l'API, incluant /api */
  "apiBaseUrl": string,
  /** Personal Access Token - Token privé avec le scope licences. */
  "personalAccessToken": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `search-licences` command */
  export type SearchLicences = ExtensionPreferences & {}
  /** Preferences accessible in the `create-licence` command */
  export type CreateLicence = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `search-licences` command */
  export type SearchLicences = {}
  /** Arguments passed to the `create-licence` command */
  export type CreateLicence = {}
}

