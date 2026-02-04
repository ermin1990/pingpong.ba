/**
 * Calculate standings for a group of players based on match results
 * Implements comprehensive tie-breaking rules including head-to-head
 * 
 * @param {Array} stats - Array of player statistics objects
 * @param {Array} matches - Array of match objects for head-to-head calculation
 * @param {number} groupIdx - Group index for filtering matches (optional)
 * @returns {Array} Sorted standings array
 */
export const calculateStandings = (stats, matches = [], groupIdx = null) => {
  // Helper function to get head-to-head result between two players
  const getHeadToHead = (player1Id, player2Id) => {
    if (!matches || matches.length === 0) return 0;
    
    const h2hMatch = matches.find(m => {
      if (m.status !== 'completed') return false;
      if (groupIdx !== null && m.groupIdx !== groupIdx) return false;
      
      const isDirectMatch = (
        (m.player1?.id === player1Id && m.player2?.id === player2Id) ||
        (m.player1?.id === player2Id && m.player2?.id === player1Id)
      );
      
      return isDirectMatch;
    });

    if (!h2hMatch) return 0;

    // Return 1 if player1 won, -1 if player2 won, 0 if draw
    if (h2hMatch.player1?.id === player1Id) {
      return h2hMatch.player1Score > h2hMatch.player2Score ? 1 : 
             h2hMatch.player1Score < h2hMatch.player2Score ? -1 : 0;
    } else {
      return h2hMatch.player2Score > h2hMatch.player1Score ? 1 :
             h2hMatch.player2Score < h2hMatch.player1Score ? -1 : 0;
    }
  };

  return stats.sort((a, b) => {
    // 1. Points (from wins/losses)
    if (b.points !== a.points) return b.points - a.points;
    
    // 2. Set difference (setsWon - setsLost)
    const aSetDiff = a.setsWon - a.setsLost;
    const bSetDiff = b.setsWon - b.setsLost;
    if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;

    // 3. Game difference (Gem±)
    if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;

    // 4. Total sets won
    if (b.setsWon !== a.setsWon) return b.setsWon - a.setsWon;

    // 5. Total matches won
    if (b.won !== a.won) return b.won - a.won;

    // 6. Head-to-head result (NEW)
    const h2h = getHeadToHead(a.id, b.id);
    if (h2h !== 0) return h2h; // 1 means a won, -1 means b won

    // 7. If all else equal, maintain current order
    return 0;
  });
};

/**
 * Initialize empty player statistics object
 * 
 * @param {Object} player - Player object with id and name
 * @returns {Object} Statistics object with all counters at 0
 */
export const initPlayerStats = (player) => ({
  id: player.id,
  name: player.name,
  club: player.club || '',
  played: 0,
  won: 0,
  lost: 0,
  setsWon: 0,
  setsLost: 0,
  points: 0,
  pointDiff: 0
});

/**
 * Update player statistics based on match result
 * 
 * @param {Object} stats - Player statistics object
 * @param {Object} match - Match object with scores
 * @param {boolean} isPlayer1 - Whether this is player1 in the match
 * @param {number} winPts - Points awarded for win
 * @param {number} lossPts - Points awarded for loss
 * @returns {Object} Updated statistics object
 */
export const updateStatsFromMatch = (stats, match, isPlayer1, winPts = 2, lossPts = 0) => {
  const playerScore = isPlayer1 ? match.player1Score : match.player2Score;
  const opponentScore = isPlayer1 ? match.player2Score : match.player1Score;

  stats.played++;
  stats.setsWon += (playerScore || 0);
  stats.setsLost += (opponentScore || 0);

  // Calculate game point difference from sets
  if (match.sets && Array.isArray(match.sets) && match.sets.length > 0) {
    match.sets.forEach(set => {
      const p1Points = set.p1 || 0;
      const p2Points = set.p2 || 0;
      if (isPlayer1) {
        stats.pointDiff += p1Points - p2Points;
      } else {
        stats.pointDiff += p2Points - p1Points;
      }
    });
  }

  // Update win/loss/points
  if (playerScore > opponentScore) {
    stats.won++;
    stats.points += winPts;
  } else if (playerScore < opponentScore) {
    stats.lost++;
    stats.points += lossPts;
  }

  return stats;
};
