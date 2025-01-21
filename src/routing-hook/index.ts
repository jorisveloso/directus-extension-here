import { defineHook } from "@directus/extensions-sdk";
import { components } from "../here-extension";
import { RoutingService } from "../routing-service/routing-service";

type Routing = components["schemas"]["ItemsHereRouting"];

export default defineHook(async (tiposEvento, apiExtensionContext) => {
  const aCadaUmMinutoCronExpression = "*/1 * * * *";
  const schema = await apiExtensionContext.getSchema();

  const service = new RoutingService(apiExtensionContext, {
    schema,
    knex: apiExtensionContext.database,
  });

  tiposEvento.filter<Routing>("here-routing.items.update", async (input) => {
    if (input.status == "draft") {
      return input;
    }

    input.status = "published";
    return input;
  });

  tiposEvento.schedule(aCadaUmMinutoCronExpression, async () => {
    service.sincronizar().catch((erro) => {
      apiExtensionContext.logger.error(
        `Falha ao sincronizar com here.com. Erro = ${erro}.`
      );
    });
  });
});
