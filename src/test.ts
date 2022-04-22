import { NS } from "NetscriptDefinitions";
import { getAvailableServers } from 'scripts/util';
export async function main(ns: NS) {
    ns.tprint(getAvailableServers(ns));
}