/**
 * Sentiment analysis for social media content.
 *
 * Analyzes emotional tone, engagement potential, and audience response prediction.
 */

export type SentimentScore = {
  polarity: number; // -1 (negative) to 1 (positive)
  subjectivity: number; // 0 (objective) to 1 (subjective)
  confidence: number; // 0 to 1
};

export type EmotionScores = {
  joy: number;
  sadness: number;
  anger: number;
  fear: number;
  surprise: number;
  neutral: number;
};

export type ToneAnalysis = {
  overall: 'positive' | 'negative' | 'neutral' | 'mixed';
  sentiment: SentimentScore;
  emotions: EmotionScores;
  engagement_prediction: 'high' | 'medium' | 'low';
  recommendations: string[];
};

// Positive and negative word lists for basic sentiment
const POSITIVE_WORDS = new Set([
  'amazing', 'awesome', 'excellent', 'fantastic', 'great', 'love', 'perfect',
  'wonderful', 'best', 'brilliant', 'excited', 'happy', 'thrilled', 'incredible',
  'outstanding', 'superb', 'delightful', 'impressive', 'success', 'achieve',
  'win', 'winner', 'champion', 'breakthrough', 'innovation', 'revolutionary',
]);

const NEGATIVE_WORDS = new Set([
  'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'disappointing',
  'poor', 'failure', 'failed', 'problem', 'issue', 'difficult', 'struggle',
  'concern', 'worried', 'frustrated', 'angry', 'sad', 'unfortunate',
]);

const INTENSIFIERS = new Set([
  'very', 'extremely', 'incredibly', 'absolutely', 'really', 'so', 'too',
  'quite', 'totally', 'completely', 'utterly',
]);

const NEGATIONS = new Set([
  'not', 'no', 'never', 'neither', 'nobody', 'nothing', 'nowhere',
  'none', 'hardly', 'barely', 'scarcely',
]);

/**
 * Analyze sentiment of text content.
 */
export function analyzeSentiment(text: string): SentimentScore {
  const words = text.toLowerCase().split(/\s+/);

  let positiveScore = 0;
  let negativeScore = 0;
  let subjectiveScore = 0;
  let intensifier = 1;
  let negated = false;

  for (let i = 0; i < words.length; i++) {
    const word = words[i].replace(/[^\w]/g, '');

    // Check for intensifiers
    if (INTENSIFIERS.has(word)) {
      intensifier = 1.5;
      continue;
    }

    // Check for negations
    if (NEGATIONS.has(word)) {
      negated = true;
      continue;
    }

    // Check sentiment
    if (POSITIVE_WORDS.has(word)) {
      const score = intensifier * (negated ? -1 : 1);
      positiveScore += score;
      subjectiveScore += 0.5;
    } else if (NEGATIVE_WORDS.has(word)) {
      const score = intensifier * (negated ? -1 : 1);
      negativeScore += score;
      subjectiveScore += 0.5;
    }

    // Reset modifiers
    intensifier = 1;
    negated = false;
  }

  // Normalize scores
  const totalWords = words.length || 1;
  const polarity = (positiveScore - negativeScore) / totalWords;
  const subjectivity = Math.min(subjectiveScore / totalWords, 1);

  // Confidence based on number of sentiment-bearing words
  const sentimentWords = positiveScore + Math.abs(negativeScore);
  const confidence = Math.min(sentimentWords / (totalWords * 0.2), 1);

  return {
    polarity: Math.max(-1, Math.min(1, polarity)),
    subjectivity,
    confidence,
  };
}

/**
 * Detect emotional content in text.
 */
export function detectEmotions(text: string): EmotionScores {
  const words = text.toLowerCase().split(/\s+/);

  const joyWords = ['happy', 'joy', 'excited', 'love', 'great', 'wonderful', 'amazing'];
  const sadWords = ['sad', 'disappointed', 'unfortunate', 'loss', 'miss'];
  const angerWords = ['angry', 'frustrated', 'hate', 'terrible', 'awful'];
  const fearWords = ['worried', 'scared', 'concern', 'afraid', 'anxiety'];
  const surpriseWords = ['surprised', 'unexpected', 'shocking', 'wow', 'incredible'];

  let joyScore = 0;
  let sadScore = 0;
  let angerScore = 0;
  let fearScore = 0;
  let surpriseScore = 0;

  for (const word of words) {
    const cleanWord = word.replace(/[^\w]/g, '');

    if (joyWords.some(w => cleanWord.includes(w))) joyScore++;
    if (sadWords.some(w => cleanWord.includes(w))) sadScore++;
    if (angerWords.some(w => cleanWord.includes(w))) angerScore++;
    if (fearWords.some(w => cleanWord.includes(w))) fearScore++;
    if (surpriseWords.some(w => cleanWord.includes(w))) surpriseScore++;
  }

  const total = joyScore + sadScore + angerScore + fearScore + surpriseScore || 1;
  const neutral = Math.max(0, 1 - (total / words.length) * 5);

  return {
    joy: joyScore / total,
    sadness: sadScore / total,
    anger: angerScore / total,
    fear: fearScore / total,
    surprise: surpriseScore / total,
    neutral,
  };
}

/**
 * Predict engagement potential based on tone analysis.
 */
export function predictEngagement(
  sentiment: SentimentScore,
  emotions: EmotionScores,
  platform: 'twitter' | 'linkedin' | 'instagram'
): 'high' | 'medium' | 'low' {
  // Platform-specific scoring
  let score = 0;

  if (platform === 'twitter') {
    // Twitter favors strong emotions and opinions
    score += sentiment.polarity > 0.5 || sentiment.polarity < -0.3 ? 2 : 0;
    score += emotions.surprise > 0.3 ? 1 : 0;
    score += emotions.joy > 0.4 ? 1 : 0;
    score += sentiment.subjectivity > 0.6 ? 1 : 0;
  } else if (platform === 'linkedin') {
    // LinkedIn favors professional, positive tone
    score += sentiment.polarity > 0.3 && sentiment.polarity < 0.8 ? 2 : 0;
    score += emotions.neutral > 0.5 ? 1 : 0;
    score += sentiment.subjectivity < 0.5 ? 1 : 0;
  } else if (platform === 'instagram') {
    // Instagram favors positive, emotional content
    score += sentiment.polarity > 0.4 ? 2 : 0;
    score += emotions.joy > 0.3 ? 2 : 0;
    score += emotions.surprise > 0.2 ? 1 : 0;
  }

  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

/**
 * Generate recommendations to improve content tone.
 */
export function generateToneRecommendations(
  sentiment: SentimentScore,
  emotions: EmotionScores,
  platform: 'twitter' | 'linkedin' | 'instagram'
): string[] {
  const recommendations: string[] = [];

  // Check if sentiment is too negative
  if (sentiment.polarity < -0.3) {
    recommendations.push('Consider adding more positive framing or solutions to balance negative content.');
  }

  // Check if content is too neutral/boring
  if (sentiment.polarity > -0.2 && sentiment.polarity < 0.2 && emotions.neutral > 0.7) {
    recommendations.push('Add more emotional appeal or personal perspective to increase engagement.');
  }

  // Platform-specific recommendations
  if (platform === 'twitter') {
    if (emotions.surprise < 0.1) {
      recommendations.push('Twitter users engage more with surprising or unexpected content.');
    }
    if (sentiment.subjectivity < 0.3) {
      recommendations.push('Add your personal take or opinion to make content more engaging on Twitter.');
    }
  } else if (platform === 'linkedin') {
    if (sentiment.polarity > 0.8) {
      recommendations.push('LinkedIn audiences prefer balanced, professional tone over overly enthusiastic content.');
    }
    if (emotions.joy > 0.6 || emotions.surprise > 0.5) {
      recommendations.push('Consider toning down emotional language for LinkedIn\'s professional audience.');
    }
  } else if (platform === 'instagram') {
    if (sentiment.polarity < 0.3) {
      recommendations.push('Instagram users typically respond better to positive, uplifting content.');
    }
    if (emotions.joy < 0.2) {
      recommendations.push('Add more enthusiasm or positive emotion to resonate with Instagram audience.');
    }
  }

  // Confidence warning
  if (sentiment.confidence < 0.3) {
    recommendations.push('Content may benefit from clearer emotional signals or stronger language.');
  }

  return recommendations;
}

/**
 * Complete tone analysis with recommendations.
 */
export function analyzeTone(
  text: string,
  platform: 'twitter' | 'linkedin' | 'instagram'
): ToneAnalysis {
  const sentiment = analyzeSentiment(text);
  const emotions = detectEmotions(text);
  const engagement_prediction = predictEngagement(sentiment, emotions, platform);
  const recommendations = generateToneRecommendations(sentiment, emotions, platform);

  // Determine overall tone
  let overall: 'positive' | 'negative' | 'neutral' | 'mixed';
  if (sentiment.polarity > 0.3) {
    overall = 'positive';
  } else if (sentiment.polarity < -0.3) {
    overall = 'negative';
  } else if (Math.abs(sentiment.polarity) < 0.1) {
    overall = 'neutral';
  } else {
    overall = 'mixed';
  }

  return {
    overall,
    sentiment,
    emotions,
    engagement_prediction,
    recommendations,
  };
}

/**
 * Compare tone across multiple content variations.
 */
export function compareContentTones(
  variations: Record<string, string>,
  platform: 'twitter' | 'linkedin' | 'instagram'
): Record<string, ToneAnalysis> {
  const results: Record<string, ToneAnalysis> = {};

  for (const [key, content] of Object.entries(variations)) {
    results[key] = analyzeTone(content, platform);
  }

  return results;
}

/**
 * Get the best performing content variation based on tone analysis.
 */
export function selectBestToneMatch(
  analyses: Record<string, ToneAnalysis>,
  preferPositive: boolean = true
): string | null {
  let bestKey: string | null = null;
  let bestScore = -Infinity;

  for (const [key, analysis] of Object.entries(analyses)) {
    let score = 0;

    // Engagement prediction weight
    if (analysis.engagement_prediction === 'high') score += 3;
    else if (analysis.engagement_prediction === 'medium') score += 1.5;

    // Sentiment weight
    if (preferPositive) {
      score += analysis.sentiment.polarity * 2;
    }

    // Confidence weight
    score += analysis.sentiment.confidence;

    // Fewer recommendations = better
    score -= analysis.recommendations.length * 0.5;

    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }

  return bestKey;
}
