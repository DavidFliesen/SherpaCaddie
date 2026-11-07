const TAB_LABELS = new Map([
  ["guide", "GUIDE"], ["learn", "LEARN"], ["play", "PLAN"],
  ["technology", "TECHNOLOGY"], ["clubs", "CLUBS"], ["review", "REVIEW"],
]);

function fail(tool, code, userMessage, retryable = false) {
  return { ok: false, tool, code, userMessage, retryable };
}

export class RegisteredToolGateway {
  #tools = new Map();

  register(tool) {
    const { name } = tool.descriptor;
    if (this.#tools.has(name)) throw new Error(`Duplicate Sage tool: ${name}`);
    this.#tools.set(name, tool);
  }

  descriptors() {
    return [...this.#tools.values()].map(({ descriptor }) => descriptor);
  }

  async execute(request, signal) {
    const name = typeof request?.name === "string" ? request.name : "";
    const cancelled = () => fail(name, "CANCELLED", "The action was cancelled.", true);
    if (signal.aborted) return cancelled();
    const tool = this.#tools.get(name);
    if (!tool) return fail(name, "UNKNOWN_TOOL", "That action is unavailable.");
    const parsed = tool.validate(request.arguments);
    if (!parsed.ok) return fail(name, "INVALID_ARGUMENTS", parsed.message);
    if (tool.descriptor.requiresConfirmation) {
      return fail(name, "CONFIRMATION_REQUIRED", "This action requires confirmation.");
    }
    try {
      const permission = await tool.canExecute(parsed.value, signal);
      if (signal.aborted) return cancelled();
      if (!permission.ok) return fail(name, "ACTION_NOT_ALLOWED", permission.message);
      const result = await tool.run(parsed.value, signal);
      if (signal.aborted) return cancelled();
      if (result?.tool !== name || typeof result.ok !== "boolean") throw new Error("Invalid tool result");
      return result;
    } catch (error) {
      return signal.aborted ? cancelled() : fail(name, "HANDLER_FAILED", "The app could not read that information.", true);
    }
  }
}

export function createAppTools({ isAllowed, getRoute }) {
  const gateway = new RegisteredToolGateway();
  const name = "get_app_context";
  gateway.register({
    descriptor: {
      name, description: "Read the active Sherpa Caddie tab.",
      inputSchema: {
        type: "object", additionalProperties: false,
        properties: { field: { const: "tab" } }, required: ["field"],
      },
      requiresConfirmation: false,
    },
    validate(input) {
      if (input && Object.getPrototypeOf(input) === Object.prototype &&
          Reflect.ownKeys(input).length === 1 && Object.hasOwn(input, "field") && input.field === "tab") {
        return { ok: true, value: { field: "tab" } };
      }
      return { ok: false, message: 'Expected only field: "tab".' };
    },
    canExecute() {
      return isAllowed() ? { ok: true } : { ok: false, message: "The Local Sage screen is no longer active." };
    },
    run(input, signal) {
      if (signal.aborted) return fail(name, "CANCELLED", "The action was cancelled.", true);
      // Recheck at the synchronous read boundary, after the gateway's await.
      if (!isAllowed()) return fail(name, "ACTION_NOT_ALLOWED", "The Local Sage screen is no longer active.");
      const tab = TAB_LABELS.get(getRoute());
      return tab ? { ok: true, tool: name, data: { tab } } :
        fail(name, "CONTEXT_UNAVAILABLE", "I could not tell which tab is active.", true);
    },
  });
  return gateway;
}
