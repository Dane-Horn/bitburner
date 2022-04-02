import { NS } from "../NetscriptDefinitions";

export async function main(ns: NS) {
    while (true) {
        const player = ns.getPlayer();
        const stats = [
            { stat: 'strength', value: player.strength },
            { stat: 'defense', value: player.defense },
            { stat: 'dexterity', value: player.dexterity },
            { stat: 'agility', value: player.agility }
        ]
            .sort((a, b) => a.value - b.value);
        ns.gymWorkout('powerhouse gym', stats[0].stat, false);
        ns.asleep(10000);
    }
}