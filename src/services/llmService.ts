import {
	GoogleGenerativeAI,
	HarmCategory,
	HarmBlockThreshold,
} from "@google/generative-ai";
import type { GenerativeModel } from "@google/generative-ai";

// Types for the LLM service
interface CategoryResult {
	item: string;
	section: string;
	confidence: number;
}

interface CategoryResponse {
	categories: CategoryResult[];
	uncategorized: string[];
}

/**
 * Service to categorize market items using Google's Generative AI
 */
export class LLMService {
	private genAI: GoogleGenerativeAI;
	private model: string;
	private generativeModel: GenerativeModel | null = null;

	constructor() {
		// Initialize the Google AI client with API key
		const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_KEY;

		if (!apiKey) {
			throw new Error("Google AI API key is missing");
		}

		this.genAI = new GoogleGenerativeAI(apiKey);
		this.model = "learnlm-2.0-flash-experimental";
	}

	/**
	 * Gets or initializes the generative model with appropriate safety settings
	 */
	private getModel(): GenerativeModel {
		if (!this.generativeModel) {
			this.generativeModel = this.genAI.getGenerativeModel({
				model: this.model,
				safetySettings: [
					{
						category: HarmCategory.HARM_CATEGORY_HARASSMENT,
						threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
					},
					{
						category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
						threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
					},
					{
						category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
						threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
					},
					{
						category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
						threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
					},
				],
				generationConfig: {
					temperature: 0.2, // Lower temperature for more deterministic responses
					topP: 0.8,
					topK: 40,
					maxOutputTokens: 1024,
				},
			});
		}
		return this.generativeModel;
	}

	/**
	 * Categorizes a list of items based on market sections
	 * @param items List of items to categorize
	 * @param sections Available market sections with their categories
	 * @returns Categorized items with confidence scores
	 */
	async categorizeItems(
		items: string[],
		sections: Section[],
	): Promise<CategoryResponse> {
		if (!items.length || !sections.length) {
			return { categories: [], uncategorized: items };
		}

		try {
			const model = this.getModel();

			// Build comprehensive section information with both section names and categories
			const sectionInfo = sections
				.map((section) => {
					return `- ${section.name} (ID: ${section.id}): ${section.categories.join(", ")}`;
				})
				.join("\n");

			// Build the user items list with normalization
			const normalizedItems = items.map((item) => item.trim().toLowerCase());
			const itemsList = normalizedItems.join(", ");

			// Create a more structured prompt for better categorization
			const prompt = `
System: You are an AI assistant specialized in categorizing grocery shopping items into the correct supermarket sections. Your task is to analyze each item and determine which section it belongs to.

Available market sections and their categories:
${sectionInfo}

User items to categorize:
${itemsList}

Instructions:
1. For each item, identify the most appropriate section based on the categories listed.
2. If an item can belong to multiple sections, choose the most specific or relevant one.
3. If you can't confidently categorize an item, include it in "uncategorized".
4. Assign a confidence score (0-1) to each categorization.
5. Always match items to exact section names as provided, not to categories.

Respond with ONLY a valid JSON object with two fields:
1. "categories": Array of objects with { "item": string, "section": string, "confidence": number }
2. "uncategorized": Array of strings for items that couldn't be categorized

Example response format:
{
  "categories": [
    {"item": "leite", "section": "Laticínios", "confidence": 0.95},
    {"item": "sabonete", "section": "Higiene", "confidence": 0.88}
  ],
  "uncategorized": ["item rare that doesn't match any category"]
}
`;

			// Generate content with the prompt
			const result = await model.generateContent(prompt);
			const response = result.response;
			const text = response.text();

			// Parse the LLM response
			try {
				// Extract the JSON part from the response if needed
				const jsonMatch = text.match(/\{[\s\S]*\}/);
				const jsonString = jsonMatch ? jsonMatch[0] : text;

				// Parse the JSON response
				const parsedResponse = JSON.parse(jsonString) as CategoryResponse;

				// Validate and normalize the response
				return {
					categories: Array.isArray(parsedResponse.categories)
						? parsedResponse.categories.map((cat) => ({
								item: cat.item.trim().toLowerCase(),
								section: cat.section.trim(),
								confidence:
									typeof cat.confidence === "number"
										? Math.min(Math.max(cat.confidence, 0), 1)
										: 0.5,
							}))
						: [],
					uncategorized: Array.isArray(parsedResponse.uncategorized)
						? parsedResponse.uncategorized.map((item) =>
								item.trim().toLowerCase(),
							)
						: items,
				};
			} catch (parseError) {
				console.error("Failed to parse LLM response:", parseError);
				console.debug("Raw response:", text);

				// Return empty response if parsing fails
				return {
					categories: [],
					uncategorized: items,
				};
			}
		} catch (error) {
			console.error("Error while categorizing items with LLM:", error);

			// Return all items as uncategorized in case of error
			return {
				categories: [],
				uncategorized: items,
			};
		}
	}
}

// Create a singleton instance
const llmService = new LLMService();
export default llmService;
