import JSZip from 'jszip';

export interface RawAccountEntry {
  username: string;
  href?: string;
  timestamp?: number;
  dateStr?: string;
}

export interface OfflineAnalysisResult {
  analyzedAt: string;
  sourceType: 'zip' | 'json';
  sourceFileNames: string[];
  totalFollowing: number;
  totalFollowers: number;
  tidakFollbackCount: number;
  mutualCount: number;
  fansCount: number;
  tidakFollback: RawAccountEntry[];
  mutuals: RawAccountEntry[];
  fans: RawAccountEntry[];
}

// In-memory cache for fast SPA navigation and to avoid sessionStorage QuotaExceededError
let memoryAnalysisResult: OfflineAnalysisResult | null = null;

export function setAnalysisCache(result: OfflineAnalysisResult | null): void {
  memoryAnalysisResult = result;
  if (typeof window !== 'undefined') {
    try {
      if (result) {
        sessionStorage.setItem('gamutual_offline_analysis', JSON.stringify(result));
      } else {
        sessionStorage.removeItem('gamutual_offline_analysis');
      }
    } catch (e) {
      console.warn('SessionStorage quota exceeded or unavailable. Retaining in-memory cache.', e);
    }
  }
}

export function getAnalysisCache(): OfflineAnalysisResult | null {
  if (memoryAnalysisResult) return memoryAnalysisResult;
  if (typeof window !== 'undefined') {
    try {
      const raw = sessionStorage.getItem('gamutual_offline_analysis');
      if (raw) {
        memoryAnalysisResult = JSON.parse(raw);
        return memoryAnalysisResult;
      }
    } catch (e) {
      console.warn('Failed to parse analysis from sessionStorage:', e);
    }
  }
  return null;
}

/**
 * Validate Instagram username (alphanumeric + periods and underscores, 1-30 chars, no spaces, no hashtags)
 */
export function isValidInstagramUsername(username?: string | null): boolean {
  if (!username) return false;
  const clean = username.replace(/^@/, '').trim();
  if (!clean || clean.length > 30) return false;
  return /^[a-zA-Z0-9._]{1,30}$/.test(clean);
}

/**
 * Extract username from an Instagram profile URL if needed
 */
export function extractUsernameFromHref(href?: string): string | null {
  if (!href) return null;
  try {
    const cleanHref = href.split('?')[0].replace(/\/+$/, '');
    const parts = cleanHref.split('/').filter(Boolean);
    if (parts.length === 0) return null;

    // Filter out Instagram system paths (posts, explore, reels, tags, etc.)
    const invalidPaths = ['explore', 'tags', 'p', 'reel', 'stories', 'tv', 'direct', 'accounts', 'developer', 'about'];
    if (parts.some((p) => invalidPaths.includes(p.toLowerCase()))) {
      return null;
    }

    const lastPart = parts[parts.length - 1];
    if (lastPart && lastPart !== 'instagram.com' && lastPart !== 'www.instagram.com' && lastPart !== '_u') {
      const u = lastPart.replace(/^@/, '').trim();
      return isValidInstagramUsername(u) ? u : null;
    }
  } catch {
    // fallback
  }
  return null;
}

/**
 * Format timestamp into human readable Indonesian date string
 */
export function formatTimestamp(timestamp?: number): string | undefined {
  if (!timestamp) return undefined;
  try {
    const ms = timestamp < 1e11 ? timestamp * 1000 : timestamp;
    const date = new Date(ms);
    if (isNaN(date.getTime())) return undefined;
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return undefined;
  }
}

/**
 * Parse any Instagram export JSON structure into an array of RawAccountEntry
 */
export function parseInstagramAccountList(data: any): RawAccountEntry[] {
  if (!data) return [];

  let list: any[] = [];

  // Case: Wrapped in relationships_following or relationships_followers
  if (Array.isArray(data)) {
    list = data;
  } else if (data && typeof data === 'object') {
    // Explicitly ignore hashtag exports
    if (data.relationships_following_hashtags && !data.relationships_following) {
      return [];
    }

    if (Array.isArray(data.relationships_following)) {
      list = data.relationships_following;
    } else if (Array.isArray(data.relationships_followers)) {
      list = data.relationships_followers;
    } else if (Array.isArray(data.following)) {
      list = data.following;
    } else if (Array.isArray(data.followers)) {
      list = data.followers;
    } else {
      // Find first property that is an array and not hashtags
      for (const key of Object.keys(data)) {
        if (key.toLowerCase().includes('hashtag')) continue;
        if (Array.isArray(data[key])) {
          list = data[key];
          break;
        }
      }
    }
  }

  const results: RawAccountEntry[] = [];
  const seenUsernames = new Set<string>();

  for (const item of list) {
    if (!item) continue;

    // Direct string
    if (typeof item === 'string') {
      const u = item.replace(/^@/, '').trim();
      if (isValidInstagramUsername(u)) {
        const norm = u.toLowerCase();
        if (!seenUsernames.has(norm)) {
          seenUsernames.add(norm);
          results.push({
            username: u,
            href: `https://www.instagram.com/${encodeURIComponent(u)}/`,
          });
        }
      }
      continue;
    }

    // Has string_list_data (Standard Meta structure)
    if (Array.isArray(item.string_list_data) && item.string_list_data.length > 0) {
      for (const entry of item.string_list_data) {
        if (!entry) continue;
        const val = typeof entry.value === 'string' ? entry.value.replace(/^@/, '').trim() : '';
        const href = typeof entry.href === 'string' ? entry.href : undefined;
        let u = val || extractUsernameFromHref(href);
        // Fallback to title only if it is a single valid token
        if (!u && typeof item.title === 'string' && item.title.trim() && !item.title.includes(' ')) {
          u = item.title.trim().replace(/^@/, '');
        }

        if (isValidInstagramUsername(u)) {
          const norm = u!.toLowerCase();
          if (!seenUsernames.has(norm)) {
            seenUsernames.add(norm);
            const ts = typeof entry.timestamp === 'number' ? entry.timestamp : undefined;
            results.push({
              username: u!,
              href: `https://www.instagram.com/${encodeURIComponent(u!)}/`,
              timestamp: ts,
              dateStr: formatTimestamp(ts),
            });
          }
        }
      }
      continue;
    }

    // Fallbacks for direct fields: value, username, title
    let rawVal = '';
    if (typeof item.value === 'string') rawVal = item.value;
    else if (typeof item.username === 'string') rawVal = item.username;
    else if (typeof item.title === 'string' && !item.title.includes(' ')) rawVal = item.title;

    if (rawVal) {
      const u = rawVal.replace(/^@/, '').trim();
      if (isValidInstagramUsername(u)) {
        const norm = u.toLowerCase();
        if (!seenUsernames.has(norm)) {
          seenUsernames.add(norm);
          const ts = typeof item.timestamp === 'number' ? item.timestamp : undefined;
          results.push({
            username: u,
            href: `https://www.instagram.com/${encodeURIComponent(u)}/`,
            timestamp: ts,
            dateStr: formatTimestamp(ts),
          });
        }
      }
    }
  }

  return results;
}

/**
 * Determine file role: 'following', 'followers', 'both', or 'unknown'
 */
export function identifyJsonType(fileName: string, jsonContent: any): 'following' | 'followers' | 'both' | 'unknown' {
  const baseName = (fileName.split(/[/\\]/).pop() || fileName).toLowerCase();

  // Hashtag exports should never be identified as user relationships
  if (baseName.includes('hashtag')) {
    return 'unknown';
  }

  // Check if both exist inside single JSON
  if (jsonContent && typeof jsonContent === 'object') {
    const hasFollowing = Array.isArray(jsonContent.relationships_following) || Array.isArray(jsonContent.following);
    const hasFollowers = Array.isArray(jsonContent.relationships_followers) || Array.isArray(jsonContent.followers);
    if (hasFollowing && hasFollowers) {
      return 'both';
    }
  }

  // Check content keys first if present
  if (jsonContent && typeof jsonContent === 'object') {
    if (Array.isArray(jsonContent.relationships_following) || Array.isArray(jsonContent.following)) return 'following';
    if (Array.isArray(jsonContent.relationships_followers) || Array.isArray(jsonContent.followers)) return 'followers';
  }

  if (baseName.includes('following')) return 'following';
  if (baseName.includes('follower')) return 'followers';

  return 'unknown';
}

/**
 * Compute comparison between following and followers
 * Automatically deduplicates both lists and performs case-insensitive set difference
 */
export function computeAnalysis(
  following: RawAccountEntry[],
  followers: RawAccountEntry[],
  sourceType: 'zip' | 'json',
  sourceFileNames: string[]
): OfflineAnalysisResult {
  // Deduplicate following
  const followingMap = new Map<string, RawAccountEntry>();
  for (const f of following) {
    if (!f || !f.username) continue;
    const clean = f.username.replace(/^@/, '').trim();
    if (!clean) continue;
    const norm = clean.toLowerCase();
    if (!followingMap.has(norm)) {
      followingMap.set(norm, { ...f, username: clean });
    }
  }

  // Deduplicate followers
  const followerMap = new Map<string, RawAccountEntry>();
  for (const f of followers) {
    if (!f || !f.username) continue;
    const clean = f.username.replace(/^@/, '').trim();
    if (!clean) continue;
    const norm = clean.toLowerCase();
    if (!followerMap.has(norm)) {
      followerMap.set(norm, { ...f, username: clean });
    }
  }

  const uniqueFollowing = Array.from(followingMap.values());
  const uniqueFollowers = Array.from(followerMap.values());

  // Tidak Follback: in following, NOT in followers
  const tidakFollback: RawAccountEntry[] = [];
  // Mutuals: in following AND in followers
  const mutuals: RawAccountEntry[] = [];
  for (const f of uniqueFollowing) {
    const norm = f.username.toLowerCase();
    if (followerMap.has(norm)) {
      mutuals.push(f);
    } else {
      tidakFollback.push(f);
    }
  }

  // Fans / Belum Difollow: in followers, NOT in following
  const fans: RawAccountEntry[] = [];
  for (const f of uniqueFollowers) {
    const norm = f.username.toLowerCase();
    if (!followingMap.has(norm)) {
      fans.push(f);
    }
  }

  return {
    analyzedAt: new Date().toISOString(),
    sourceType,
    sourceFileNames,
    totalFollowing: uniqueFollowing.length,
    totalFollowers: uniqueFollowers.length,
    tidakFollbackCount: tidakFollback.length,
    mutualCount: mutuals.length,
    fansCount: fans.length,
    tidakFollback,
    mutuals,
    fans,
  };
}

/**
 * Parse an Instagram ZIP archive containing export files
 */
export async function parseInstagramZip(file: File): Promise<OfflineAnalysisResult> {
  const zip = await JSZip.loadAsync(file);

  const followerFiles: JSZip.JSZipObject[] = [];
  const followingFiles: JSZip.JSZipObject[] = [];
  const combinedFiles: JSZip.JSZipObject[] = [];

  zip.forEach((relativePath, zipEntry) => {
    if (zipEntry.dir) return;
    const lower = relativePath.toLowerCase();
    if (!lower.endsWith('.json')) return;

    // Use base filename to avoid matching directory names like "followers_and_following"
    const baseName = (relativePath.split(/[/\\]/).pop() || '').toLowerCase();

    // Skip hashtag exports
    if (baseName.includes('hashtag')) return;

    if (baseName.includes('following')) {
      followingFiles.push(zipEntry);
    } else if (baseName.includes('follower')) {
      followerFiles.push(zipEntry);
    } else {
      combinedFiles.push(zipEntry);
    }
  });

  let followersList: RawAccountEntry[] = [];
  let followingList: RawAccountEntry[] = [];
  let foundFollowersFile = followerFiles.length > 0;
  let foundFollowingFile = followingFiles.length > 0;

  // Parse followers
  for (const entry of followerFiles) {
    try {
      const text = await entry.async('string');
      const json = JSON.parse(text);
      const accounts = parseInstagramAccountList(json);
      followersList = followersList.concat(accounts);
    } catch (e) {
      console.warn(`Failed to parse follower file ${entry.name}`, e);
    }
  }

  // Parse following
  for (const entry of followingFiles) {
    try {
      const text = await entry.async('string');
      const json = JSON.parse(text);
      const accounts = parseInstagramAccountList(json);
      followingList = followingList.concat(accounts);
    } catch (e) {
      console.warn(`Failed to parse following file ${entry.name}`, e);
    }
  }

  // If follower or following files were not found by name, check other json files
  if (!foundFollowersFile || !foundFollowingFile) {
    for (const entry of combinedFiles) {
      try {
        const text = await entry.async('string');
        const json = JSON.parse(text);
        if (json && typeof json === 'object') {
          if (!foundFollowersFile && (json.relationships_followers || json.followers)) {
            followersList = followersList.concat(parseInstagramAccountList(json.relationships_followers || json.followers));
            foundFollowersFile = true;
          }
          if (!foundFollowingFile && (json.relationships_following || json.following)) {
            followingList = followingList.concat(parseInstagramAccountList(json.relationships_following || json.following));
            foundFollowingFile = true;
          }
        }
      } catch {
        // ignore
      }
    }
  }

  if (!foundFollowersFile && !foundFollowingFile) {
    throw new Error(
      'Tidak ditemukan data pengikut atau mengikuti dalam file ZIP ini. Pastikan Anda mencentang opsi "Pengikut dan Mengikuti" saat meminta unduhan data dari Instagram.'
    );
  }

  if (!foundFollowersFile) {
    throw new Error(
      `Ditemukan data Following (${followingList.length} akun), namun berkas Followers (followers_1.json) tidak ditemukan di dalam ZIP.`
    );
  }

  if (!foundFollowingFile) {
    throw new Error(
      `Ditemukan data Followers (${followersList.length} akun), namun berkas Following (following.json) tidak ditemukan di dalam ZIP.`
    );
  }

  return computeAnalysis(followingList, followersList, 'zip', [file.name]);
}
