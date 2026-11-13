import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {
  isValidInstagramUsername,
  extractUsernameFromHref,
  formatTimestamp,
  parseInstagramAccountList,
  identifyJsonType,
  computeAnalysis,
  parseInstagramZip,
  getAnalysisCache,
  setAnalysisCache,
} from '../src/lib/instagramDataParser.ts';
import type { RawAccountEntry } from '../src/lib/instagramDataParser.ts';

describe('isValidInstagramUsername', () => {
  test('accepts valid usernames', () => {
    assert.equal(isValidInstagramUsername('johndoe'), true);
    assert.equal(isValidInstagramUsername('alice.smith_99'), true);
    assert.equal(isValidInstagramUsername('@cool_user'), true);
    assert.equal(isValidInstagramUsername('a.b'), true);
  });

  test('rejects invalid usernames, hashtags, and spaces', () => {
    assert.equal(isValidInstagramUsername('#nature'), false);
    assert.equal(isValidInstagramUsername('Instagram User'), false);
    assert.equal(isValidInstagramUsername('Budi Santoso'), false);
    assert.equal(isValidInstagramUsername(''), false);
    assert.equal(isValidInstagramUsername(null), false);
    assert.equal(isValidInstagramUsername(undefined), false);
    assert.equal(isValidInstagramUsername('a'.repeat(31)), false); // max 30 chars
  });
});

describe('extractUsernameFromHref', () => {
  test('extracts username from clean profile URL', () => {
    assert.equal(extractUsernameFromHref('https://www.instagram.com/johndoe/'), 'johndoe');
    assert.equal(extractUsernameFromHref('https://instagram.com/johndoe'), 'johndoe');
  });

  test('extracts username from URL with query params', () => {
    assert.equal(
      extractUsernameFromHref('https://www.instagram.com/alice_smith.99?igsh=MXJ5dA=='),
      'alice_smith.99'
    );
  });

  test('extracts username from _u format', () => {
    assert.equal(extractUsernameFromHref('https://www.instagram.com/_u/bob_ross'), 'bob_ross');
  });

  test('rejects non-profile URLs like explore tags and posts', () => {
    assert.equal(extractUsernameFromHref('https://www.instagram.com/explore/tags/nature/'), null);
    assert.equal(extractUsernameFromHref('https://www.instagram.com/p/Cxyz123/'), null);
    assert.equal(extractUsernameFromHref('https://www.instagram.com/reel/Cxyz123/'), null);
    assert.equal(extractUsernameFromHref('https://www.instagram.com/_u/'), null);
  });

  test('handles null and undefined', () => {
    assert.equal(extractUsernameFromHref(undefined), null);
    assert.equal(extractUsernameFromHref(''), null);
  });
});

describe('formatTimestamp', () => {
  test('formats unix timestamp in seconds', () => {
    const formatted = formatTimestamp(1700000000);
    assert.ok(formatted && formatted.length > 0);
  });

  test('formats unix timestamp in milliseconds', () => {
    const formatted = formatTimestamp(1700000000000);
    assert.ok(formatted && formatted.length > 0);
  });

  test('returns undefined for invalid or missing timestamp', () => {
    assert.equal(formatTimestamp(undefined), undefined);
    assert.equal(formatTimestamp(NaN), undefined);
  });
});

describe('parseInstagramAccountList', () => {
  test('handles empty inputs', () => {
    assert.deepEqual(parseInstagramAccountList(null), []);
    assert.deepEqual(parseInstagramAccountList([]), []);
    assert.deepEqual(parseInstagramAccountList({}), []);
  });

  test('parses standard Meta string_list_data format', () => {
    const data = [
      {
        title: '',
        media_list_data: [],
        string_list_data: [
          {
            href: 'https://www.instagram.com/user_one',
            value: 'user_one',
            timestamp: 1714567890,
          },
        ],
      },
      {
        title: '',
        media_list_data: [],
        string_list_data: [
          {
            href: 'https://www.instagram.com/user_two',
            value: '@user_two',
            timestamp: 1714567900,
          },
        ],
      },
    ];

    const result = parseInstagramAccountList(data);
    assert.equal(result.length, 2);
    assert.equal(result[0].username, 'user_one');
    assert.equal(result[0].href, 'https://www.instagram.com/user_one/');
    assert.equal(result[1].username, 'user_two'); // @ removed
  });

  test('parses wrapped relationships_following and relationships_followers', () => {
    const followingData = {
      relationships_following: [
        {
          title: 'target_one',
          string_list_data: [{ value: 'target_one', timestamp: 1700000000 }],
        },
      ],
    };
    const resFollowing = parseInstagramAccountList(followingData);
    assert.equal(resFollowing.length, 1);
    assert.equal(resFollowing[0].username, 'target_one');

    const followersData = {
      relationships_followers: [
        {
          title: 'follower_one',
          string_list_data: [{ value: 'follower_one', timestamp: 1700000000 }],
        },
      ],
    };
    const resFollowers = parseInstagramAccountList(followersData);
    assert.equal(resFollowers.length, 1);
    assert.equal(resFollowers[0].username, 'follower_one');
  });

  test('ignores hashtag exports in relationships_following_hashtags', () => {
    const hashtagData = {
      relationships_following_hashtags: [
        {
          title: '#photography',
          string_list_data: [{ value: '#photography' }],
        },
      ],
    };
    const res = parseInstagramAccountList(hashtagData);
    assert.equal(res.length, 0);
  });

  test('deduplicates identical usernames case-insensitively', () => {
    const data = [
      { string_list_data: [{ value: 'CoolUser' }] },
      { string_list_data: [{ value: 'cooluser' }] },
      { string_list_data: [{ value: 'COOLUSER' }] },
    ];
    const result = parseInstagramAccountList(data);
    assert.equal(result.length, 1);
    assert.equal(result[0].username, 'CoolUser');
  });

  test('extracts from href if value is empty', () => {
    const data = [
      {
        string_list_data: [
          {
            href: 'https://www.instagram.com/href_user',
            value: '',
          },
        ],
      },
    ];
    const result = parseInstagramAccountList(data);
    assert.equal(result.length, 1);
    assert.equal(result[0].username, 'href_user');
  });
});

describe('identifyJsonType', () => {
  test('identifies following from filename', () => {
    assert.equal(identifyJsonType('following.json', {}), 'following');
    assert.equal(identifyJsonType('my_following_export.json', {}), 'following');
  });

  test('identifies followers from filename', () => {
    assert.equal(identifyJsonType('followers_1.json', {}), 'followers');
    assert.equal(identifyJsonType('followers.json', {}), 'followers');
  });

  test('ignores following_hashtags.json', () => {
    assert.equal(identifyJsonType('following_hashtags.json', {}), 'unknown');
  });

  test('identifies from content keys if filename is generic', () => {
    assert.equal(
      identifyJsonType('data.json', { relationships_following: [] }),
      'following'
    );
    assert.equal(
      identifyJsonType('data.json', { relationships_followers: [] }),
      'followers'
    );
  });

  test('identifies both if both keys exist', () => {
    assert.equal(
      identifyJsonType('data.json', {
        relationships_following: [],
        relationships_followers: [],
      }),
      'both'
    );
  });
});

describe('computeAnalysis', () => {
  test('computes correct diff between following and followers', () => {
    const following: RawAccountEntry[] = [
      { username: 'alice' },
      { username: 'bob' },
      { username: 'charlie' },
      { username: 'dave' },
    ];

    const followers: RawAccountEntry[] = [
      { username: 'bob' },
      { username: 'charlie' },
      { username: 'eva' },
    ];

    const result = computeAnalysis(following, followers, 'json', ['following.json', 'followers.json']);

    assert.equal(result.totalFollowing, 4);
    assert.equal(result.totalFollowers, 3);

    // Tidak Follback: alice, dave
    assert.equal(result.tidakFollbackCount, 2);
    const nonFollbackNames = result.tidakFollback.map((a) => a.username);
    assert.ok(nonFollbackNames.includes('alice'));
    assert.ok(nonFollbackNames.includes('dave'));

    // Mutuals: bob, charlie
    assert.equal(result.mutualCount, 2);
    const mutualNames = result.mutuals.map((a) => a.username);
    assert.ok(mutualNames.includes('bob'));
    assert.ok(mutualNames.includes('charlie'));

    // Fans: eva
    assert.equal(result.fansCount, 1);
    assert.equal(result.fans[0].username, 'eva');
  });

  test('deduplicates duplicate entries in input arrays', () => {
    const following: RawAccountEntry[] = [
      { username: 'alice' },
      { username: 'Alice' },
      { username: 'bob' },
    ];
    const followers: RawAccountEntry[] = [
      { username: 'bob' },
      { username: 'BOB' },
      { username: 'charlie' },
      { username: 'charlie' },
    ];

    const result = computeAnalysis(following, followers, 'json', ['f.json']);
    assert.equal(result.totalFollowing, 2); // alice, bob
    assert.equal(result.totalFollowers, 2); // bob, charlie
    assert.equal(result.tidakFollbackCount, 1); // alice
    assert.equal(result.mutualCount, 1); // bob
    assert.equal(result.fansCount, 1); // charlie
  });

  test('handles 0 followers without error', () => {
    const following: RawAccountEntry[] = [{ username: 'alice' }];
    const followers: RawAccountEntry[] = [];

    const result = computeAnalysis(following, followers, 'json', ['f.json']);
    assert.equal(result.totalFollowing, 1);
    assert.equal(result.totalFollowers, 0);
    assert.equal(result.tidakFollbackCount, 1);
    assert.equal(result.mutualCount, 0);
    assert.equal(result.fansCount, 0);
  });
});

describe('parseInstagramZip', () => {
  test('extracts and computes analysis from a simulated zip archive', async () => {
    const zip = new JSZip();

    // Add following.json
    const followingData = {
      relationships_following: [
        {
          title: 'acc_a',
          string_list_data: [{ value: 'acc_a', timestamp: 1710000000 }],
        },
        {
          title: 'acc_b',
          string_list_data: [{ value: 'acc_b', timestamp: 1710000000 }],
        },
      ],
    };

    // Add followers_1.json inside connections/followers_and_following/
    const followersData = [
      {
        title: '',
        string_list_data: [{ value: 'acc_b', timestamp: 1710000000 }],
      },
      {
        title: '',
        string_list_data: [{ value: 'acc_c', timestamp: 1710000000 }],
      },
    ];

    zip.file('connections/followers_and_following/following.json', JSON.stringify(followingData));
    zip.file('connections/followers_and_following/followers_1.json', JSON.stringify(followersData));

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const mockFile = new File([zipBlob], 'instagram-export.zip', {
      type: 'application/zip',
    });

    const result = await parseInstagramZip(mockFile);

    assert.equal(result.sourceType, 'zip');
    assert.equal(result.totalFollowing, 2);
    assert.equal(result.totalFollowers, 2);
    assert.equal(result.tidakFollbackCount, 1);
    assert.equal(result.tidakFollback[0].username, 'acc_a');
    assert.equal(result.mutualCount, 1);
    assert.equal(result.mutuals[0].username, 'acc_b');
    assert.equal(result.fansCount, 1);
    assert.equal(result.fans[0].username, 'acc_c');
  });

  test('ignores following_hashtags.json inside zip', async () => {
    const zip = new JSZip();

    const followingData = [
      { string_list_data: [{ value: 'real_user' }] },
    ];
    const followersData = [
      { string_list_data: [{ value: 'real_user' }] },
    ];
    const hashtagData = [
      { string_list_data: [{ value: '#photography' }] },
    ];

    zip.file('connections/followers_and_following/following.json', JSON.stringify(followingData));
    zip.file('connections/followers_and_following/followers_1.json', JSON.stringify(followersData));
    zip.file('connections/followers_and_following/following_hashtags.json', JSON.stringify(hashtagData));

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const mockFile = new File([zipBlob], 'export-with-hashtags.zip', { type: 'application/zip' });

    const result = await parseInstagramZip(mockFile);
    assert.equal(result.totalFollowing, 1);
    assert.equal(result.tidakFollbackCount, 0);
    assert.equal(result.mutualCount, 1);
    assert.equal(result.mutuals[0].username, 'real_user');
  });

  test('merges multiple follower files (followers_1.json, followers_2.json)', async () => {
    const zip = new JSZip();

    const followingData = [
      { string_list_data: [{ value: 'u1' }] },
      { string_list_data: [{ value: 'u2' }] },
      { string_list_data: [{ value: 'u3' }] },
    ];
    const followersPart1 = [
      { string_list_data: [{ value: 'u1' }] },
    ];
    const followersPart2 = [
      { string_list_data: [{ value: 'u2' }] },
      { string_list_data: [{ value: 'u4' }] },
    ];

    zip.file('connections/followers_and_following/following.json', JSON.stringify(followingData));
    zip.file('connections/followers_and_following/followers_1.json', JSON.stringify(followersPart1));
    zip.file('connections/followers_and_following/followers_2.json', JSON.stringify(followersPart2));

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const mockFile = new File([zipBlob], 'multi-part.zip', { type: 'application/zip' });

    const result = await parseInstagramZip(mockFile);
    assert.equal(result.totalFollowing, 3);
    assert.equal(result.totalFollowers, 3); // u1, u2, u4
    assert.equal(result.tidakFollbackCount, 1); // u3
    assert.equal(result.tidakFollback[0].username, 'u3');
    assert.equal(result.mutualCount, 2); // u1, u2
    assert.equal(result.fansCount, 1); // u4
  });

  test('handles Windows backslash path inside zip', async () => {
    const zip = new JSZip();

    const followingData = [{ string_list_data: [{ value: 'win_u1' }] }];
    const followersData = [{ string_list_data: [{ value: 'win_u1' }] }];

    zip.file('connections\\followers_and_following\\following.json', JSON.stringify(followingData));
    zip.file('connections\\followers_and_following\\followers_1.json', JSON.stringify(followersData));

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const mockFile = new File([zipBlob], 'win-export.zip', { type: 'application/zip' });

    const result = await parseInstagramZip(mockFile);
    assert.equal(result.totalFollowing, 1);
    assert.equal(result.totalFollowers, 1);
    assert.equal(result.mutualCount, 1);
    assert.equal(result.tidakFollbackCount, 0);
  });

  test('handles account with 0 followers in followers_1.json without throwing missing file error', async () => {
    const zip = new JSZip();

    const followingData = [{ string_list_data: [{ value: 'target_acc' }] }];
    const emptyFollowersData: any[] = [];

    zip.file('connections/followers_and_following/following.json', JSON.stringify(followingData));
    zip.file('connections/followers_and_following/followers_1.json', JSON.stringify(emptyFollowersData));

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const mockFile = new File([zipBlob], 'zero-followers.zip', { type: 'application/zip' });

    const result = await parseInstagramZip(mockFile);
    assert.equal(result.totalFollowing, 1);
    assert.equal(result.totalFollowers, 0);
    assert.equal(result.tidakFollbackCount, 1);
    assert.equal(result.mutualCount, 0);
  });

  test('throws error if zip contains no follower/following files', async () => {
    const zip = new JSZip();
    zip.file('dummy.txt', 'hello');

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const mockFile = new File([zipBlob], 'empty.zip', {
      type: 'application/zip',
    });

    await assert.rejects(async () => {
      await parseInstagramZip(mockFile);
    }, /Tidak ditemukan data/);
  });
});

describe('cache functions', () => {
  test('sets and gets analysis cache in memory', () => {
    const mockResult = {
      analyzedAt: '2026-11-14T00:00:00Z',
      sourceType: 'json' as const,
      sourceFileNames: ['f.json'],
      totalFollowing: 1,
      totalFollowers: 1,
      tidakFollbackCount: 0,
      mutualCount: 1,
      fansCount: 0,
      tidakFollback: [],
      mutuals: [{ username: 'user1' }],
      fans: [],
    };
    setAnalysisCache(mockResult);
    assert.deepEqual(getAnalysisCache(), mockResult);

    setAnalysisCache(null);
    assert.equal(getAnalysisCache(), null);
  });
});
