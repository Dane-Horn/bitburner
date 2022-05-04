import { NS } from "../NetscriptDefinitions";

export async function main(ns: NS) {
    ns.tprint(Object.keys(ns))
    ns.tprint((ns as any).heart.break())

}
