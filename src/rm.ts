import { NS } from "../NetscriptDefinitions";

export async function main(ns: NS) {
    const files = ns.ls('home', '.js')
        .filter((file) => file != 'rm.js');
    for (const file of files) {
        ns.rm(file);
    }
}