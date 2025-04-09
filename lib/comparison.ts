/**
 * Checks if two strings are closely correct in terms of word order and content,
 * considering minor differences like insertions, deletions, and order changes.
 *
 * @param {string} str1 - The first string.
 * @param {string} str2 - The second string.
 * @param {number} maxWordDistance - The maximum allowed edit distance between word arrays. Defaults to 2.
 * @returns {boolean} - True if the strings are closely correct, false otherwise.
 */
export function areStringsCloselyCorrectWords(
  str1: string,
  str2: string,
  maxWordDistance: number = 2
): boolean {
  const cleanString = (str: string) =>
    str.toLowerCase().replace(/[^a-z0-9\s]/g, ''); // Lowercase and remove non-alphanumeric

  const words1 = cleanString(str1).split(/\s+/).filter(Boolean); // Split into words, remove empty strings
  const words2 = cleanString(str2).split(/\s+/).filter(Boolean);

  const m = words1.length;
  const n = words2.length;

  // Create a matrix to store distances between prefixes of word arrays
  const dp = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  // Initialize the first row and column
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  // Calculate the edit distance between word arrays
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (words1[i - 1] === words2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  // Return true if the word edit distance is within the allowed maximum
  return dp[m][n] <= maxWordDistance;
}

/**
 * Compares an array of strings with another array of strings,
 * and returns the strings from the second array that do NOT closely match
 * any string in the first array, based on word edit distance.
 *
 * @param {string[]} compareAgainst - Array of strings to compare against.
 * @param {string[]} sourceArray - Array of strings to filter.
 * @param {number} maxWordDistance - Maximum allowed word edit distance. Defaults to 2.
 * @returns {string[]} - Array of strings from sourceArray that don't closely match
 *                       any string in compareAgainst.
 */
export function findNonMatchingStrings(
  compareAgainst: string[],
  sourceArray: string[],
  maxWordDistance: number = 2
): string[] {
  const cleanString = (str: string) =>
    str.toLowerCase().replace(/[^a-z0-9\\s]/g, '');

  const closelyMatching = (str1: string, str2: string, maxDistance: number) => {
    const words1 = cleanString(str1).split(/\s+/).filter(Boolean);
    const words2 = cleanString(str2).split(/\s+/).filter(Boolean);

    const m = words1.length;
    const n = words2.length;

    const dp = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) {
      dp[i][0] = i;
    }
    for (let j = 0; j <= n; j++) {
      dp[0][j] = j;
    }

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (words1[i - 1] === words2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }

    return dp[m][n] <= maxDistance;
  };

  return sourceArray.filter((sourceStr) => {
    return !compareAgainst.some((compareStr) =>
      closelyMatching(sourceStr, compareStr, maxWordDistance)
    );
  });
}

/**
 * Compares a single string with an array of strings,
 * and returns the strings from the array that do NOT closely match
 * the single string, based on word edit distance.
 *
 * @param {string} compareAgainst - String to compare against.
 * @param {string[]} sourceArray - Array of strings to filter.
 * @param {number} maxWordDistance - Maximum allowed word edit distance. Defaults to 2.
 * @returns {string[]} - Array of strings from sourceArray that don't closely match
 *                       the compareAgainst string.
 */
export function findNonMatchingStringsSingle(
  compareAgainst: string,
  sourceArray: string[],
  maxWordDistance: number = 2
): string[] {
  const cleanString = (str: string) =>
    str.toLowerCase().replace(/[^a-z0-9\\s]/g, '');

  const closelyMatching = (str1: string, str2: string, maxDistance: number) => {
    const words1 = cleanString(str1).split(/\s+/).filter(Boolean);
    const words2 = cleanString(str2).split(/\s+/).filter(Boolean);

    const m = words1.length;
    const n = words2.length;

    const dp = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) {
      dp[i][0] = i;
    }
    for (let j = 0; j <= n; j++) {
      dp[0][j] = j;
    }

    for (let i = 1; i <= m; i++) {
      for (let j = 1; i <= n; j++) {
        //THIS WAS THE BUG! It should be j++ instead of i++
        if (words1[i - 1] === words2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }

    return dp[m][n] <= maxDistance;
  };

  return sourceArray.filter((sourceStr) => {
    return !closelyMatching(sourceStr, compareAgainst, maxWordDistance);
  });
}
