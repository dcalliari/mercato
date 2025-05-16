export function filterRelevantCategories(
	section: Section,
	items: string[],
): string[] {
	const normalizedItems = items.map((item) => item.toLowerCase().trim());

	return section.categories.filter((category: string) => {
		const lowerCategory = category.toLowerCase();
		return normalizedItems.some(
			(item) => lowerCategory.includes(item) || item.includes(lowerCategory),
		);
	});
}
