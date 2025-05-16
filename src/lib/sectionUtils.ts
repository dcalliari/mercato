export function findRelevantSections(
	items: string[],
	sections: Section[],
): Section[] {
	if (items.length === 0 || sections.length === 0) return [];

	const normalizedItems = items.map((item) => item.toLowerCase().trim());

	const relevantSections: Section[] = [];

	for (const item of normalizedItems) {
		const sectionsForItem = sections.filter((section) => {
			return section.categories.some((category: string) => {
				return (
					category.toLowerCase().includes(item) ||
					item.includes(category.toLowerCase())
				);
			});
		});

		for (const section of sectionsForItem) {
			if (!relevantSections.some((s) => s.id === section.id)) {
				relevantSections.push(section);
			}
		}
	}

	if (relevantSections.length === 0) {
		return sections;
	}

	return relevantSections;
}
