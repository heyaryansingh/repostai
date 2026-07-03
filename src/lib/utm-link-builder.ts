/**
 * UTM Link Builder
 *
 * Builds and parses UTM-tagged URLs so campaign performance can be tracked
 * per post and per platform in downstream analytics tools (e.g. GA4).
 */

export interface UtmParams {
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
}

export interface UtmValidation {
  valid: boolean;
  errors: string[];
}

const UTM_KEYS: Record<keyof UtmParams, string> = {
  source: "utm_source",
  medium: "utm_medium",
  campaign: "utm_campaign",
  term: "utm_term",
  content: "utm_content",
};

/**
 * Validate that required UTM fields are present and don't contain spaces
 * (spaces are technically allowed but get URL-encoded, hurting readability
 * and consistency across campaigns).
 */
export function validateUtmParams(params: UtmParams): UtmValidation {
  const errors: string[] = [];

  if (!params.source?.trim()) errors.push("utm_source is required");
  if (!params.medium?.trim()) errors.push("utm_medium is required");
  if (!params.campaign?.trim()) errors.push("utm_campaign is required");

  const spaceCheck: Array<[string, string | undefined]> = [
    ["utm_source", params.source],
    ["utm_medium", params.medium],
    ["utm_campaign", params.campaign],
    ["utm_term", params.term],
    ["utm_content", params.content],
  ];
  for (const [key, value] of spaceCheck) {
    if (value && /\s/.test(value)) {
      errors.push(`${key} contains spaces; consider using hyphens or underscores`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Build a UTM-tagged URL from a base URL and campaign parameters.
 * Existing query parameters on the base URL are preserved.
 */
export function buildUtmUrl(baseUrl: string, params: UtmParams): string {
  const validation = validateUtmParams(params);
  if (!validation.valid) {
    throw new Error(`Invalid UTM params: ${validation.errors.join("; ")}`);
  }

  const url = new URL(baseUrl);
  (Object.keys(UTM_KEYS) as Array<keyof UtmParams>).forEach((key) => {
    const value = params[key];
    if (value) {
      url.searchParams.set(UTM_KEYS[key], value);
    }
  });

  return url.toString();
}

/**
 * Extract UTM parameters from a previously tagged URL, if present.
 */
export function parseUtmUrl(url: string): Partial<UtmParams> {
  const parsed = new URL(url);
  const result: Partial<UtmParams> = {};

  (Object.keys(UTM_KEYS) as Array<keyof UtmParams>).forEach((key) => {
    const value = parsed.searchParams.get(UTM_KEYS[key]);
    if (value) result[key] = value;
  });

  return result;
}

/**
 * Generate one UTM-tagged URL per platform, using the platform name as
 * utm_source and "social" as the default utm_medium. Useful for tracking
 * which platform drove traffic for a single piece of repurposed content.
 */
export function generatePlatformUtmLinks(
  baseUrl: string,
  campaign: string,
  platforms: string[],
  options: { medium?: string; content?: string } = {}
): Record<string, string> {
  const links: Record<string, string> = {};

  for (const platform of platforms) {
    links[platform] = buildUtmUrl(baseUrl, {
      source: platform.toLowerCase(),
      medium: options.medium ?? "social",
      campaign,
      content: options.content,
    });
  }

  return links;
}
