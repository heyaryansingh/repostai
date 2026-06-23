/**
 * Content Repurposing Optimizer
 *
 * Intelligently suggest the best ways to repurpose content across platforms
 */

export interface ContentPiece {
  id: string;
  type: "blog" | "video" | "podcast" | "infographic" | "whitepaper";
  title: string;
  length: number; // words or seconds
  topics: string[];
  performanceScore?: number;
}

export interface RepurposingStrategy {
  sourcePlatform: string;
  targetPlatform: string;
  format: string;
  estimatedEffort: "low" | "medium" | "high";
  potentialReach: number;
  recommendation: string;
}

export interface RepurposingSuggestion {
  contentId: string;
  strategies: RepurposingStrategy[];
  priority: "high" | "medium" | "low";
  reason: string;
}

/**
 * Generate repurposing suggestions for content
 */
export function generateRepurposingSuggestions(
  content: ContentPiece
): RepurposingSuggestion {
  const strategies: RepurposingStrategy[] = [];

  // Blog post strategies
  if (content.type === "blog") {
    if (content.length > 1500) {
      strategies.push({
        sourcePlatform: "blog",
        targetPlatform: "twitter",
        format: "thread",
        estimatedEffort: "low",
        potentialReach: 5000,
        recommendation:
          "Break down key points into a Twitter thread (8-12 tweets)",
      });

      strategies.push({
        sourcePlatform: "blog",
        targetPlatform: "linkedin",
        format: "article",
        estimatedEffort: "low",
        potentialReach: 3000,
        recommendation:
          "Republish as LinkedIn article with professional tone",
      });

      strategies.push({
        sourcePlatform: "blog",
        targetPlatform: "instagram",
        format: "carousel",
        estimatedEffort: "medium",
        potentialReach: 2000,
        recommendation:
          "Create 8-10 slide carousel highlighting key insights",
      });
    }

    if (content.length > 2500) {
      strategies.push({
        sourcePlatform: "blog",
        targetPlatform: "youtube",
        format: "video",
        estimatedEffort: "high",
        potentialReach: 10000,
        recommendation:
          "Record video walkthrough or explanation (10-15 min)",
      });

      strategies.push({
        sourcePlatform: "blog",
        targetPlatform: "podcast",
        format: "episode",
        estimatedEffort: "high",
        potentialReach: 5000,
        recommendation: "Expand into podcast episode (20-30 min)",
      });
    }
  }

  // Video strategies
  if (content.type === "video") {
    strategies.push({
      sourcePlatform: "youtube",
      targetPlatform: "blog",
      format: "article",
      estimatedEffort: "medium",
      potentialReach: 3000,
      recommendation: "Transcribe and edit into blog post",
    });

    strategies.push({
      sourcePlatform: "youtube",
      targetPlatform: "twitter",
      format: "clips",
      estimatedEffort: "low",
      potentialReach: 7000,
      recommendation: "Cut into 30-60 second clips with captions",
    });

    strategies.push({
      sourcePlatform: "youtube",
      targetPlatform: "instagram",
      format: "reels",
      estimatedEffort: "low",
      potentialReach: 8000,
      recommendation: "Create Reels from best moments",
    });
  }

  // Podcast strategies
  if (content.type === "podcast") {
    strategies.push({
      sourcePlatform: "podcast",
      targetPlatform: "blog",
      format: "article",
      estimatedEffort: "medium",
      potentialReach: 2500,
      recommendation: "Transcribe and edit into blog post",
    });

    strategies.push({
      sourcePlatform: "podcast",
      targetPlatform: "twitter",
      format: "quotes",
      estimatedEffort: "low",
      potentialReach: 4000,
      recommendation: "Pull out quotable moments (5-10 tweets)",
    });

    strategies.push({
      sourcePlatform: "podcast",
      targetPlatform: "linkedin",
      format: "article",
      estimatedEffort: "medium",
      potentialReach: 3000,
      recommendation: "Summarize key takeaways for professionals",
    });
  }

  // Determine priority based on performance and reach potential
  let priority: "high" | "medium" | "low" = "medium";
  let reason = "Standard content with good repurposing potential";

  if (content.performanceScore && content.performanceScore > 80) {
    priority = "high";
    reason = "High-performing content worth maximizing reach";
  } else if (strategies.length > 5) {
    priority = "high";
    reason = "Many repurposing opportunities available";
  } else if (strategies.length < 3) {
    priority = "low";
    reason = "Limited repurposing options for this format";
  }

  return {
    contentId: content.id,
    strategies,
    priority,
    reason,
  };
}

/**
 * Calculate repurposing ROI
 */
export function calculateRepurposingROI(
  strategy: RepurposingStrategy,
  currentReach: number,
  hourlyRate: number = 50
): {
  estimatedHours: number;
  estimatedCost: number;
  potentialReachGain: number;
  roi: number;
} {
  const effortHours = {
    low: 1,
    medium: 3,
    high: 8,
  };

  const hours = effortHours[strategy.estimatedEffort];
  const cost = hours * hourlyRate;
  const reachGain = strategy.potentialReach - currentReach;

  // ROI: (reach gain / cost) - simple metric
  const roi = cost > 0 ? reachGain / cost : 0;

  return {
    estimatedHours: hours,
    estimatedCost: cost,
    potentialReachGain: Math.max(reachGain, 0),
    roi,
  };
}

/**
 * Prioritize repurposing strategies by ROI
 */
export function prioritizeStrategiesByROI(
  strategies: RepurposingStrategy[],
  currentReach: number,
  hourlyRate: number = 50
): Array<RepurposingStrategy & { roi: number }> {
  const withROI = strategies.map((strategy) => {
    const roiCalc = calculateRepurposingROI(strategy, currentReach, hourlyRate);
    return {
      ...strategy,
      roi: roiCalc.roi,
    };
  });

  return withROI.sort((a, b) => b.roi - a.roi);
}

/**
 * Generate weekly repurposing plan
 */
export function generateWeeklyPlan(
  content: ContentPiece[],
  maxHoursPerWeek: number = 10
): {
  plan: Array<{
    day: string;
    tasks: Array<{
      contentId: string;
      strategy: RepurposingStrategy;
      estimatedHours: number;
    }>;
  }>;
  totalHours: number;
  totalPotentialReach: number;
} {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const plan = days.map((day) => ({ day, tasks: [] as any[] }));

  let currentDay = 0;
  let currentDayHours = 0;
  let totalHours = 0;
  let totalPotentialReach = 0;

  // Get all strategies sorted by priority
  const allSuggestions = content.map(generateRepurposingSuggestions);
  const allStrategies: Array<{
    contentId: string;
    strategy: RepurposingStrategy;
  }> = [];

  for (const suggestion of allSuggestions) {
    if (suggestion.priority === "high") {
      for (const strategy of suggestion.strategies) {
        allStrategies.push({ contentId: suggestion.contentId, strategy });
      }
    }
  }

  // Allocate strategies to days
  for (const { contentId, strategy } of allStrategies) {
    if (totalHours >= maxHoursPerWeek) break;

    const effortHours = { low: 1, medium: 3, high: 8 }[
      strategy.estimatedEffort
    ];

    if (currentDayHours + effortHours > maxHoursPerWeek / 7 * 1.5) {
      // Move to next day
      currentDay++;
      currentDayHours = 0;

      if (currentDay >= days.length) break;
    }

    plan[currentDay].tasks.push({
      contentId,
      strategy,
      estimatedHours: effortHours,
    });

    currentDayHours += effortHours;
    totalHours += effortHours;
    totalPotentialReach += strategy.potentialReach;
  }

  return {
    plan: plan.filter((day) => day.tasks.length > 0),
    totalHours,
    totalPotentialReach,
  };
}

/**
 * Suggest optimal content formats for a topic
 */
export function suggestOptimalFormats(
  topic: string,
  audience: "b2b" | "b2c" | "general"
): Array<{ format: string; reason: string; platforms: string[] }> {
  const suggestions: Array<{
    format: string;
    reason: string;
    platforms: string[];
  }> = [];

  if (audience === "b2b") {
    suggestions.push({
      format: "whitepapers and case studies",
      reason: "B2B audiences value in-depth, data-driven content",
      platforms: ["LinkedIn", "Email", "Website"],
    });

    suggestions.push({
      format: "webinars and tutorials",
      reason: "Educational content builds authority",
      platforms: ["YouTube", "LinkedIn", "Zoom"],
    });
  }

  if (audience === "b2c") {
    suggestions.push({
      format: "short videos and reels",
      reason: "B2C audiences prefer quick, entertaining content",
      platforms: ["TikTok", "Instagram", "YouTube Shorts"],
    });

    suggestions.push({
      format: "infographics and carousels",
      reason: "Visual content drives high engagement",
      platforms: ["Instagram", "Pinterest", "Facebook"],
    });
  }

  if (audience === "general") {
    suggestions.push({
      format: "blog posts with visuals",
      reason: "Broad appeal with SEO benefits",
      platforms: ["Blog", "LinkedIn", "Medium"],
    });

    suggestions.push({
      format: "social media threads",
      reason: "Easy to consume and share",
      platforms: ["Twitter", "LinkedIn", "Threads"],
    });
  }

  return suggestions;
}

/**
 * Export repurposing report
 */
export function exportRepurposingReport(
  suggestions: RepurposingSuggestion[]
): string {
  const lines: string[] = [];

  lines.push("=== Content Repurposing Report ===\n");

  const highPriority = suggestions.filter((s) => s.priority === "high");
  const mediumPriority = suggestions.filter((s) => s.priority === "medium");

  lines.push(`High Priority Items: ${highPriority.length}`);
  lines.push(`Medium Priority Items: ${mediumPriority.length}\n`);

  for (const suggestion of highPriority) {
    lines.push(`\nContent ID: ${suggestion.contentId} [HIGH PRIORITY]`);
    lines.push(`Reason: ${suggestion.reason}`);
    lines.push(`Strategies (${suggestion.strategies.length}):`);

    for (const strategy of suggestion.strategies) {
      lines.push(
        `  - ${strategy.targetPlatform} (${strategy.format}) - ${strategy.estimatedEffort} effort`
      );
      lines.push(`    ${strategy.recommendation}`);
      lines.push(
        `    Potential Reach: ${strategy.potentialReach.toLocaleString()}`
      );
    }
  }

  return lines.join("\n");
}
