import { defineHook } from "@directus/extensions-sdk";
import {
  authentication,
  createDirectus,
  createField,
  readField,
  rest,
  updateField,
} from "@directus/sdk";
import fs from "fs";
import path from "path";

// Interface para o tipo de campo do Directus
interface DirectusField {
  collection: string;
  field: string;
  type: string;
  meta?: Record<string, any>;
}

// Função para comparar dois objetos
function isEqual(
  obj1: Record<string, any>,
  obj2: Record<string, any>
): boolean {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }

  return true;
}

// Hook para atualizar o schema
export default defineHook(({ action }, { env }) => {
  // Configura o Directus
  const client = createDirectus(env.PUBLIC_URL || "http://localhost:8055")
    .with(rest())
    .with(authentication("session"));

  // Carrega o schema do arquivo JSON
  const schemaPath = path.resolve(__dirname, "schema.json");
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));

  // Hook para atualizar o schema após a criação ou atualização de uma coleção
  action("collections.create", async ({ payload }) => {
    await updateSchema(payload.collection);
  });

  action("collections.update", async ({ payload }) => {
    await updateSchema(payload.collection);
  });

  // Função para atualizar o schema
  async function updateSchema(collection: string) {
    try {
      // Autentica no Directus
      await client.setToken(env.KEY);

      // Itera sobre os campos definidos no schema
      for (const field of schema.collections) {
        if (field.collection === collection) {
          const { field: fieldName, type, meta } = field;

          try {
            // Verifica se o campo já existe
            const existingField = await client.request<DirectusField>(
              readField(collection, fieldName)
            );

            if (existingField) {
              // Compara o campo existente com o campo definido no schema
              const isMetaEqual = isEqual(existingField.meta || {}, meta || {});
              const isTypeEqual = existingField.type === type;

              if (!isMetaEqual || !isTypeEqual) {
                // Atualiza o campo se houver diferenças
                await client.request(
                  updateField(collection, fieldName, {
                    type,
                    meta,
                  })
                );
                console.log(
                  `Campo ${fieldName} na coleção ${collection} atualizado com sucesso.`
                );
              } else {
                console.log(
                  `Campo ${fieldName} na coleção ${collection} já está atualizado.`
                );
              }
            } else {
              // Cria um novo campo se ele não existir
              await client.request(
                createField(collection, {
                  field: fieldName,
                  type,
                  meta,
                })
              );
              console.log(
                `Campo ${fieldName} na coleção ${collection} criado com sucesso.`
              );
            }
          } catch (error) {
            console.error(
              `Erro ao processar o campo ${fieldName} na coleção ${collection}:`,
              error
            );
          }
        }
      }

      console.log(`Schema da coleção ${collection} atualizado com sucesso.`);
    } catch (error) {
      console.error(
        `Erro durante a atualização do schema da coleção ${collection}:`,
        error
      );
    }
  }
});
