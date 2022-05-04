import { NS } from "NetscriptDefinitions";

export async function main(ns: NS) {
    if(ns.singularity.purchaseTor()) {
        const programs = ns.singularity.getDarkwebPrograms()
        for (const program of programs) {
            const purchased = ns.singularity.purchaseProgram(program);
            ns.tprint(`${program} purchased: ${purchased}`)
        }
    }
    
}