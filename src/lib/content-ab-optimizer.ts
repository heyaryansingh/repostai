/**
 * Content A/B Testing Optimizer
 *
 * Automatically generates and tracks A/B test variations of social media content
 * to optimize engagement metrics. Uses Thompson Sampling for multi-armed bandit
 * optimization.
 */

export interface ContentVariation {
  id: string;
  content: string;
  variant_name: string;
  platform: "twitter" | "linkedin" | "instagram";
  impressions: number;
  engagements: number;
  clicks: number;
  conversions: number;
  engagement_rate: number;
  created_at: Date;
}

export interface ABTestConfig {
  test_id: string;
  control_content: string;
  variations: string[];
  platform: string;
  objective: "engagement" | "clicks" | "conversions";
  min_sample_size: number;
  confidence_threshold: number;
}

export interface ABTestResult {
  test_id: string;
  winner: string | null;
  confidence: number;
  variants_performance: VariantPerformance[];
  recommendation: string;
  statistical_significance: boolean;
}

export interface VariantPerformance {
  variant_id: string;
  variant_name: string;
  impressions: number;
  engagements: number;
  engagement_rate: number;
  uplift_vs_control: number;
  probability_best: number;
}

/**
 * Thompson Sampling for multi-armed bandit optimization
 */
export class ThompsonSampler {
  private alpha: Map<string, number>; // Success counts (Beta prior)
  private beta: Map<string, number>; // Failure counts (Beta prior)

  constructor() {
    this.alpha = new Map();
    this.beta = new Map();
  }

  /**
   * Initialize a variant
   */
  initVariant(variantId: string, priorAlpha = 1, priorBeta = 1): void {
    this.alpha.set(variantId, priorAlpha);
    this.beta.set(variantId, priorBeta);
  }

  /**
   * Update variant after observing outcome
   */
  update(variantId: string, success: boolean): void {
    const currentAlpha = this.alpha.get(variantId) || 1;
    const currentBeta = this.beta.get(variantId) || 1;

    if (success) {
      this.alpha.set(variantId, currentAlpha + 1);
    } else {
      this.beta.set(variantId, currentBeta + 1);
    }
  }

  /**
   * Select variant to show (Thompson Sampling)
   */
  selectVariant(variantIds: string[]): string {
    let bestVariant = variantIds[0];
    let maxSample = 0;

    for (const variantId of variantIds) {
      const alpha = this.alpha.get(variantId) || 1;
      const beta = this.beta.get(variantId) || 1;

      // Sample from Beta distribution
      const sample = this.sampleBeta(alpha, beta);

      if (sample > maxSample) {
        maxSample = sample;
        bestVariant = variantId;
      }
    }

    return bestVariant;
  }

  /**
   * Calculate probability that a variant is the best
   */
  probabilityBest(
    targetVariantId: string,
    allVariantIds: string[],
    samples = 10000
  ): number {
    let wins = 0;

    for (let i = 0; i < samples; i++) {
      const targetAlpha = this.alpha.get(targetVariantId) || 1;
      const targetBeta = this.beta.get(targetVariantId) || 1;
      const targetSample = this.sampleBeta(targetAlpha, targetBeta);

      let isBest = true;
      for (const otherVariantId of allVariantIds) {
        if (otherVariantId === targetVariantId) continue;

        const otherAlpha = this.alpha.get(otherVariantId) || 1;
        const otherBeta = this.beta.get(otherVariantId) || 1;
        const otherSample = this.sampleBeta(otherAlpha, otherBeta);

        if (otherSample > targetSample) {
          isBest = false;
          break;
        }
      }

      if (isBest) wins++;
    }

    return wins / samples;
  }

  /**
   * Sample from Beta distribution using gamma approximation
   */
  private sampleBeta(alpha: number, beta: number): number {
    const x = this.sampleGamma(alpha);
    const y = this.sampleGamma(beta);
    return x / (x + y);
  }

  /**
   * Sample from Gamma distribution
   */
  private sampleGamma(shape: number): number {
    // Marsaglia and Tsang's method
    if (shape < 1) {
      return this.sampleGamma(shape + 1) * Math.pow(Math.random(), 1 / shape);
    }

    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);

    while (true) {
      let x, v;
      do {
        x = this.normalRandom();
        v = 1 + c * x;
      } while (v <= 0);

      v = v * v * v;
      const u = Math.random();

      if (
        u < 1 - 0.0331 * x * x * x * x ||
        Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))
      ) {
        return d * v;
      }
    }
  }

  /**
   * Sample from standard normal distribution (Box-Muller transform)
   */
  private normalRandom(): number {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  /**
   * Get expected value (mean) for a variant
   */
  getExpectedValue(variantId: string): number {
    const alpha = this.alpha.get(variantId) || 1;
    const beta = this.beta.get(variantId) || 1;
    return alpha / (alpha + beta);
  }
}

/**
 * Main A/B Testing Optimizer
 */
export class ContentABOptimizer {
  private sampler: ThompsonSampler;

  constructor() {
    this.sampler = new ThompsonSampler();
  }

  /**
   * Generate content variations for A/B testing
   */
  generateVariations(
    originalContent: string,
    platform: string,
    numVariations = 3
  ): string[] {
    const variations: string[] = [originalContent]; // Control

    // Variation strategies
    const strategies = [
      this.addEmoji,
      this.shortenContent,
      this.addCallToAction,
      this.emphasisVariation,
      this.questionVariation,
      this.urgencyVariation,
    ];

    for (let i = 0; i < numVariations && i < strategies.length; i++) {
      const strategy = strategies[i];
      const variation = strategy.call(this, originalContent, platform);
      variations.push(variation);
    }

    return variations;
  }

  /**
   * Add emojis to content
   */
  private addEmoji(content: string, platform: string): string {
    const emojis = ["🚀", "💡", "🔥", "✨", "💪", "👇", "📈", "🎯"];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

    if (platform === "twitter" || platform === "instagram") {
      return `${randomEmoji} ${content}`;
    }
    return content;
  }

  /**
   * Shorten content (first sentence + CTA)
   */
  private shortenContent(content: string, platform: string): string {
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim());
    if (sentences.length <= 1) return content;

    const firstSentence = sentences[0].trim();
    return `${firstSentence}. Read more 👇`;
  }

  /**
   * Add call-to-action
   */
  private addCallToAction(content: string, platform: string): string {
    const ctas = [
      "What do you think? Drop a comment below!",
      "Share your thoughts in the comments!",
      "Let me know what you think!",
      "Comment if you agree 👇",
    ];
    const randomCta = ctas[Math.floor(Math.random() * ctas.length)];
    return `${content}\n\n${randomCta}`;
  }

  /**
   * Add emphasis (bold, caps)
   */
  private emphasisVariation(content: string, platform: string): string {
    // Capitalize first word
    const words = content.split(" ");
    if (words.length > 0) {
      words[0] = words[0].toUpperCase();
    }
    return words.join(" ");
  }

  /**
   * Turn into a question
   */
  private questionVariation(content: string, platform: string): string {
    const questions = [
      "Did you know?",
      "Here's something interesting:",
      "Ever wonder why?",
      "Quick question:",
    ];
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    return `${randomQuestion} ${content}`;
  }

  /**
   * Add urgency
   */
  private urgencyVariation(content: string, platform: string): string {
    const urgencyPhrases = [
      "Don't miss this:",
      "Important:",
      "Breaking:",
      "New:",
    ];
    const randomPhrase =
      urgencyPhrases[Math.floor(Math.random() * urgencyPhrases.length)];
    return `${randomPhrase} ${content}`;
  }

  /**
   * Initialize A/B test
   */
  initializeTest(config: ABTestConfig): void {
    // Initialize control
    this.sampler.initVariant(`${config.test_id}_control`);

    // Initialize variations
    config.variations.forEach((_, idx) => {
      this.sampler.initVariant(`${config.test_id}_var${idx + 1}`);
    });
  }

  /**
   * Select which variant to show (Thompson Sampling)
   */
  selectVariant(testId: string, numVariations: number): number {
    const variantIds = [
      `${testId}_control`,
      ...Array.from({ length: numVariations }, (_, i) => `${testId}_var${i + 1}`),
    ];

    const selectedId = this.sampler.selectVariant(variantIds);

    if (selectedId === `${testId}_control`) {
      return 0; // Control
    }

    const match = selectedId.match(/var(\d+)$/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Record observation (impression + engagement)
   */
  recordObservation(
    testId: string,
    variantIndex: number,
    engaged: boolean
  ): void {
    const variantId =
      variantIndex === 0
        ? `${testId}_control`
        : `${testId}_var${variantIndex}`;

    this.sampler.update(variantId, engaged);
  }

  /**
   * Analyze test results
   */
  analyzeTest(
    testId: string,
    variants: ContentVariation[],
    confidenceThreshold = 0.95
  ): ABTestResult {
    const variantIds = variants.map((v) => v.id);

    // Calculate performance for each variant
    const variantsPerformance: VariantPerformance[] = variants.map((v) => {
      const engagementRate =
        v.impressions > 0 ? v.engagements / v.impressions : 0;

      const probabilityBest = this.sampler.probabilityBest(v.id, variantIds);

      // Calculate uplift vs control (first variant)
      const controlRate = variants[0].engagement_rate;
      const uplift =
        controlRate > 0 ? (engagementRate - controlRate) / controlRate : 0;

      return {
        variant_id: v.id,
        variant_name: v.variant_name,
        impressions: v.impressions,
        engagements: v.engagements,
        engagement_rate: engagementRate,
        uplift_vs_control: uplift * 100,
        probability_best: probabilityBest,
      };
    });

    // Sort by probability of being best
    variantsPerformance.sort((a, b) => b.probability_best - a.probability_best);

    const bestVariant = variantsPerformance[0];
    const winner =
      bestVariant.probability_best >= confidenceThreshold
        ? bestVariant.variant_id
        : null;

    // Check statistical significance
    const minSamples = variants.every((v) => v.impressions >= 100);
    const statistical_significance =
      minSamples && bestVariant.probability_best >= confidenceThreshold;

    // Generate recommendation
    let recommendation = "";
    if (winner) {
      recommendation = `Use variant "${bestVariant.variant_name}" - it has a ${(bestVariant.probability_best * 100).toFixed(1)}% probability of being best with ${bestVariant.uplift_vs_control.toFixed(1)}% uplift vs control.`;
    } else if (!minSamples) {
      recommendation = `Need more data. Ensure each variant has at least 100 impressions.`;
    } else {
      recommendation = `No clear winner yet. Continue testing until one variant reaches ${(confidenceThreshold * 100).toFixed(0)}% confidence.`;
    }

    return {
      test_id: testId,
      winner,
      confidence: bestVariant.probability_best,
      variants_performance: variantsPerformance,
      recommendation,
      statistical_significance,
    };
  }

  /**
   * Calculate required sample size for A/B test
   */
  calculateRequiredSampleSize(
    baselineRate: number,
    minimumDetectableEffect: number,
    alpha = 0.05,
    power = 0.8
  ): number {
    // Simplified sample size calculation
    // For more accurate calculations, use a proper statistical library

    const p1 = baselineRate;
    const p2 = baselineRate * (1 + minimumDetectableEffect);

    const z_alpha = 1.96; // 95% confidence
    const z_beta = 0.84; // 80% power

    const pooledP = (p1 + p2) / 2;

    const n =
      Math.pow(z_alpha + z_beta, 2) *
      (p1 * (1 - p1) + p2 * (1 - p2)) /
      Math.pow(p2 - p1, 2);

    return Math.ceil(n);
  }

  /**
   * Get test progress
   */
  getTestProgress(
    variants: ContentVariation[],
    requiredSampleSize: number
  ): number {
    const totalImpressions = variants.reduce(
      (sum, v) => sum + v.impressions,
      0
    );
    const requiredTotal = requiredSampleSize * variants.length;

    return Math.min(totalImpressions / requiredTotal, 1.0);
  }
}

/**
 * Generate A/B test report
 */
export function generateABTestReport(result: ABTestResult): string {
  let report = `# A/B Test Report\n\n`;
  report += `**Test ID:** ${result.test_id}\n\n`;

  if (result.winner) {
    report += `## 🏆 Winner\n\n`;
    report += `**${result.variants_performance[0].variant_name}** with ${(result.confidence * 100).toFixed(1)}% confidence\n\n`;
  } else {
    report += `## ⏳ Test In Progress\n\n`;
    report += `No clear winner yet. ${result.recommendation}\n\n`;
  }

  report += `## Variant Performance\n\n`;
  report += `| Variant | Impressions | Engagement Rate | Uplift vs Control | P(Best) |\n`;
  report += `|---------|-------------|-----------------|-------------------|---------|\n`;

  for (const v of result.variants_performance) {
    report += `| ${v.variant_name} | ${v.impressions} | ${(v.engagement_rate * 100).toFixed(2)}% | ${v.uplift_vs_control >= 0 ? "+" : ""}${v.uplift_vs_control.toFixed(1)}% | ${(v.probability_best * 100).toFixed(1)}% |\n`;
  }

  report += `\n## Recommendation\n\n`;
  report += result.recommendation;

  if (result.statistical_significance) {
    report += `\n\n✅ **Statistically significant** - safe to implement winning variant.`;
  } else {
    report += `\n\n⚠️ **Not statistically significant yet** - continue testing.`;
  }

  return report;
}
