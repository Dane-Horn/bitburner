import { request } from 'scripts/util.js';

/** @param {NS} ns **/
export async function main(ns) {
    const [ram] = ns.args;
    const response = await request(ns, 1, 2, { type: 'allocate', ram });
    ns.tprint(response);
}