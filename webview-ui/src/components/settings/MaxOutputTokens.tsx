import { useEffect } from "react"
import { Checkbox } from "vscrui"

import { type ProviderSettings, type ModelInfo } from "@roo-code/types"

import { useAppTranslation } from "@src/i18n/TranslationContext"
import { Slider } from "@src/components/ui"

interface MaxOutputTokensProps {
	apiConfiguration: ProviderSettings
	setApiConfigurationField: <K extends keyof ProviderSettings>(field: K, value: ProviderSettings[K]) => void
	modelInfo?: ModelInfo
	showSlider?: boolean
}

export const MaxOutputTokens = ({ 
	apiConfiguration, 
	setApiConfigurationField, 
	modelInfo,
	showSlider = true 
}: MaxOutputTokensProps) => {
	const { t } = useAppTranslation()

	if (!modelInfo || !showSlider) {
		return null
	}

	const contextWindow = modelInfo.contextWindow
	const maxOutputTokens = modelInfo.maxTokens
	const autoCalculateEnabled = apiConfiguration.autoCalculateMaxOutputTokens ?? false
	const customMaxOutputTokens = apiConfiguration.modelMaxOutputTokens
	
	// Calculate reasonable defaults based on model capabilities
	const defaultMaxOutput = Math.min(
		maxOutputTokens || Math.ceil(contextWindow * 0.5),
		Math.ceil(contextWindow * 0.5)
	)
	
	// Determine if auto-calculate should be enabled by default
	// Enable if model's max output limit equals its context window
	const shouldAutoCalculateByDefault = maxOutputTokens === contextWindow
	
	// Set default values on component mount
	useEffect(() => {
		if (apiConfiguration.autoCalculateMaxOutputTokens === undefined) {
			setApiConfigurationField("autoCalculateMaxOutputTokens", shouldAutoCalculateByDefault)
		}
		if (!customMaxOutputTokens && !autoCalculateEnabled) {
			setApiConfigurationField("modelMaxOutputTokens", defaultMaxOutput)
		}
	}, [
		apiConfiguration.autoCalculateMaxOutputTokens,
		customMaxOutputTokens,
		autoCalculateEnabled,
		shouldAutoCalculateByDefault,
		defaultMaxOutput,
		setApiConfigurationField
	])

	const currentMaxOutputTokens = customMaxOutputTokens || defaultMaxOutput
	const sliderMax = Math.min(maxOutputTokens || contextWindow, contextWindow)

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-col gap-1">
				<Checkbox
					checked={autoCalculateEnabled}
					onChange={(checked: boolean) => {
						setApiConfigurationField("autoCalculateMaxOutputTokens", checked)
						// When auto-calculate is enabled, clear the manual setting
						if (checked) {
							setApiConfigurationField("modelMaxOutputTokens", undefined)
						} else {
							// When disabled, set a reasonable default
							setApiConfigurationField("modelMaxOutputTokens", defaultMaxOutput)
						}
					}}>
					{t("settings:maxOutputTokens.autoCalculate")}
				</Checkbox>
				<div className="text-sm text-vscode-descriptionForeground ml-6">
					{t("settings:maxOutputTokens.autoCalculateDescription")}
				</div>
			</div>

			{!autoCalculateEnabled && (
				<div className="flex flex-col gap-1">
					<div className="font-medium">{t("settings:maxOutputTokens.maxTokens")}</div>
					<div className="flex items-center gap-1">
						<Slider
							min={1024}
							max={sliderMax}
							step={1024}
							value={[currentMaxOutputTokens]}
							onValueChange={([value]) => setApiConfigurationField("modelMaxOutputTokens", value)}
						/>
						<div className="w-16 text-sm text-center">{currentMaxOutputTokens.toLocaleString()}</div>
					</div>
					<div className="text-sm text-vscode-descriptionForeground">
						{t("settings:maxOutputTokens.rangeDescription", { 
							min: "1,024", 
							max: sliderMax.toLocaleString() 
						})}
					</div>
				</div>
			)}
		</div>
	)
}