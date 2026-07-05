const db = require('../db');

async function calculateMatches(userId) {
  // 1. fetch target user active listings
  const targetListingsRes = await db.query(
    'SELECT * FROM listings WHERE user_id = $1 AND is_active = true',
    [userId]
  );
  const targetListings = targetListingsRes.rows;

  const targetOfferings = targetListings.filter(l => l.type === 'offering').map(l => l.skill_id);
  const targetSeekings = targetListings.filter(l => l.type === 'seeking').map(l => l.skill_id);

  if (targetOfferings.length === 0 && targetSeekings.length === 0) {
    return [];
  }

  // 2. fetch potential match candidates (active, non-suspended, other users)
  const candidatesRes = await db.query(
    `SELECT DISTINCT u.id, u.username, u.bio, u.profile_picture_url
     FROM users u
     JOIN listings l ON u.id = l.user_id
     WHERE u.id != $1 AND u.is_suspended = false AND l.is_active = true`,
    [userId]
  );
  const candidates = candidatesRes.rows;

  const matches = [];

  for (const candidate of candidates) {
    // Get candidate active listings with skill names
    const candListingsRes = await db.query(
      `SELECT l.*, s.name as skill_name, s.category as skill_category 
       FROM listings l
       JOIN skills s ON l.skill_id = s.id
       WHERE l.user_id = $1 AND l.is_active = true`,
      [candidate.id]
    );
    const candListings = candListingsRes.rows;

    const candOfferings = candListings.filter(l => l.type === 'offering').map(l => l.skill_id);
    const candSeekings = candListings.filter(l => l.type === 'seeking').map(l => l.skill_id);

    let score = 0;
    const reasons = [];

    // Rule 1: Mutual Swap
    const canTeachCandidate = targetOfferings.some(id => candSeekings.includes(id));
    const candidateCanTeachMe = candOfferings.some(id => targetSeekings.includes(id));

    if (canTeachCandidate && candidateCanTeachMe) {
      score += 100;
      reasons.push('Mutual Swap Available');
    } else if (candidateCanTeachMe) {
      score += 30;
      reasons.push('Teaches a skill you seek');
    } else if (canTeachCandidate) {
      score += 15;
      reasons.push('Seeks a skill you offer');
    }

    // Rule 2: Ratings Check
    const ratingsRes = await db.query(
      'SELECT AVG(rating)::numeric(3,2) as avg_rating FROM reviews WHERE reviewee_id = $1',
      [candidate.id]
    );
    const avgRating = parseFloat(ratingsRes.rows[0].avg_rating);
    if (avgRating) {
      const bonus = Math.round(avgRating * 10);
      score += bonus;
      reasons.push(`Highly rated teacher (${avgRating}★)`);
    }

    // Rule 3: availability Check
    let overlapCount = 0;
    for (const tListing of targetListings) {
      const tAvail = tListing.availability || { days: [], times: [] };
      for (const cListing of candListings) {
        const cAvail = cListing.availability || { days: [], times: [] };
        
        const matchingDays = (tAvail.days || []).filter(d => (cAvail.days || []).includes(d));
        const matchingTimes = (tAvail.times || []).filter(t => (cAvail.times || []).includes(t));

        overlapCount += (matchingDays.length + matchingTimes.length);
      }
    }

    if (overlapCount > 0) {
      score += (overlapCount * 10);
      reasons.push(`${overlapCount} overlapping day/time slot(s)`);
    }

    if (score > 0) {
      matches.push({
        candidate: {
          id: candidate.id,
          username: candidate.username,
          bio: candidate.bio,
          profile_picture_url: candidate.profile_picture_url
        },
        listings: candListings,
        score,
        reasons
      });
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}

module.exports = { calculateMatches };