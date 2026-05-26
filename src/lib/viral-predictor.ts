/**
 * Viral Content Predictor - ML-based virality scoring and prediction
 *
 * Features:
 * - Content virality score calculation
 * - Optimal posting time prediction
 * - Audience resonance analysis
 * - Engagement velocity tracking
 * - Viral pattern detection
 */

export interface ContentFeatures {
  // Text features
  wordCount: number;
  readabilityScore: number;
  emotionalTone: 'positive' | 'negative' | 'neutral' | 'mixed';
  hasQuestion: boolean;
  hasNumbers: boolean;
  hasEmojis: boolean;
  hasHashtags: boolean;

  // Media features
  hasImage: boolean;
  hasVideo: boolean;
  hasGif: boolean;
  mediaQuality?: 'low' | 'medium' | 'high';

  // Engagement signals
  earlyEngagementRate?: number;
  shareToLikeRatio?: number;
  commentDepth?: number;

  // Timing
  dayOfWeek?: number;
  hourOfDay?: number;
  isWeekend?: boolean;

  // Network
  authorFollowerCount?: number;
  authorEngagementRate?: number;
  authorVerified?: boolean;
}

export interface ViralityScore {
  score: number; // 0-100
  confidence: number; // 0-1
  factors: {
    content: number;
    timing: number;
    network: number;
    engagement: number;
  };
  predictions: {
    estimatedReach: number;
    estimatedEngagementRate: number;
    peakTime: string;
  };
  recommendations: string[];
}

export interface EngagementVelocity {
  currentRate: number;
  predictedPeakRate: number;
  timeToViral: number; // minutes
  viralProbability: number;
  stage: 'dormant' | 'growing' | 'viral' | 'declining';
}

export class ViralContentPredictor {
  private weights = {
    content: 0.35,
    timing: 0.20,
    network: 0.25,
    engagement: 0.20,
  };

  /**
   * Calculate virality score for content
   */
  calculateViralityScore(features: ContentFeatures): ViralityScore {
    const contentScore = this.scoreContentFeatures(features);
    const timingScore = this.scoreTimingFeatures(features);
    const networkScore = this.scoreNetworkFeatures(features);
    const engagementScore = this.scoreEngagementFeatures(features);

    // Weighted total
    const totalScore =
      contentScore * this.weights.content +
      timingScore * this.weights.timing +
      networkScore * this.weights.network +
      engagementScore * this.weights.engagement;

    // Confidence based on available features
    const confidence = this.calculateConfidence(features);

    // Generate predictions
    const predictions = this.generatePredictions(
      features,
      totalScore,
      contentScore,
      networkScore
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      features,
      contentScore,
      timingScore,
      networkScore
    );

    return {
      score: Math.round(totalScore),
      confidence,
      factors: {
        content: Math.round(contentScore),
        timing: Math.round(timingScore),
        network: Math.round(networkScore),
        engagement: Math.round(engagementScore),
      },
      predictions,
      recommendations,
    };
  }

  /**
   * Score content-based features
   */
  private scoreContentFeatures(features: ContentFeatures): number {
    let score = 50; // Base score

    // Word count (optimal range)
    if (features.wordCount >= 50 && features.wordCount <= 150) {
      score += 15;
    } else if (features.wordCount >= 20 && features.wordCount <= 250) {
      score += 8;
    }

    // Readability
    if (features.readabilityScore > 60) {
      score += 10;
    }

    // Emotional engagement
    if (features.emotionalTone === 'positive' || features.emotionalTone === 'mixed') {
      score += 12;
    }

    // Interactive elements
    if (features.hasQuestion) score += 8;
    if (features.hasNumbers) score += 5;
    if (features.hasEmojis) score += 6;

    // Media presence
    if (features.hasVideo) {
      score += 20;
    } else if (features.hasImage) {
      score += 15;
    } else if (features.hasGif) {
      score += 12;
    }

    // Media quality
    if (features.mediaQuality === 'high') {
      score += 10;
    }

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Score timing-based features
   */
  private scoreTimingFeatures(features: ContentFeatures): number {
    let score = 50;

    if (features.hourOfDay !== undefined) {
      // Peak hours: 9-11am, 1-3pm, 7-9pm
      const isPeakHour =
        (features.hourOfDay >= 9 && features.hourOfDay <= 11) ||
        (features.hourOfDay >= 13 && features.hourOfDay <= 15) ||
        (features.hourOfDay >= 19 && features.hourOfDay <= 21);

      if (isPeakHour) {
        score += 25;
      }

      // Avoid dead hours (2-6am)
      const isDeadHour = features.hourOfDay >= 2 && features.hourOfDay <= 6;
      if (isDeadHour) {
        score -= 20;
      }
    }

    if (features.dayOfWeek !== undefined) {
      // Weekdays perform better
      if (features.dayOfWeek >= 1 && features.dayOfWeek <= 5) {
        score += 15;
      }

      // Wednesday-Thursday peak
      if (features.dayOfWeek === 3 || features.dayOfWeek === 4) {
        score += 10;
      }
    }

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Score network-based features
   */
  private scoreNetworkFeatures(features: ContentFeatures): number {
    let score = 30; // Lower base for unknown networks

    if (features.authorFollowerCount !== undefined) {
      // Log scale for followers
      const followerScore = Math.min(
        Math.log10(features.authorFollowerCount + 1) * 10,
        40
      );
      score += followerScore;
    }

    if (features.authorEngagementRate !== undefined) {
      // High engagement rate is key
      score += features.authorEngagementRate * 100 * 0.3;
    }

    if (features.authorVerified) {
      score += 15;
    }

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Score engagement-based features
   */
  private scoreEngagementFeatures(features: ContentFeatures): number {
    let score = 40;

    if (features.earlyEngagementRate !== undefined) {
      // Early engagement is critical predictor
      score += features.earlyEngagementRate * 100 * 0.5;
    }

    if (features.shareToLikeRatio !== undefined) {
      // High share ratio indicates viral potential
      const shareBonus = Math.min(features.shareToLikeRatio * 100, 30);
      score += shareBonus;
    }

    if (features.commentDepth !== undefined) {
      // Deep conversations indicate engagement
      score += Math.min(features.commentDepth * 5, 20);
    }

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Calculate confidence in prediction
   */
  private calculateConfidence(features: ContentFeatures): number {
    let availableFeatures = 0;
    let totalFeatures = 0;

    // Count available vs total features
    const featureGroups = [
      [features.wordCount, features.readabilityScore, features.emotionalTone],
      [features.hasImage, features.hasVideo, features.hasGif],
      [features.authorFollowerCount, features.authorEngagementRate],
      [features.earlyEngagementRate, features.shareToLikeRatio],
    ];

    featureGroups.forEach((group) => {
      totalFeatures += group.length;
      availableFeatures += group.filter(
        (f) => f !== undefined && f !== null
      ).length;
    });

    return availableFeatures / totalFeatures;
  }

  /**
   * Generate predictions
   */
  private generatePredictions(
    features: ContentFeatures,
    totalScore: number,
    contentScore: number,
    networkScore: number
  ) {
    // Estimate reach based on network and content score
    const baseReach = features.authorFollowerCount || 1000;
    const reachMultiplier = (totalScore / 100) * (contentScore / 100) * 5;
    const estimatedReach = Math.round(baseReach * reachMultiplier);

    // Estimate engagement rate
    const baseEngagement = features.authorEngagementRate || 0.02;
    const engagementMultiplier = totalScore / 100;
    const estimatedEngagementRate = baseEngagement * engagementMultiplier;

    // Predict peak time (hours from now)
    const peakHours = this.predictPeakTime(features, totalScore);

    return {
      estimatedReach,
      estimatedEngagementRate: parseFloat(estimatedEngagementRate.toFixed(4)),
      peakTime: `${peakHours} hours`,
    };
  }

  /**
   * Predict when content will peak
   */
  private predictPeakTime(features: ContentFeatures, score: number): number {
    // High-quality content peaks faster
    const baseTime = 6; // 6 hours average

    if (score > 80) {
      return 2; // 2 hours for viral content
    } else if (score > 60) {
      return 4;
    }

    // Network size affects speed
    if (features.authorFollowerCount && features.authorFollowerCount > 100000) {
      return baseTime / 2;
    }

    return baseTime;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    features: ContentFeatures,
    contentScore: number,
    timingScore: number,
    networkScore: number
  ): string[] {
    const recommendations: string[] = [];

    // Content recommendations
    if (contentScore < 60) {
      if (!features.hasImage && !features.hasVideo) {
        recommendations.push('Add visual media (image or video) to boost engagement');
      }
      if (features.wordCount < 20) {
        recommendations.push('Increase word count to 50-150 for optimal engagement');
      }
      if (!features.hasQuestion && !features.hasEmojis) {
        recommendations.push('Add interactive elements like questions or emojis');
      }
      if (features.readabilityScore < 60) {
        recommendations.push('Simplify language for better readability');
      }
    }

    // Timing recommendations
    if (timingScore < 60) {
      recommendations.push(
        'Consider posting during peak hours: 9-11am, 1-3pm, or 7-9pm'
      );
      if (features.isWeekend) {
        recommendations.push('Weekday posts typically perform better');
      }
    }

    // Network recommendations
    if (networkScore < 50) {
      recommendations.push('Engage with followers before posting to boost initial visibility');
      recommendations.push('Consider collaborating with larger accounts');
    }

    // Engagement recommendations
    if (!features.earlyEngagementRate) {
      recommendations.push('Respond to early comments to encourage more engagement');
    }

    // Add positive reinforcement if score is high
    if (contentScore > 75 && timingScore > 75) {
      recommendations.push('✓ Excellent content and timing - high viral potential!');
    }

    return recommendations;
  }

  /**
   * Track engagement velocity over time
   */
  trackEngagementVelocity(
    engagementHistory: Array<{ timestamp: Date; count: number }>
  ): EngagementVelocity {
    if (engagementHistory.length < 2) {
      return {
        currentRate: 0,
        predictedPeakRate: 0,
        timeToViral: 0,
        viralProbability: 0,
        stage: 'dormant',
      };
    }

    // Calculate rate of change
    const rates: number[] = [];
    for (let i = 1; i < engagementHistory.length; i++) {
      const timeDiff =
        (engagementHistory[i].timestamp.getTime() -
          engagementHistory[i - 1].timestamp.getTime()) /
        (1000 * 60); // minutes
      const countDiff =
        engagementHistory[i].count - engagementHistory[i - 1].count;
      rates.push(countDiff / timeDiff);
    }

    const currentRate = rates[rates.length - 1];
    const averageRate = rates.reduce((a, b) => a + b, 0) / rates.length;

    // Determine stage
    let stage: EngagementVelocity['stage'];
    if (currentRate < averageRate * 0.5) {
      stage = 'declining';
    } else if (currentRate > averageRate * 2) {
      stage = 'viral';
    } else if (currentRate > averageRate * 1.2) {
      stage = 'growing';
    } else {
      stage = 'dormant';
    }

    // Predict peak rate (exponential growth)
    const predictedPeakRate = currentRate * Math.exp(0.5);

    // Time to viral (heuristic)
    const viralThreshold = 100; // engagements per minute
    const timeToViral =
      currentRate > 0
        ? Math.max(0, (viralThreshold - currentRate) / (currentRate * 0.1))
        : 999;

    // Viral probability
    const viralProbability = Math.min(
      1,
      currentRate / viralThreshold
    );

    return {
      currentRate,
      predictedPeakRate,
      timeToViral,
      viralProbability,
      stage,
    };
  }

  /**
   * Analyze audience resonance patterns
   */
  analyzeAudienceResonance(
    contentHistory: Array<{
      features: ContentFeatures;
      actualEngagement: number;
    }>
  ): {
    bestPerformingFeatures: string[];
    worstPerformingFeatures: string[];
    optimalPostingWindow: { dayOfWeek: number; hourOfDay: number };
  } {
    // Find correlations between features and engagement
    const featurePerformance = new Map<string, number[]>();

    contentHistory.forEach((item) => {
      const { features, actualEngagement } = item;

      // Track performance by feature
      Object.entries(features).forEach(([key, value]) => {
        if (value === true) {
          if (!featurePerformance.has(key)) {
            featurePerformance.set(key, []);
          }
          featurePerformance.get(key)!.push(actualEngagement);
        }
      });
    });

    // Calculate average performance
    const avgPerformance = new Map<string, number>();
    featurePerformance.forEach((values, key) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      avgPerformance.set(key, avg);
    });

    // Sort by performance
    const sorted = Array.from(avgPerformance.entries()).sort(
      (a, b) => b[1] - a[1]
    );

    const bestPerformingFeatures = sorted.slice(0, 3).map(([key]) => key);
    const worstPerformingFeatures = sorted
      .slice(-3)
      .reverse()
      .map(([key]) => key);

    // Find optimal posting window
    const timePerformance = new Map<string, number[]>();
    contentHistory.forEach((item) => {
      if (item.features.dayOfWeek !== undefined && item.features.hourOfDay !== undefined) {
        const key = `${item.features.dayOfWeek}-${item.features.hourOfDay}`;
        if (!timePerformance.has(key)) {
          timePerformance.set(key, []);
        }
        timePerformance.get(key)!.push(item.actualEngagement);
      }
    });

    let bestWindow = { dayOfWeek: 3, hourOfDay: 10 }; // Default
    let bestAvg = 0;

    timePerformance.forEach((values, key) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      if (avg > bestAvg) {
        const [day, hour] = key.split('-').map(Number);
        bestWindow = { dayOfWeek: day, hourOfDay: hour };
        bestAvg = avg;
      }
    });

    return {
      bestPerformingFeatures,
      worstPerformingFeatures,
      optimalPostingWindow: bestWindow,
    };
  }
}

// Example usage
if (require.main === module) {
  const predictor = new ViralContentPredictor();

  const sampleFeatures: ContentFeatures = {
    wordCount: 120,
    readabilityScore: 75,
    emotionalTone: 'positive',
    hasQuestion: true,
    hasNumbers: true,
    hasEmojis: true,
    hasHashtags: true,
    hasImage: false,
    hasVideo: true,
    hasGif: false,
    mediaQuality: 'high',
    earlyEngagementRate: 0.05,
    shareToLikeRatio: 0.3,
    commentDepth: 2,
    dayOfWeek: 3,
    hourOfDay: 10,
    isWeekend: false,
    authorFollowerCount: 50000,
    authorEngagementRate: 0.03,
    authorVerified: true,
  };

  const result = predictor.calculateViralityScore(sampleFeatures);
  console.log('Virality Score:', result);
}
