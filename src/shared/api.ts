import {
	type ModelInfo,
	type ProviderSettings,
	ANTHROPIC_DEFAULT_MAX_TOKENS,
	CLAUDE_CODE_DEFAULT_MAX_OUTPUT_TOKENS,
} from "@roo-code/types"

// ApiHandlerOptions

export type ApiHandlerOptions = Omit<ProviderSettings, "apiProvider">

// RouterName

const routerNames = ["openrouter", "requesty", "glama", "unbound", "litellm", "ollama", "lmstudio"] as const

export type RouterName = (typeof routerNames)[number]

export const isRouterName = (value: string): value is RouterName => routerNames.includes(value as RouterName)

export function toRouterName(value?: string): RouterName {
	if (value && isRouterName(value)) {
		return value
	}

	throw new Error(`Invalid router name: ${value}`)
}

// RouterModels

export type ModelRecord = Record<string, ModelInfo>

export type RouterModels = Record<RouterName, ModelRecord>

// Reasoning

export const shouldUseReasoningBudget = ({
	model,
	settings,
}: {
	model: ModelInfo
	settings?: ProviderSettings
}): boolean => !!model.requiredReasoningBudget || (!!model.supportsReasoningBudget && !!settings?.enableReasoningEffort)

export const shouldUseReasoningEffort = ({
	model,
	settings,
}: {
	model: ModelInfo
	settings?: ProviderSettings
}): boolean => (!!model.supportsReasoningEffort && !!settings?.reasoningEffort) || !!model.reasoningEffort

export const DEFAULT_HYBRID_REASONING_MODEL_MAX_TOKENS = 16_384
export const DEFAULT_HYBRID_REASONING_MODEL_THINKING_TOKENS = 8_192

// Max Tokens

export const getModelMaxOutputTokens = ({
	modelId,
	model,
	settings,
	inputTokenCount,
}: {
	modelId: string
	model: ModelInfo
	settings?: ProviderSettings
	inputTokenCount?: number
}): number | undefined => {
	// Check for Claude Code specific max output tokens setting
	if (settings?.apiProvider === "claude-code") {
		// Return the configured value or default to CLAUDE_CODE_DEFAULT_MAX_OUTPUT_TOKENS
		return settings.claudeCodeMaxOutputTokens || CLAUDE_CODE_DEFAULT_MAX_OUTPUT_TOKENS
	}

	if (shouldUseReasoningBudget({ model, settings })) {
		return settings?.modelMaxTokens || DEFAULT_HYBRID_REASONING_MODEL_MAX_TOKENS
	}

	// Check if auto-calculate is enabled for max output tokens
	if (settings?.autoCalculateMaxOutputTokens && inputTokenCount !== undefined) {
		// Calculate remaining context window space, capped at model's max output limit
		const remainingTokens = model.contextWindow - inputTokenCount
		const modelMaxOutput = model.maxTokens || Math.ceil(model.contextWindow * 0.5)
		return Math.min(remainingTokens, modelMaxOutput)
	}

	// Check if manual max output tokens is set
	if (settings?.modelMaxOutputTokens) {
		return settings.modelMaxOutputTokens
	}

	const isAnthropicModel = modelId.includes("claude")

	// For "Hybrid" reasoning models, we should discard the model's actual
	// `maxTokens` value if we're not using reasoning. We do this for Anthropic
	// models only for now. Should we do this for Gemini too?
	if (model.supportsReasoningBudget && isAnthropicModel) {
		return ANTHROPIC_DEFAULT_MAX_TOKENS
	}

	// If maxTokens is 0 or undefined or the full context window, fall back to 20% of context window
	if (model.maxTokens && model.maxTokens !== model.contextWindow) {
		return model.maxTokens
	} else {
		return Math.ceil(model.contextWindow * 0.2)
	}
}

// GetModelsOptions

export type GetModelsOptions =
	| { provider: "openrouter" }
	| { provider: "glama" }
	| { provider: "requesty"; apiKey?: string }
	| { provider: "unbound"; apiKey?: string }
	| { provider: "litellm"; apiKey: string; baseUrl: string }
	| { provider: "ollama"; baseUrl?: string }
	| { provider: "lmstudio"; baseUrl?: string }
