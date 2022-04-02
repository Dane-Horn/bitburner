import { NS } from "NetscriptDefinitions";
import { stringify } from "querystring";

export async function main(ns: NS) {
    const [name, maxPrice] = ns.args as [string, number];
    let ram = 2;
    while (ns.getPurchasedServerCost(ram) < maxPrice) ram = ram * 2;
    if (ns.getPurchasedServerCost(ram) > maxPrice) ram = ram / 2;
    const promptResult = await ns.prompt(`buy server with prefix ${name} and ${ram}GB for ${ns.getPurchasedServerCost(ram)}?`, { type: 'boolean' });
    if (promptResult) ns.purchaseServer(name, ram);
}