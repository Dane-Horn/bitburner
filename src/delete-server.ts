import { NS } from "NetscriptDefinitions";

/** @param {NS} ns **/
export async function main(ns: NS) {
	const [target] = ns.args as [string];
	const ok = await ns.prompt(`Are you sure you want to delete ${target}?`);
	if (ok) ns.deleteServer(target);
}