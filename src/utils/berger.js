/**
 * Bergerov sistem (Round Robin) algoritam.
 * Generiše parove za svako kolo.
 * 
 * @param {Array} players - Lista ID-ova ili objekata igrača.
 * @returns {Array} rounds - Niz kola, svako kolo sadrži niz mečeva.
 */
export function generateBergerMatches(players) {
  let participants = [...players];
  
  // Ako je neparan broj igrača, dodajemo "BYE" (slobodan igrač)
  if (participants.length % 2 !== 0) {
    participants.push({ id: 'bye', name: 'SLOBODAN', isBye: true });
  }

  const n = participants.length;
  const numRounds = n - 1;
  const matchesPerRound = n / 2;
  const rounds = [];

  for (let round = 0; round < numRounds; round++) {
    const roundMatches = [];
    
    for (let i = 0; i < matchesPerRound; i++) {
        const home = participants[i];
        const away = participants[n - 1 - i];

        // Preskoči mečeve protiv "slobodnog" igrača (oni se ne igraju)
        if (!home.isBye && !away.isBye) {
            roundMatches.push({
                player1: { id: home.id, name: home.name },
                player2: { id: away.id, name: away.name },
                round: round + 1,
                status: 'pending'
            });
        }
    }

    rounds.push({
        roundNumber: round + 1,
        matches: roundMatches
    });

    // Rotacija igrača (fiksan prvi, ostali se rotiraju)
    // participants = [p0, p1, p2, p3] -> [p0, p3, p1, p2]
    const last = participants.pop();
    participants.splice(1, 0, last);
  }

  return rounds;
}
