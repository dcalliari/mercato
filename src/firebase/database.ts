import { ref, get, child } from "firebase/database";
import { database } from "./config";

export const readData = async (path: string) => {
	const snapshot = await get(child(ref(database), path));
	return snapshot.exists() ? snapshot.val() : null;
};
