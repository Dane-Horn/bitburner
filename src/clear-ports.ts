import { NS } from "NetscriptDefinitions";

export async function main(ns: NS) {
	for (let i = 1; i <= 20; i++) ns.clearPort(i);
}