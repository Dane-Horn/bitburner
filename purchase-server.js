/** @param {NS} ns **/
export async function main(ns) {
	const [name, ram] = ns.args;
	const promptResult = await ns.prompt(`buy server with prefix ${name} and ${ram}GB for ${ns.getPurchasedServerCost(ram)}?`, {type: 'boolean'});
	if(promptResult) ns.purchaseServer(name, ram);
}