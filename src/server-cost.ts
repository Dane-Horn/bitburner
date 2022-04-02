import { NS } from "NetscriptDefinitions";
export async function main(ns: NS) {
	const [ram] = ns.args as [number];
	const cost = ns.getPurchasedServerCost(ram);
	ns.tprint(cost);
}