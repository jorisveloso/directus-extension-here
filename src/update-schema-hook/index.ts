import { defineHook } from "@directus/extensions-sdk";
import {
  authentication,
  createCollection,
  createDirectus,
  createField,
  login,
  readCollections,
  readFields,
  rest,
  updateField,
} from "@directus/sdk";
import fs from "fs";
import { Agent } from "http";
import fetch from "node-fetch";
import path from "path";

interface Field {
  collection: string;
  field: string;
  type: string;
  schema?: Record<string, any>;
  meta?: Record<string, any>;
}

interface Collection {
  collection: string;
  meta?: Record<string, any>;
  schema?: Record<string, any>;
}

interface Schema {
  collections: Collection[];
  fields: Field[];
}

async function checkServiceReady(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/server/health`, {
      agent: new Agent({ family: 4 }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 5,
  delayMs = 2000
): Promise<T> {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (i < retries - 1) await delay(delayMs * (i + 1));
    }
  }
  throw lastError;
}

async function processFields(
  client: any,
  collectionName: string,
  fields: Field[]
): Promise<void> {
  for (const field of fields) {
    try {
      const { field: fieldName, type, schema = {}, meta = {} } = field;

      if (fieldName === "id") continue;

      const existingFields = await withRetry(async () => {
        const fields = await client.request(readFields());
        return fields.filter((f: any) => f.collection === collectionName);
      });

      const existingField = existingFields.find(
        (f: any) => f.field === fieldName
      );

      if (existingField) {
        const needsUpdate = !deepEqual(existingField, field);
        if (needsUpdate) {
          await withRetry(async () => {
            await client.request(
              updateField(collectionName, fieldName, {
                type,
                schema,
                meta,
              })
            );
          });
        }
      } else {
        await withRetry(async () => {
          await client.request(
            createField(collectionName, {
              field: fieldName,
              type,
              schema,
              meta,
            })
          );
        });
      }
    } catch (error: any) {
      console.error(`Erro ao processar campo ${field.field}:`, error.message);
    }
  }
}

function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  if (!obj1 || !obj2) return false;
  if (typeof obj1 !== typeof obj2) return false;
  if (typeof obj1 !== "object") return obj1 === obj2;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  return keys1.every((key) => deepEqual(obj1[key], obj2[key]));
}

export default defineHook(({ action }, { env }) => {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    console.error("Credenciais de admin não encontradas");
    return;
  }

  action("server.start", async () => {
    try {
      const directusUrl = "http://directus:8055";
      let isReady = false;
      const maxAttempts = 15;

      for (let i = 0; i < maxAttempts && !isReady; i++) {
        isReady = await checkServiceReady(directusUrl);
        if (!isReady) await delay(2000);
      }

      if (!isReady)
        throw new Error("Servidor não disponível após tempo máximo de espera");

      const client = createDirectus(directusUrl)
        .with(rest())
        .with(authentication());

      await withRetry(async () => {
        const loginResponse = await client.request(
          login(env.ADMIN_EMAIL, env.ADMIN_PASSWORD)
        );
        client.setToken(loginResponse.access_token);
      });

      const schemaPath = path.join(
        process.cwd(),
        "extensions",
        "directus-extension-here",
        "src",
        "utils",
        "files",
        "schema.json"
      );

      if (!fs.existsSync(schemaPath))
        throw new Error(`Schema não encontrado: ${schemaPath}`);

      const schemaContent = fs.readFileSync(schemaPath, "utf-8");
      const parsedSchema = JSON.parse(schemaContent) as Schema;

      if (!parsedSchema?.collections?.length)
        throw new Error("Schema inválido");

      const collections = await withRetry(async () =>
        client.request(readCollections())
      );
      const existingCollections = collections.map((c: any) => c.collection);

      for (const collection of parsedSchema.collections) {
        if (!existingCollections.includes(collection.collection)) {
          await withRetry(async () => {
            await client.request(
              createCollection({
                collection: collection.collection,
                meta: collection.meta || {
                  icon: "box",
                  note: null,
                  display_template: null,
                  hidden: false,
                  singleton: false,
                  translations: null,
                  archive_field: null,
                  archive_app_filter: true,
                  archive_value: null,
                  unarchive_value: null,
                  sort_field: null,
                },
                schema: collection.schema || {
                  name: collection.collection,
                },
              })
            );
          });
        }

        const collectionFields = parsedSchema.fields.filter(
          (field) => field.collection === collection.collection
        );

        await processFields(client, collection.collection, collectionFields);
      }

      console.log("Schema atualizado com sucesso");
    } catch (error: any) {
      console.error("Erro:", error.message);
    }
  });
});
