"use client";

import { motion } from "framer-motion";

interface ItemsInputProps {
	onSubmit: (items: string[]) => void;
}

export function ItemsInput({ onSubmit }: ItemsInputProps) {
	const handleSubmitItems = (value: string) => {
		const parsed = value
			.toLowerCase()
			.split(" ")
			.filter((v) => v.trim() !== "");
		onSubmit(parsed);
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 30 }}
			animate={{ opacity: 1, y: 0 }}
			className="text-center max-w-md w-full"
		>
			<h1 className="text-3xl font-semibold mb-4">
				O que você vai comprar hoje?
			</h1>
			<input
				type="text"
				placeholder="arroz leite sabão tomate..."
				className="w-full border p-3 rounded-xl text-lg shadow"
				onKeyDown={(e) => {
					if (e.key === "Enter") handleSubmitItems(e.currentTarget.value);
				}}
			/>
			<p className="text-sm text-gray-500 mt-2">
				Pressione Enter para continuar
			</p>
		</motion.div>
	);
}
