import { defineHook } from "@directus/extensions-sdk";
import {
  authentication,
  createCollection,
  createDirectus,
  createField,
  readFields,
  rest,
  updateField,
} from "@directus/sdk";
import fs from "fs";
import path from "path";

// Interface para a estrutura do schema
interface SchemaField {
  collection: string;
  field: string;
  type: string;
  meta?: Record<string, any>;
}

interface Schema {
  collections: SchemaField[];
}

// Tipo personalizado para campos existentes
type ExistingField = {
  collection: string;
  field: string;
  type: string;
  meta?: Record<string, any> | null;
};

// Função para comparar objetos com segurança
function deepEqual(
  obj1: Record<string, any> | undefined | null,
  obj2: Record<string, any> | undefined | null
): boolean {
  // Casos de igualdade direta
  if (obj1 === obj2) return true;

  // Tratamento de undefined ou null
  if (obj1 == null || obj2 == null) return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    const val1 = obj1[key];
    const val2 = obj2[key];

    // Comparação profunda para objetos aninhados
    if (val1 !== val2) {
      if (typeof val1 === "object" && typeof val2 === "object") {
        if (!deepEqual(val1, val2)) return false;
      } else {
        return false;
      }
    }
  }

  return true;
}

// Hook para atualizar o schema
export default defineHook(({ action }, { env }) => {
  console.log("********* Verificando se o schema está atualizado ************");

  // Configura o Directus
  const client = createDirectus(env.PUBLIC_URL || "http://localhost:8055")
    .with(rest())
    .with(authentication("session"));

  // Executa quando o servidor Directus inicializa
  action("server.start", async () => {
    console.log("Iniciando verificação do schema...");

    // Caminho do schema usando o caminho correto do Docker
    const schemaPath = path.join(
      process.cwd(),
      "extensions",
      "directus-extension-here",
      "src",
      "utils",
      "files",
      "schema.json"
    );
    console.log(`Caminho do arquivo com o schema: ${schemaPath}`);

    // Carrega e valida o schema
    let schema: Schema;
    try {
      schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8")) as Schema;
    } catch (error) {
      console.error(`Erro ao ler o arquivo schema: ${schemaPath}`, error);
      return;
    }

    try {
      // Autentica no Directus
      await client.setToken(env.KEY);

      // Agrupa campos por coleção para processamento mais eficiente
      const fieldsByCollection = schema.collections.reduce(
        (acc, field) => {
          if (!acc[field.collection]) {
            acc[field.collection] = [];
          }
          acc[field.collection].push(field);
          return acc;
        },
        {} as Record<string, SchemaField[]>
      );

      // Processa cada coleção
      for (const [collectionName, fields] of Object.entries(
        fieldsByCollection
      )) {
        try {
          // Tenta ler os campos existentes da coleção
          const existingFields: ExistingField[] = await client
            .request(readFields())
            .then((allFields) =>
              (allFields as ExistingField[]).filter(
                (f) => f.collection === collectionName
              )
            )
            .catch(() => []);

          // Se a coleção não existe, tenta criar
          if (existingFields.length === 0) {
            console.log(`Coleção ${collectionName} não encontrada. Criando...`);
            await client.request(
              createCollection({
                collection: collectionName,
                fields: [
                  {
                    field: "id",
                    type: "integer",
                    meta: {
                      hidden: true,
                      interface: "input",
                      readonly: true,
                    },
                    schema: {
                      is_primary_key: true,
                      has_auto_increment: true,
                    },
                  },
                ],
              })
            );
            console.log(`Coleção ${collectionName} criada com sucesso.`);
          }

          // Processa cada campo da coleção
          for (const field of fields) {
            const { field: fieldName, type, meta = {} } = field;

            // Tratamento seguro para encontrar o campo existente
            const existingField = existingFields.find(
              (f) => f.field === fieldName
            );

            // Prepara dados do campo
            const fieldData = {
              field: fieldName,
              type,
              meta: Object.keys(meta).length > 0 ? meta : undefined,
            };

            // Verifica se o campo existe antes de processar
            if (existingField) {
              // Compara meta e tipo com verificação segura
              const isMetaEqual = deepEqual(
                existingField.meta || {},
                fieldData.meta || {}
              );
              const isTypeEqual = existingField.type === type;

              if (!isMetaEqual || !isTypeEqual) {
                await client.request(
                  updateField(collectionName, fieldName, {
                    type: fieldData.type,
                    meta: fieldData.meta,
                  })
                );
                console.log(
                  `Campo ${fieldName} na coleção ${collectionName} atualizado com sucesso.`
                );
              } else {
                console.log(
                  `Campo ${fieldName} na coleção ${collectionName} já está atualizado.`
                );
              }
            } else {
              // Cria novo campo
              await client.request(createField(collectionName, fieldData));
              console.log(
                `Campo ${fieldName} na coleção ${collectionName} criado com sucesso.`
              );
            }
          }
        } catch (error) {
          console.error(
            `Erro ao processar a coleção ${collectionName}:`,
            error
          );
        }
      }

      console.log("Verificação e atualização do schema concluída com sucesso!");
    } catch (error) {
      console.error("Erro durante a verificação do schema:", error);
    }
  });
});
