import { hwgw, getDelays, generateUuid, request } from 'scripts/util.js'

const delay = 1000;
const hackScript = `/scripts/hack.js`;
const growScript = `/scripts/grow.js`;
const weakenScript = `/scripts/weaken.js`;


/** @param {NS} ns **/
export async function main(ns) {
	let [target, hackThreads, batches] = ns.args;
	batches = batches || 1;
	while (true) {
		const batchDetails = hwgw(ns, target, hackThreads, hackScript, growScript, weakenScript);
		const { hackDelay, growDelay, weakenDelay, longestTime } = getDelays(ns, target);
		for (let i = 0; i < batches; i++)
			await runBatch(ns, batchDetails, target, hackDelay, growDelay, weakenDelay, delay);
		await ns.asleep(longestTime);
	}
}

async function runBatch(ns, batchDetails, target, hackDelay, growDelay, weakenDelay, delay) {
	const { pid: hackPid } = batchDetails.hack.threads > 0
		? await request(ns, 1, 2, {
			type: 'allocate',
			script: hackScript,
			threads: batchDetails.hack.threads,
			args: [target, hackDelay, 'hack', generateUuid()],
		})
		: { pid: 0 };
	await ns.asleep(delay);
	const { pid: hackWeakenPid } = batchDetails.hackWeaken.threads > 0 ?
		await request(ns, 1, 2, {
			type: 'allocate',
			script: weakenScript,
			threads: batchDetails.hackWeaken.threads,
			args: [target, weakenDelay, 'hackWeaken', generateUuid()],
		})
		: { pid: 0 };
	await ns.asleep(delay);
	const { pid: growPid } = batchDetails.grow.threads > 0
		? await request(ns, 1, 2, {
			type: 'allocate',
			script: growScript,
			threads: batchDetails.grow.threads,
			args: [target, growDelay, 'grow', generateUuid()],
		})
		: { pid: 0 };
	await ns.asleep(delay);
	const { pid: growWeakenPid } = batchDetails.growWeaken.threads > 0
		? await request(ns, 1, 2, {
			type: 'allocate',
			script: weakenScript,
			threads: batchDetails.growWeaken.threads,
			args: [target, weakenDelay, 'growWeaken', generateUuid()],
		})
		: { pid: 0 };
	if (!hackPid || !hackWeakenPid || !growPid || !growWeakenPid) {
		ns.kill(hackPid);
		ns.kill(hackWeakenPid);
		ns.kill(growPid);
		ns.kill(growWeakenPid);
		ns.exit();
	}
	await ns.asleep(delay);
}