import { hwgw, getDelays, request } from 'scripts/util.js'

/** @param {NS} ns **/
export async function main(ns) {
	const [target, hackThreads] = ns.args;
	const delay = 1000;
	const hackScript = `/scripts/trueHack.js`;
	const growScript = `/scripts/trueGrow.js`;
	const weakenScript = `/scripts/trueWeaken.js`;
	const batchDetails = hwgw(ns, target, hackThreads, hackScript, growScript, weakenScript);
	const { allocatedServer: hackServer } = await request(ns, 1, 2, { type: 'allocate', ram: batchDetails.hack.cost });
	const { allocatedServer: growServer } = await request(ns, 1, 2, { type: 'allocate', ram: batchDetails.grow.cost });
	const { allocatedServer: hackWeakenServer } = await request(ns, 1, 2, { type: 'allocate', ram: batchDetails.hackWeaken.cost });
	const { allocatedServer: growWeakenServer } = await request(ns, 1, 2, { type: 'allocate', ram: batchDetails.growWeaken.cost });
	await ns.scp(hackScript, hackServer);
	await ns.scp('/scripts/util.js', hackServer);
	await ns.scp(growScript, growServer);
	await ns.scp('/scripts/util.js', growServer);
	await ns.scp(weakenScript, hackWeakenServer);
	await ns.scp('/scripts/util.js', hackWeakenServer);
	await ns.scp(weakenScript, growWeakenServer);
	await ns.scp('/scripts/util.js', growWeakenServer);
	const { hackDelay, growDelay, weakenDelay } = getDelays(ns, target);
	ns.exec(hackScript, hackServer, batchDetails.hack.threads, target, hackDelay, 'hack');
	await ns.asleep(delay);
	ns.exec(weakenScript, hackWeakenServer, batchDetails.hackWeaken.threads, target, weakenDelay, 'hackWeaken');
	await ns.asleep(delay);
	ns.exec(growScript, growServer, batchDetails.grow.threads, target, growDelay, 'grow');
	await ns.asleep(delay);
	ns.exec(weakenScript, growWeakenServer, batchDetails.growWeaken.threads, target, weakenDelay, 'growWeaken');
}