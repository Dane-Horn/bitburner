import { noWaitRequest } from 'scripts/util.js';

/** @param {NS} ns **/
export async function main(ns) {
	const [server, ram] = ns.args;
	await noWaitRequest(ns, 1, { type: 'free', server, ram });
}