import { NS } from 'NetscriptDefinitions';
import { getAllHosts } from './scripts/util';
export async function main(ns: NS) {
    ns.run
    const hosts = getAllHosts(ns);
    const files = hosts
        .map((host) => [host, ns.ls(host, '.cct')[0]])
        .filter(([host, file]) => file)
        .map(([host, file]) => ({
            host,
            file,
            type: ns.codingcontract.getContractType(file, host),
            description: ns.codingcontract.getDescription(file, host),
            input: ns.codingcontract.getData(file, host),
            tries: ns.codingcontract.getNumTriesRemaining(file, host)
        }))
        .forEach((contract) => {
            ns.tprint(`${contract.host} - ${contract.file}`);
            ns.tprint(`${contract.type} - ${contract.tries} tries left`);
            ns.tprint(`Input: ${contract.input}`);
            ns.tprint('-----------------------------------------')
        })
}