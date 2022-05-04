import { globalAgent } from "http";
import { NS } from "../NetscriptDefinitions";

export async function main(ns: NS) {
    const memberNames = ns.gang.getMemberNames();
    const members = memberNames
        .map(name => ns.gang.getMemberInformation(name))
    const allEquipment = ns.gang.getEquipmentNames()
    for (const member of members) {
        const unpurchasedEquipment = allEquipment
            .filter(equipment => !member.upgrades.includes(equipment))
        for (const equipment of unpurchasedEquipment) {
            const purchased = ns.gang.purchaseEquipment(member.name, equipment)
            if (purchased)
                ns.tprint(`purchased ${equipment} for ${member.name}`)
        }
    }
}
