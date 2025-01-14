/** 
 Arquivo gerado automaticamente pelo Directus2TS 
 */
export type Here-Extension = {
  here_routing: components["schemas"]["ItemsHereRouting"];
};
export type paths = Record<string, never>;

export type webhooks = Record<string, never>;

export interface components {
  schemas: {
    Diff: {
      hash?: string;
      diff?: {
        collections?: {
            collection?: string;
            diff?: Record<string, never>[];
          }[];
        fields?: {
            collection?: string;
            field?: string;
            diff?: Record<string, never>[];
          }[];
        relations?: {
            collection?: string;
            field?: string;
            related_collection?: string;
            diff?: Record<string, never>[];
          }[];
      };
    };
    Files: {
      /**
       * @description Unique identifier for the file.
       * @example 8cbb43fe-4cdf-4991-8352-c461779cec02
       */
      id?: string;
      /**
       * @description Where the file is stored. Either `local` for the local filesystem or the name of the storage adapter (for example `s3`).
       * @example local
       */
      storage?: string;
      /**
       * @description Name of the file on disk. By default, Directus uses a random hash for the filename.
       * @example a88c3b72-ac58-5436-a4ec-b2858531333a.jpg
       */
      filename_disk?: string;
      /**
       * @description How you want to the file to be named when it's being downloaded.
       * @example avatar.jpg
       */
      filename_download?: string;
      /**
       * @description Title for the file. Is extracted from the filename on upload, but can be edited by the user.
       * @example User Avatar
       */
      title?: string;
      /**
       * @description MIME type of the file.
       * @example image/jpeg
       */
      type?: string;
      /**
       * @description Virtual folder where this file resides in.
       * @example null
       */
      folder?: string | components["schemas"]["Folders"] | null;
      /**
       * @description Who uploaded the file.
       * @example 63716273-0f29-4648-8a2a-2af2948f6f78
       */
      uploaded_by?: string | components["schemas"]["Users"];
      /**
       * Format: date-time
       * @description When the file was created.
       * @example 2019-12-03T00:10:15+00:00
       */
      created_on?: string;
      modified_by?: string | components["schemas"]["Users"] | null;
      /** Format: timestamp */
      modified_on?: string;
      /**
       * @description Character set of the file.
       * @example binary
       */
      charset?: string | null;
      /**
       * @description Size of the file in bytes.
       * @example 137862
       */
      filesize?: number;
      /**
       * @description Width of the file in pixels. Only applies to images.
       * @example 800
       */
      width?: number | null;
      /**
       * @description Height of the file in pixels. Only applies to images.
       * @example 838
       */
      height?: number | null;
      /**
       * @description Duration of the file in seconds. Only applies to audio and video.
       * @example 0
       */
      duration?: number | null;
      /**
       * @description Where the file was embedded from.
       * @example null
       */
      embed?: string | null;
      /** @description Description for the file. */
      description?: string | null;
      /** @description Where the file was created. Is automatically populated based on Exif data for images. */
      location?: string | null;
      /** @description Tags for the file. Is automatically populated based on Exif data for images. */
      tags?: string[] | null;
      /** @description IPTC, Exif, and ICC metadata extracted from file */
      metadata?: Record<string, unknown> | null;
      focal_point_x?: number | null;
      focal_point_y?: number | null;
      tus_id?: string | null;
      tus_data?: unknown;
      /**
       * Format: date-time
       * @description When the file was last uploaded/replaced.
       * @example 2019-12-03T00:10:15+00:00
       */
      uploaded_on?: string;
    };
    Folders: {
      /**
       * @description Unique identifier for the folder.
       * @example 0cf0e03d-4364-45df-b77b-ca61f61869d2
       */
      id?: string;
      /**
       * @description Name of the folder.
       * @example New York
       */
      name?: string;
      /**
       * @description Unique identifier of the parent folder. This allows for nested folders.
       * @example null
       */
      parent?: string | components["schemas"]["Folders"] | null;
    };
    Roles: {
      /**
       * @description Unique identifier for the role.
       * @example 2f24211d-d928-469a-aea3-3c8f53d4e426
       */
      id?: string;
      /**
       * @description Name of the role.
       * @example Administrator
       */
      name?: string;
      /**
       * @description The role's icon.
       * @example verified_user
       */
      icon?: string;
      /**
       * @description Description of the role.
       * @example Admins have access to all managed data within the system by default
       */
      description?: string | null;
      /** @description $t:field_options.directus_roles.parent_note */
      parent?: string | components["schemas"]["Roles"] | null;
      /** @description $t:field_options.directus_roles.children_note */
      children?: ((string | components["schemas"]["Roles"])[]) | null;
      policies?: unknown;
      users?: ((string | components["schemas"]["Users"])[]) | null;
    };
    Schema: {
      /** @example 1 */
      version?: number;
      directus?: string;
      vendor?: string;
      collections?: components["schemas"]["Collections"][];
      fields?: components["schemas"]["Fields"][];
      relations?: components["schemas"]["Relations"][];
    };
    Users: {
      /**
       * @description Unique identifier for the user.
       * @example 63716273-0f29-4648-8a2a-2af2948f6f78
       */
      id?: string;
      /**
       * @description First name of the user.
       * @example Admin
       */
      first_name?: string;
      /**
       * @description Last name of the user.
       * @example User
       */
      last_name?: string;
      /**
       * Format: email
       * @description Unique email address for the user.
       * @example admin@example.com
       */
      email?: string;
      /** @description Password of the user. */
      password?: string;
      /**
       * @description The user's location.
       * @example null
       */
      location?: string | null;
      /**
       * @description The user's title.
       * @example null
       */
      title?: string | null;
      /**
       * @description The user's description.
       * @example null
       */
      description?: string | null;
      /**
       * @description The user's tags.
       * @example null
       */
      tags?: string[] | null;
      /**
       * @description The user's avatar.
       * @example null
       */
      avatar?: string | components["schemas"]["Files"] | null;
      /**
       * @description The user's language used in Directus.
       * @example en-US
       */
      language?: string;
      /**
       * @description The 2FA secret string that's used to generate one time passwords.
       * @example null
       */
      tfa_secret?: string | null;
      /**
       * @description Status of the user.
       * @example active
       * @enum {string}
       */
      status?: "active" | "invited" | "draft" | "suspended" | "deleted";
      /**
       * @description Unique identifier of the role of this user.
       * @example 2f24211d-d928-469a-aea3-3c8f53d4e426
       */
      role?: string | components["schemas"]["Roles"];
      /** @description Static token for the user. */
      token?: string | null;
      /**
       * Format: date-time
       * @description When this user used the API last.
       * @example 2020-05-31T14:32:37Z
       */
      last_access?: string | null;
      /**
       * @description Last page that the user was on.
       * @example /my-project/settings/collections/a
       */
      last_page?: string | null;
      provider?: string;
      external_identifier?: string | null;
      auth_data?: unknown;
      email_notifications?: boolean | null;
      appearance?: string | null;
      theme_dark?: string | null;
      theme_light?: string | null;
      theme_light_overrides?: unknown;
      theme_dark_overrides?: unknown;
      policies?: unknown;
    };
    Extensions: {
      enabled?: boolean;
      /** Format: uuid */
      id?: string;
      folder?: string;
      source?: string;
      /**
       * @description Name of the bundle the extension is in.
       * @example directus-extension-my-bundle
       */
      bundle?: string | null;
    };
    Comments: {
      /**
       * @description Unique identifier for this single collection preset.
       * @example 81dfa7e0-56d2-471f-b96a-1cf8a62bdf28
       */
      id?: string;
      /**
       * @description The collection of the item the Comment is created for.
       * @example articles
       */
      collection?: string | components["schemas"]["Collections"];
      /**
       * @description The item the Comment is created for.
       * @example 123
       */
      item?: string;
      /**
       * @description User comment. This will store the comments that show up in the right sidebar of the item edit page in the admin app.
       * @example This is a comment
       */
      comment?: string;
      /**
       * Format: date-time
       * @description When the Comment was created.
       * @example 2024-01-23T12:34:56Z
       */
      date_created?: string | null;
      /**
       * Format: date-time
       * @description When the Comment was updated.
       * @example 2024-01-23T12:34:56Z
       */
      date_updated?: string | null;
      /**
       * @description User that created the Comment.
       * @example 81dfa7e0-56d2-471f-b96a-1cf8a62bdf28
       */
      user_created?: string | components["schemas"]["Users"];
      /**
       * @description User that updated the Comment.
       * @example 81dfa7e0-56d2-471f-b96a-1cf8a62bdf28
       */
      user_updated?: string | components["schemas"]["Users"];
    };
    Versions: {
      /**
       * @description Primary key of the Content Version.
       * @example 63716273-0f29-4648-8a2a-2af2948f6f78
       */
      id?: string;
      /**
       * @description Key of the Content Version, used as the value for the "version" query parameter.
       * @example draft
       */
      key?: string;
      /**
       * @description Descriptive name of the Content Version.
       * @example My Draft
       */
      name?: string;
      /**
       * @description Name of the collection the Content Version is created on.
       * @example articles
       */
      collection?: string | components["schemas"]["Collections"];
      /**
       * @description The item the Content Version is created on.
       * @example 168
       */
      item?: string;
      hash?: string | null;
      /**
       * Format: date-time
       * @description When the Content Version was created.
       * @example 2022-05-11T13:14:52Z
       */
      date_created?: string | null;
      /**
       * Format: date-time
       * @description When the Content Version was last updated.
       * @example 2022-05-11T13:14:53Z
       */
      date_updated?: string | null;
      /**
       * @description User that created the Content Version.
       * @example 63716273-0f29-4648-8a2a-2af2948f6f78
       */
      user_created?: string | components["schemas"]["Users"];
      /**
       * @description User that last updated the Content Version.
       * @example 63716273-0f29-4648-8a2a-2af2948f6f78
       */
      user_updated?: string | components["schemas"]["Users"];
      /**
       * @description The current changes compared to the main version of the item.
       * @example {
       *   "my_field": "Updated Value"
       * }
       */
      delta?: Record<string, never>;
    };
    ItemsHereRouting: {
      /** Format: uuid */
      id: string;
      status?: string;
      sort?: number | null;
      user_created?: string | components["schemas"]["Users"] | null;
      /** Format: timestamp */
      date_created?: string | null;
      user_updated?: string | components["schemas"]["Users"] | null;
      /** Format: timestamp */
      date_updated?: string | null;
      method?: string | null;
      transport_mode?: string | null;
      /** @description ex:   destination=51.611571,11.351608 - A simple WGS84 coordinate */
      origin?: string | null;
      destination?: string | null;
    };
  };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}

export type $defs = Record<string, never>;

export type external = Record<string, never>;

export type operations = Record<string, never>;
