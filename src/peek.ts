import { NS } from "NetscriptDefinitions";

export async function main(ns: NS) {
    const [port] = ns.args as [number];
	ns.tprint(ns.peek(port));
}