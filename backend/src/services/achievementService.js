const pool = require('../db');

const CATEGORY_BY_CODE = {
  five_collaboration_received: 'Colaboración',
  five_academic_received: 'Académico',
  five_leadership_received: 'Liderazgo',
  five_creativity_received: 'Creatividad',
};

function normalizeCount(value) {
  return Number(value || 0);
}

function inferTargetCategory(definition) {
  if (definition?.extra_condition?.category) {
    return definition.extra_condition.category;
  }

  if (CATEGORY_BY_CODE[definition.code]) {
    return CATEGORY_BY_CODE[definition.code];
  }

  return null;
}

async function getUserStats(userId) {
  const userResult = await pool.query(
    `
    SELECT
      id,
      display_name,
      fullname,
      bio,
      profile_image_url,
      cover_image_url,
      location,
      birth_date
    FROM users
    WHERE id = $1
    `,
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new Error('Usuario no encontrado para calcular progreso.');
  }

  const user = userResult.rows[0];

  const recognitionsSentResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM recognitions WHERE sender_id = $1`,
    [userId]
  );

  const recognitionsReceivedResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM recognitions WHERE receiver_id = $1`,
    [userId]
  );

  const reactionsReceivedResult = await pool.query(
    `
    SELECT COUNT(*)::int AS total
    FROM recognition_reactions rr
    INNER JOIN recognitions r ON rr.recognition_id = r.id
    WHERE r.receiver_id = $1
      AND rr.user_id <> $1
    `,
    [userId]
  );

  const commentsReceivedResult = await pool.query(
    `
    SELECT COUNT(*)::int AS total
    FROM recognition_comments rc
    INNER JOIN recognitions r ON rc.recognition_id = r.id
    WHERE r.receiver_id = $1
      AND rc.user_id <> $1
    `,
    [userId]
  );

  const achievementsUnlockedResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM user_achievements WHERE user_id = $1`,
    [userId]
  );

  const badgesCountResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM user_badges WHERE user_id = $1`,
    [userId]
  );

  const receivedByCategoryResult = await pool.query(
    `
    SELECT category, COUNT(*)::int AS total
    FROM recognitions
    WHERE receiver_id = $1
    GROUP BY category
    `,
    [userId]
  );

  const receivedByCategory = {
    Colaboración: 0,
    Académico: 0,
    Liderazgo: 0,
    Creatividad: 0,
  };

  receivedByCategoryResult.rows.forEach((row) => {
    if (receivedByCategory[row.category] !== undefined) {
      receivedByCategory[row.category] = Number(row.total || 0);
    }
  });

  const profileCompleted = Boolean(
    (user.display_name || user.fullname) &&
      user.bio &&
      user.profile_image_url
  );

  return {
    user,
    recognitionsSent: normalizeCount(recognitionsSentResult.rows[0]?.total),
    recognitionsReceived: normalizeCount(recognitionsReceivedResult.rows[0]?.total),
    reactionsReceived: normalizeCount(reactionsReceivedResult.rows[0]?.total),
    commentsReceived: normalizeCount(commentsReceivedResult.rows[0]?.total),
    achievementsUnlocked: normalizeCount(achievementsUnlockedResult.rows[0]?.total),
    badgesCount: normalizeCount(badgesCountResult.rows[0]?.total),
    receivedByCategory,
    profileCompleted,
  };
}

function doesAchievementApply(definition, stats) {
  switch (definition.condition_type) {
    case 'recognitions_sent':
      return stats.recognitionsSent >= definition.condition_value;

    case 'recognitions_received':
      return stats.recognitionsReceived >= definition.condition_value;

    case 'reactions_received':
      return stats.reactionsReceived >= definition.condition_value;

    case 'comments_received':
      return stats.commentsReceived >= definition.condition_value;

    case 'achievements_unlocked':
      return stats.achievementsUnlocked >= definition.condition_value;

    case 'profile_completed':
      return stats.profileCompleted === true;

    case 'category_received': {
      const targetCategory = inferTargetCategory(definition);
      if (!targetCategory) return false;
      return normalizeCount(stats.receivedByCategory[targetCategory]) >= definition.condition_value;
    }

    default:
      return false;
  }
}

async function unlockAchievement({
  userId,
  achievementId,
  sourceType = null,
  sourceId = null,
}) {
  const result = await pool.query(
    `
    INSERT INTO user_achievements (
      user_id,
      achievement_id,
      source_type,
      source_id
    )
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id, achievement_id) DO NOTHING
    RETURNING *
    `,
    [userId, achievementId, sourceType, sourceId]
  );

  return result.rows[0] || null;
}

async function syncRewardStatus(userId) {
  const achievementsCountResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM user_achievements WHERE user_id = $1`,
    [userId]
  );

  const badgesCountResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM user_badges WHERE user_id = $1`,
    [userId]
  );

  const achievementsCount = normalizeCount(achievementsCountResult.rows[0]?.total);
  const badgesCount = normalizeCount(badgesCountResult.rows[0]?.total);

  let currentRewardTier = null;
  let isRewardEligible = false;

  if (achievementsCount >= 40 && badgesCount >= 5) {
    currentRewardTier = 'diamond';
    isRewardEligible = true;
  } else if (achievementsCount >= 30 && badgesCount >= 3) {
    currentRewardTier = 'crimson_ruby';
    isRewardEligible = true;
  } else if (achievementsCount >= 20 && badgesCount >= 2) {
    currentRewardTier = 'gold';
    isRewardEligible = true;
  } else if (achievementsCount >= 10 && badgesCount >= 1) {
    currentRewardTier = 'silver';
    isRewardEligible = true;
  } else if (achievementsCount >= 5) {
    currentRewardTier = 'copper';
    isRewardEligible = false;
  }

  const result = await pool.query(
    `
    INSERT INTO user_reward_status (
      user_id,
      achievements_count,
      badges_count,
      current_reward_tier,
      is_reward_eligible,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id)
    DO UPDATE SET
      achievements_count = EXCLUDED.achievements_count,
      badges_count = EXCLUDED.badges_count,
      current_reward_tier = EXCLUDED.current_reward_tier,
      is_reward_eligible = EXCLUDED.is_reward_eligible,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
    `,
    [
      userId,
      achievementsCount,
      badgesCount,
      currentRewardTier,
      isRewardEligible,
    ]
  );

  return result.rows[0];
}

async function syncUnlockedFrames(userId) {
  const achievementsCountResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM user_achievements WHERE user_id = $1`,
    [userId]
  );

  const badgesCountResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM user_badges WHERE user_id = $1`,
    [userId]
  );

  const achievementsCount = normalizeCount(achievementsCountResult.rows[0]?.total);
  const badgesCount = normalizeCount(badgesCountResult.rows[0]?.total);

  const frameDefinitionsResult = await pool.query(
    `
    SELECT *
    FROM avatar_frame_definitions
    WHERE is_active = TRUE
    ORDER BY display_order ASC, id ASC
    `
  );

  const existingFramesResult = await pool.query(
    `
    SELECT
      uaf.id,
      uaf.user_id,
      uaf.frame_id,
      uaf.unlocked_at,
      uaf.is_equipped,
      afd.code,
      afd.name,
      afd.description,
      afd.image_url,
      afd.rarity,
      afd.display_order
    FROM user_avatar_frames uaf
    INNER JOIN avatar_frame_definitions afd ON afd.id = uaf.frame_id
    WHERE uaf.user_id = $1
    ORDER BY afd.display_order ASC, afd.id ASC
    `,
    [userId]
  );

  const existingFrameIds = new Set(existingFramesResult.rows.map((row) => Number(row.frame_id)));
  const newlyUnlockedFrames = [];

  for (const frame of frameDefinitionsResult.rows) {
    const meetsRequirements =
      achievementsCount >= Number(frame.required_achievements_count || 0) &&
      badgesCount >= Number(frame.required_badges_count || 0);

    if (meetsRequirements && !existingFrameIds.has(Number(frame.id))) {
      const inserted = await pool.query(
        `
        INSERT INTO user_avatar_frames (user_id, frame_id, is_equipped)
        VALUES ($1, $2, FALSE)
        RETURNING *
        `,
        [userId, frame.id]
      );

      if (inserted.rows.length > 0) {
        newlyUnlockedFrames.push({
          ...frame,
          unlocked_at: inserted.rows[0].unlocked_at,
        });
      }
    }
  }

  const allUnlockedFramesResult = await pool.query(
    `
    SELECT
      uaf.id,
      uaf.user_id,
      uaf.frame_id,
      uaf.unlocked_at,
      uaf.is_equipped,
      afd.code,
      afd.name,
      afd.description,
      afd.image_url,
      afd.rarity,
      afd.display_order
    FROM user_avatar_frames uaf
    INNER JOIN avatar_frame_definitions afd ON afd.id = uaf.frame_id
    WHERE uaf.user_id = $1
    ORDER BY afd.display_order ASC, afd.id ASC
    `,
    [userId]
  );

  let equippedFrame = null;

  if (allUnlockedFramesResult.rows.length > 0) {
    const highestFrame = allUnlockedFramesResult.rows[allUnlockedFramesResult.rows.length - 1];

    await pool.query(
      `UPDATE user_avatar_frames SET is_equipped = FALSE WHERE user_id = $1`,
      [userId]
    );

    await pool.query(
      `
      UPDATE user_avatar_frames
      SET is_equipped = TRUE
      WHERE user_id = $1 AND frame_id = $2
      `,
      [userId, highestFrame.frame_id]
    );

    equippedFrame = highestFrame;
  }

  return {
    newlyUnlockedFrames,
    equippedFrame,
  };
}

async function evaluateAndUnlockAchievementsForUser(
  userId,
  { sourceType = null, sourceId = null } = {}
) {
  const newlyUnlockedAchievements = [];
  let loopGuard = 0;
  let shouldRecheck = true;

  while (shouldRecheck && loopGuard < 5) {
    loopGuard += 1;
    shouldRecheck = false;

    const stats = await getUserStats(userId);

    const definitionsResult = await pool.query(
      `
      SELECT *
      FROM achievement_definitions
      WHERE is_active = TRUE
      ORDER BY id ASC
      `
    );

    const existingAchievementsResult = await pool.query(
      `
      SELECT achievement_id
      FROM user_achievements
      WHERE user_id = $1
      `,
      [userId]
    );

    const existingIds = new Set(
      existingAchievementsResult.rows.map((row) => Number(row.achievement_id))
    );

    for (const definition of definitionsResult.rows) {
      if (existingIds.has(Number(definition.id))) continue;

      const applies = doesAchievementApply(definition, stats);

      if (!applies) continue;

      const inserted = await unlockAchievement({
        userId,
        achievementId: definition.id,
        sourceType,
        sourceId,
      });

      if (inserted) {
        newlyUnlockedAchievements.push({
          ...definition,
          unlocked_at: inserted.unlocked_at,
        });
        shouldRecheck = true;
      }
    }
  }

  const rewardStatus = await syncRewardStatus(userId);
  const frameState = await syncUnlockedFrames(userId);

  return {
    newlyUnlockedAchievements,
    newlyUnlockedFrames: frameState.newlyUnlockedFrames,
    equippedFrame: frameState.equippedFrame,
    rewardStatus,
  };
}

async function getUserAchievements(userId) {
  const result = await pool.query(
    `
    SELECT
      ad.id,
      ad.code,
      ad.title,
      ad.description,
      ad.icon,
      ad.category,
      ad.rarity,
      ad.condition_type,
      ad.condition_value,
      ad.extra_condition,
      ad.is_active,
      ua.unlocked_at,
      CASE WHEN ua.id IS NOT NULL THEN TRUE ELSE FALSE END AS is_unlocked
    FROM achievement_definitions ad
    LEFT JOIN user_achievements ua
      ON ua.achievement_id = ad.id
     AND ua.user_id = $1
    WHERE ad.is_active = TRUE
    ORDER BY ad.id ASC
    `,
    [userId]
  );

  return result.rows;
}

async function getUserBadges(userId) {
  const result = await pool.query(
    `
    SELECT
      ub.id,
      ub.user_id,
      ub.badge_id,
      ub.assigned_by_user_id,
      ub.reason,
      ub.assigned_at,
      bd.code,
      bd.name,
      bd.description,
      bd.image_url,
      bd.category,
      bd.rarity,
      COALESCE(u.display_name, u.fullname) AS assigned_by_name
    FROM user_badges ub
    INNER JOIN badge_definitions bd ON bd.id = ub.badge_id
    INNER JOIN users u ON u.id = ub.assigned_by_user_id
    WHERE ub.user_id = $1
    ORDER BY ub.assigned_at DESC
    `,
    [userId]
  );

  return result.rows;
}

async function getUserFrames(userId) {
  const result = await pool.query(
    `
    SELECT
      afd.id,
      afd.code,
      afd.name,
      afd.description,
      afd.image_url,
      afd.rarity,
      afd.required_achievements_count,
      afd.required_badges_count,
      afd.display_order,
      CASE WHEN uaf.id IS NOT NULL THEN TRUE ELSE FALSE END AS is_unlocked,
      COALESCE(uaf.is_equipped, FALSE) AS is_equipped,
      uaf.unlocked_at
    FROM avatar_frame_definitions afd
    LEFT JOIN user_avatar_frames uaf
      ON uaf.frame_id = afd.id
     AND uaf.user_id = $1
    WHERE afd.is_active = TRUE
    ORDER BY afd.display_order ASC, afd.id ASC
    `,
    [userId]
  );

  return result.rows;
}

async function getUserProgressSummary(userId) {
  const stats = await getUserStats(userId);

  const rewardStatusResult = await pool.query(
    `SELECT * FROM user_reward_status WHERE user_id = $1`,
    [userId]
  );

  const equippedFrameResult = await pool.query(
    `
    SELECT
      afd.id,
      afd.code,
      afd.name,
      afd.description,
      afd.image_url,
      afd.rarity,
      afd.display_order
    FROM user_avatar_frames uaf
    INNER JOIN avatar_frame_definitions afd ON afd.id = uaf.frame_id
    WHERE uaf.user_id = $1
      AND uaf.is_equipped = TRUE
    LIMIT 1
    `,
    [userId]
  );

  return {
    counts: {
      recognitions_sent: stats.recognitionsSent,
      recognitions_received: stats.recognitionsReceived,
      reactions_received: stats.reactionsReceived,
      comments_received: stats.commentsReceived,
      achievements_unlocked: stats.achievementsUnlocked,
      badges_count: stats.badgesCount,
      category_received: stats.receivedByCategory,
    },
    profile_completed: stats.profileCompleted,
    reward_status: rewardStatusResult.rows[0] || null,
    equipped_frame: equippedFrameResult.rows[0] || null,
  };
}

async function assignBadgeToUser({
  targetUserId,
  badgeId,
  assignedByUserId,
  reason = null,
}) {
  const assignerResult = await pool.query(
    `SELECT id, role FROM users WHERE id = $1`,
    [assignedByUserId]
  );

  if (assignerResult.rows.length === 0) {
    throw new Error('El usuario que intenta asignar la insignia no existe.');
  }

  if (assignerResult.rows[0].role !== 'teacher') {
    throw new Error('Solo los maestros pueden asignar insignias.');
  }

  const targetUserResult = await pool.query(
    `SELECT id FROM users WHERE id = $1`,
    [targetUserId]
  );

  if (targetUserResult.rows.length === 0) {
    throw new Error('El usuario destino no existe.');
  }

  const badgeDefinitionResult = await pool.query(
    `
    SELECT *
    FROM badge_definitions
    WHERE id = $1
      AND is_active = TRUE
    `,
    [badgeId]
  );

  if (badgeDefinitionResult.rows.length === 0) {
    throw new Error('La insignia seleccionada no existe o está inactiva.');
  }

  const insertedResult = await pool.query(
    `
    INSERT INTO user_badges (
      user_id,
      badge_id,
      assigned_by_user_id,
      reason
    )
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id, badge_id) DO NOTHING
    RETURNING *
    `,
    [targetUserId, badgeId, assignedByUserId, reason || null]
  );

  const alreadyAssigned = insertedResult.rows.length === 0;

  const badge = badgeDefinitionResult.rows[0];

  const rewardStatus = await syncRewardStatus(targetUserId);
  const frameState = await syncUnlockedFrames(targetUserId);

  return {
    alreadyAssigned,
    badge,
    rewardStatus,
    newlyUnlockedFrames: frameState.newlyUnlockedFrames,
    equippedFrame: frameState.equippedFrame,
  };
}

module.exports = {
  getUserStats,
  evaluateAndUnlockAchievementsForUser,
  getUserAchievements,
  getUserBadges,
  getUserFrames,
  getUserProgressSummary,
  assignBadgeToUser,
  syncRewardStatus,
  syncUnlockedFrames,
};