/**
 * Content trend analysis and topic detection.
 *
 * Identifies trending topics, popular keywords, and content themes.
 */

export type TrendData = {
  keyword: string;
  frequency: number;
  growth_rate: number; // percentage change
  sentiment: 'positive' | 'negative' | 'neutral';
  platforms: string[];
};

export type TopicCluster = {
  name: string;
  keywords: string[];
  relevance_score: number;
  suggested_content: string[];
};

export type TrendAnalysis = {
  trending_keywords: TrendData[];
  emerging_topics: TopicCluster[];
  content_gaps: string[];
  recommendations: string[];
};

// Common stop words to filter out
const STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'a', 'an', 'as', 'are', 'was', 'were',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'should', 'could', 'may', 'might', 'must', 'can', 'of', 'to',
  'for', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further',
  'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all',
  'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
  'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'but',
  'and', 'or', 'if', 'because', 'as', 'until', 'while', 'this', 'that', 'these',
  'those', 'am', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does',
]);

/**
 * Extract keywords from text content.
 */
export function extractKeywords(
  text: string,
  minLength: number = 3,
  maxKeywords: number = 20
): Map<string, number> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word =>
      word.length >= minLength &&
      !STOP_WORDS.has(word) &&
      !/^\d+$/.test(word)
    );

  const frequency = new Map<string, number>();

  for (const word of words) {
    frequency.set(word, (frequency.get(word) || 0) + 1);
  }

  // Sort by frequency and return top keywords
  const sorted = Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords);

  return new Map(sorted);
}

/**
 * Calculate keyword growth rate between two time periods.
 */
export function calculateGrowthRate(
  currentFrequency: number,
  previousFrequency: number
): number {
  if (previousFrequency === 0) {
    return currentFrequency > 0 ? 100 : 0;
  }

  return ((currentFrequency - previousFrequency) / previousFrequency) * 100;
}

/**
 * Identify trending keywords from a collection of content.
 */
export function identifyTrendingKeywords(
  currentContent: string[],
  previousContent: string[] = [],
  minGrowth: number = 20
): TrendData[] {
  // Extract keywords from current content
  const currentKeywords = new Map<string, number>();
  for (const content of currentContent) {
    const keywords = extractKeywords(content);
    for (const [word, freq] of keywords) {
      currentKeywords.set(word, (currentKeywords.get(word) || 0) + freq);
    }
  }

  // Extract keywords from previous content
  const previousKeywords = new Map<string, number>();
  if (previousContent.length > 0) {
    for (const content of previousContent) {
      const keywords = extractKeywords(content);
      for (const [word, freq] of keywords) {
        previousKeywords.set(word, (previousKeywords.get(word) || 0) + freq);
      }
    }
  }

  // Calculate trends
  const trends: TrendData[] = [];

  for (const [keyword, currentFreq] of currentKeywords) {
    const previousFreq = previousKeywords.get(keyword) || 0;
    const growth_rate = calculateGrowthRate(currentFreq, previousFreq);

    if (growth_rate >= minGrowth || currentFreq >= 5) {
      trends.push({
        keyword,
        frequency: currentFreq,
        growth_rate,
        sentiment: 'neutral', // Will be enhanced with sentiment analysis
        platforms: ['general'],
      });
    }
  }

  // Sort by growth rate and frequency
  return trends.sort((a, b) => {
    if (Math.abs(a.growth_rate - b.growth_rate) > 10) {
      return b.growth_rate - a.growth_rate;
    }
    return b.frequency - a.frequency;
  });
}

/**
 * Cluster related keywords into topics.
 */
export function clusterTopics(
  keywords: string[],
  minClusterSize: number = 3
): TopicCluster[] {
  // Simple topic clustering based on word similarity
  // In production, you'd use more sophisticated NLP techniques

  const clusters: TopicCluster[] = [];

  // Tech/AI cluster
  const techWords = keywords.filter(k =>
    /(ai|tech|software|data|code|api|cloud|saas|digital|cyber|ml|algorithm)/.test(k)
  );
  if (techWords.length >= minClusterSize) {
    clusters.push({
      name: 'Technology & AI',
      keywords: techWords,
      relevance_score: techWords.length / keywords.length,
      suggested_content: [
        'How-to guide on implementing AI',
        'Tech trend analysis',
        'Developer tools comparison',
      ],
    });
  }

  // Business/Marketing cluster
  const bizWords = keywords.filter(k =>
    /(business|marketing|growth|sales|revenue|startup|entrepreneur|strategy|brand)/.test(k)
  );
  if (bizWords.length >= minClusterSize) {
    clusters.push({
      name: 'Business & Marketing',
      keywords: bizWords,
      relevance_score: bizWords.length / keywords.length,
      suggested_content: [
        'Growth strategy breakdown',
        'Marketing campaign analysis',
        'Startup lessons learned',
      ],
    });
  }

  // Product/Design cluster
  const productWords = keywords.filter(k =>
    /(product|design|ux|ui|user|feature|launch|beta|prototype|interface)/.test(k)
  );
  if (productWords.length >= minClusterSize) {
    clusters.push({
      name: 'Product & Design',
      keywords: productWords,
      relevance_score: productWords.length / keywords.length,
      suggested_content: [
        'Product launch checklist',
        'Design principles guide',
        'User feedback analysis',
      ],
    });
  }

  // Content/Social cluster
  const contentWords = keywords.filter(k =>
    /(content|social|media|post|tweet|viral|engagement|follower|influencer)/.test(k)
  );
  if (contentWords.length >= minClusterSize) {
    clusters.push({
      name: 'Content & Social Media',
      keywords: contentWords,
      relevance_score: contentWords.length / keywords.length,
      suggested_content: [
        'Content strategy framework',
        'Social media growth tactics',
        'Viral content analysis',
      ],
    });
  }

  return clusters.sort((a, b) => b.relevance_score - a.relevance_score);
}

/**
 * Identify content gaps based on trending topics.
 */
export function identifyContentGaps(
  trendingTopics: TopicCluster[],
  existingContent: string[]
): string[] {
  const gaps: string[] = [];
  const existingKeywords = new Set<string>();

  // Extract keywords from existing content
  for (const content of existingContent) {
    const keywords = extractKeywords(content, 3, 50);
    for (const [word] of keywords) {
      existingKeywords.add(word);
    }
  }

  // Check which trending keywords are missing
  for (const topic of trendingTopics) {
    const missingKeywords = topic.keywords.filter(
      k => !existingKeywords.has(k)
    );

    if (missingKeywords.length >= 3) {
      gaps.push(
        `Consider creating content about "${topic.name}" - Missing coverage: ${missingKeywords.slice(0, 5).join(', ')}`
      );
    }
  }

  return gaps;
}

/**
 * Generate content recommendations based on trends.
 */
export function generateTrendRecommendations(
  trends: TrendData[],
  topics: TopicCluster[]
): string[] {
  const recommendations: string[] = [];

  // Fast-growing keywords
  const fastGrowing = trends
    .filter(t => t.growth_rate > 50)
    .slice(0, 3);

  if (fastGrowing.length > 0) {
    recommendations.push(
      `Focus on rapidly growing topics: ${fastGrowing.map(t => t.keyword).join(', ')}`
    );
  }

  // High-frequency keywords
  const highFrequency = trends
    .filter(t => t.frequency > 10)
    .slice(0, 3);

  if (highFrequency.length > 0) {
    recommendations.push(
      `Leverage popular keywords in your content: ${highFrequency.map(t => t.keyword).join(', ')}`
    );
  }

  // Topic-specific recommendations
  if (topics.length > 0) {
    const topTopic = topics[0];
    recommendations.push(
      `Primary content focus should be on "${topTopic.name}" with keywords: ${topTopic.keywords.slice(0, 5).join(', ')}`
    );
  }

  // Diversification recommendation
  if (topics.length === 1) {
    recommendations.push(
      'Consider diversifying content across multiple topics to reach wider audience'
    );
  }

  // Emerging trends
  const emerging = trends.filter(
    t => t.growth_rate > 30 && t.frequency < 10
  );

  if (emerging.length > 0) {
    recommendations.push(
      `Emerging trends to watch: ${emerging.slice(0, 3).map(t => t.keyword).join(', ')}`
    );
  }

  return recommendations;
}

/**
 * Complete trend analysis.
 */
export function analyzeTrends(
  recentContent: string[],
  previousContent: string[] = [],
  existingLibrary: string[] = []
): TrendAnalysis {
  // Identify trending keywords
  const trending_keywords = identifyTrendingKeywords(
    recentContent,
    previousContent,
    15
  );

  // Cluster into topics
  const allKeywords = trending_keywords.map(t => t.keyword);
  const emerging_topics = clusterTopics(allKeywords, 2);

  // Identify content gaps
  const content_gaps = identifyContentGaps(emerging_topics, existingLibrary);

  // Generate recommendations
  const recommendations = generateTrendRecommendations(
    trending_keywords,
    emerging_topics
  );

  return {
    trending_keywords: trending_keywords.slice(0, 15),
    emerging_topics,
    content_gaps,
    recommendations,
  };
}

/**
 * Get optimal posting times based on content type and trends.
 */
export function suggestPostingTimes(
  platform: 'twitter' | 'linkedin' | 'instagram',
  contentType: 'tech' | 'business' | 'lifestyle' | 'general'
): string[] {
  const timeSuggestions: Record<string, Record<string, string[]>> = {
    twitter: {
      tech: ['9-10 AM', '12-1 PM', '5-6 PM'],
      business: ['8-9 AM', '12-1 PM', '5-6 PM'],
      lifestyle: ['11 AM-12 PM', '7-8 PM'],
      general: ['9 AM', '12 PM', '6 PM'],
    },
    linkedin: {
      tech: ['7-8 AM', '12 PM', '5-6 PM'],
      business: ['7-8 AM', '12 PM', '5 PM'],
      lifestyle: ['12 PM', '5-6 PM'],
      general: ['7-9 AM', '12 PM', '5-6 PM'],
    },
    instagram: {
      tech: ['11 AM-12 PM', '7-8 PM'],
      business: ['11 AM-1 PM', '7-9 PM'],
      lifestyle: ['11 AM-1 PM', '7-9 PM'],
      general: ['11 AM', '2 PM', '7-8 PM'],
    },
  };

  return timeSuggestions[platform][contentType] || timeSuggestions[platform].general;
}
