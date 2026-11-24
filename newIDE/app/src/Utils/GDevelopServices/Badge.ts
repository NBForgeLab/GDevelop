import axios from 'axios';
import { GDevelopUserApi } from './ApiConfigs';
import { type Profile } from './Authentication';
import { type MessageByLocale } from '../i18n/MessageByLocale';

import { type AuthenticatedUser } from '../../Profile/AuthenticatedUserContext';
import { extractGDevelopApiErrorStatusAndCode } from './Errors';
import {
  ensureIsArray,
  ensureIsNullOrObjectHasProperty,
} from '../DataValidator';

export const TRIVIAL_FIRST_EVENT = 'trivial_first-event';
export const TRIVIAL_FIRST_BEHAVIOR = 'trivial_first-behavior';
export const TRIVIAL_FIRST_PREVIEW = 'trivial_first-preview';
export const TRIVIAL_FIRST_WEB_EXPORT = 'trivial_first-web-export';
export const TRIVIAL_FIRST_EXTENSION = 'trivial_first-extension';
export const TRIVIAL_FIRST_EFFECT = 'trivial_first-effect';
export const TRIVIAL_FIRST_DEBUG = 'trivial_first-debug';
export const getTutorialCompletedAchievementId = (tutorialId: string): string =>
  'trivial_in-app-tutorial-completed_' + tutorialId;

export type Badge = {
  seen: boolean;
  unlockedAt: string;
  userId: string;
  achievementId: string;
};

export type Achievement = {
  id: string;
  category: string;
  nameByLocale: MessageByLocale;
  descriptionByLocale: MessageByLocale;
  shortDescriptionByLocale: MessageByLocale;
  rewardValueInCredits?: number;
  iconUrl?: string;
};

export type AchievementWithBadgeData = Achievement & {
  seen?: boolean;
  unlockedAt: Date | null | undefined;
};

const isAchievementAlreadyClaimed = (
  badges: Badge[],
  achievementId: string
): boolean => {
  return badges.map((badge) => badge.achievementId).includes(achievementId);
};

export const createOrEnsureBadgeForUser = async (
  {
    badges,
    profile,
    getAuthorizationHeader,
    onBadgesChanged,
  }: {
    badges: Array<Badge> | null | undefined;
    profile: Profile | null | undefined;
    getAuthorizationHeader: () => Promise<string>;
    onBadgesChanged: () => Promise<void>;
  },
  achievementId: string
): Promise<Badge | null | undefined> => {
  if (!badges || !profile) return null;
  if (isAchievementAlreadyClaimed(badges, achievementId)) {
    return null;
  }

  const userId = profile.id;
  try {
    const authorizationHeader = await getAuthorizationHeader();
    const response = await axios.post(
      `${GDevelopUserApi.baseUrl}/user/${userId}/badge`,
      {
        achievementId,
      },
      {
        params: {
          userId,
        },
        headers: {
          Authorization: authorizationHeader,
        },
      }
    );
    onBadgesChanged();
    return ensureIsNullOrObjectHasProperty({
      data: response.data,
      propertyName: 'achievementId',
      endpointName: '/user/{id}/badge of User API',
    });
  } catch (error) {
    const extractedStatusAndCode = extractGDevelopApiErrorStatusAndCode(error);
    if (extractedStatusAndCode && extractedStatusAndCode.status === 409) {
      console.warn('Badge already exists');
      return;
    } else {
      throw error;
    }
  }
};

/**
 * Check if user has already claimed the achievement, to avoid executing
 * any extra code if that's the case.
 */
export const addCreateBadgePreHookIfNotClaimed = <
  T extends (...args: Array<any>) => any,
>(
  authenticatedUser: AuthenticatedUser,
  achievementId: string,
  callback: T
): T => {
  const { badges } = authenticatedUser;
  if (!badges) return callback;
  if (isAchievementAlreadyClaimed(badges, achievementId)) {
    return callback;
  }

  return ((...args: Parameters<T>): ReturnType<T> => {
    try {
      createOrEnsureBadgeForUser(authenticatedUser, achievementId);
    } catch (err) {
      console.error(`Couldn't create badge ${achievementId}; ${err}`);
    }
    return callback.apply(null, args);
  }) as T;
};

export const getAchievements = async (): Promise<Array<Achievement>> => {
  const response = await axios.get(`${GDevelopUserApi.baseUrl}/achievement`);

  return ensureIsArray({
    data: response.data,
    endpointName: '/achievement of User API',
  });
};

export const markBadgesAsSeen = async (
  authenticatedUser: AuthenticatedUser
): Promise<undefined | null> => {
  const { badges, firebaseUser, getAuthorizationHeader, onBadgesChanged } =
    authenticatedUser;
  if (!badges || !firebaseUser) return null;

  const unseenBadges = badges.filter((badge) => !badge.seen);
  if (unseenBadges.length === 0) return;

  const userId = firebaseUser.uid;
  try {
    const authorizationHeader = await getAuthorizationHeader();
    const response = await axios.patch(
      `${GDevelopUserApi.baseUrl}/user/${userId}/badge`,
      unseenBadges.map((badge) => ({
        achievementId: badge.achievementId,
        seen: true,
      })),
      {
        params: {
          userId,
        },
        headers: {
          Authorization: authorizationHeader,
        },
      }
    );
    onBadgesChanged();
    const data = response.data;
    // Note: response.data might be undefined for PATCH requests, so we don't validate it
    return data;
  } catch (err) {
    console.error(`Couldn't mark badges as seen: ${err}`);
    return;
  }
};

export const compareAchievements = (
  a: AchievementWithBadgeData,
  b: AchievementWithBadgeData
): number => {
  if (b.unlockedAt && a.unlockedAt) {
    return b.unlockedAt.getTime() - a.unlockedAt.getTime();
  } else if (a.unlockedAt && !b.unlockedAt) {
    return -1;
  } else if (!a.unlockedAt && b.unlockedAt) {
    return 1;
  } else {
    return 0;
  }
};
