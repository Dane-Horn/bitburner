import { NS } from "../NetscriptDefinitions";
const _ = require('./lodash.js')
export async function main(ns: NS) {
    ns.tprint(_.clamp(-10, 0, 100))
}
