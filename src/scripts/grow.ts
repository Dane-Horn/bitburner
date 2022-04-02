import { NS } from "NetscriptDefinitions";

export async function main(ns: NS) {
	const [target, delay] = ns.args as [string, number];
	await ns.sleep(delay || 0);
	await ns.grow(target);
}