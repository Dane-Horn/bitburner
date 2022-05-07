import { NS } from "../NetscriptDefinitions";
import { forEachServer, forEachServerSet } from "./scripts/util";

export async function main(ns: NS) {
    for (const prop in ns) {
        ns.tprint(prop)
    }
    ns.tprint((ns as any).toString())
}
