import { defineHook } from "@directus/extensions-sdk";
import { components } from "../here-extension";
import { RoutingService } from "../routing-service/routing-service";
import { StatusRota } from "../routing-service/StatusRota";

type Routing = components["schemas"]["ItemsHereRouting"];

export default defineHook(async (tiposEvento, apiExtensionContext) => {
  tiposEvento.filter<Routing>(
    "here_routing.items.update",
    async (input: Routing) => {
      if (input.status !== StatusRota.Rascunho.nome) {
        return input;
      }

      input.request = null;
      input.response = null;
      input.error = null;
      input.log = null;
      input.routes = null;
      return input;
    }
  );

  const schema = await apiExtensionContext.getSchema();
  const service = new RoutingService(apiExtensionContext, {
    schema: schema,
    knex: apiExtensionContext.database,
  });
  const aCadaUmMinutoCronExpression = "*/1 * * * *";

  tiposEvento.schedule(aCadaUmMinutoCronExpression, async () => {
    service.sincronizar().catch((erro) => {
      apiExtensionContext.logger.error(
        `Falha ao sincronizar com here.com. Erro = ${erro}.`
      );
    });
  });
});
