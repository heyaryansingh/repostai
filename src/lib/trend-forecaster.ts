/**
 * Trend forecasting for social media content using time series analysis.
 * Predicts engagement trends, optimal posting times, and content lifecycle.
 */

export interface TrendData {
  timestamp: Date;
  metric: number;
  label?: string;
}

export interface TrendForecast {
  predictions: TrendData[];
  confidence: number;
  trendDirection: 'up' | 'down' | 'stable';
  changeRate: number;
  seasonality?: {
    period: number;
    strength: number;
  };
}

export interface ContentTrendAnalysis {
  growthRate: number;
  peakTime: Date;
  decayRate: number;
  viralityScore: number;
  lifecycle: 'emerging' | 'trending' | 'peak' | 'declining' | 'saturated';
}

/**
 * Simple Moving Average for trend smoothing.
 */
export function movingAverage(data: number[], windowSize: number): number[] {
  const result: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < windowSize - 1) {
      result.push(data[i]);
      continue;
    }

    const window = data.slice(i - windowSize + 1, i + 1);
    const avg = window.reduce((sum, val) => sum + val, 0) / windowSize;
    result.push(avg);
  }

  return result;
}

/**
 * Exponential Moving Average for trend detection.
 */
export function exponentialMovingAverage(
  data: number[],
  alpha: number = 0.3
): number[] {
  if (data.length === 0) return [];

  const result: number[] = [data[0]];

  for (let i = 1; i < data.length; i++) {
    const ema = alpha * data[i] + (1 - alpha) * result[i - 1];
    result.push(ema);
  }

  return result;
}

/**
 * Calculate trend direction and strength.
 */
export function calculateTrendDirection(
  data: number[]
): { direction: 'up' | 'down' | 'stable'; strength: number } {
  if (data.length < 2) {
    return { direction: 'stable', strength: 0 };
  }

  // Linear regression
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = data;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  // Normalize slope by mean
  const meanY = sumY / n;
  const normalizedSlope = slope / (meanY || 1);

  let direction: 'up' | 'down' | 'stable';
  if (Math.abs(normalizedSlope) < 0.01) {
    direction = 'stable';
  } else if (normalizedSlope > 0) {
    direction = 'up';
  } else {
    direction = 'down';
  }

  return {
    direction,
    strength: Math.abs(normalizedSlope),
  };
}

/**
 * Detect seasonality in time series data.
 */
export function detectSeasonality(
  data: number[],
  maxPeriod: number = 24
): { period: number; strength: number } | null {
  if (data.length < maxPeriod * 2) {
    return null;
  }

  let bestPeriod = 0;
  let bestCorrelation = 0;

  for (let period = 2; period <= maxPeriod; period++) {
    let correlation = 0;
    let count = 0;

    for (let i = period; i < data.length; i++) {
      correlation += data[i] * data[i - period];
      count++;
    }

    correlation /= count;

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestPeriod = period;
    }
  }

  // Only return if correlation is significant
  if (bestCorrelation > 0.3) {
    return {
      period: bestPeriod,
      strength: bestCorrelation,
    };
  }

  return null;
}

/**
 * Simple linear forecast.
 */
export function linearForecast(
  historical: TrendData[],
  periodsAhead: number
): TrendForecast {
  const values = historical.map(d => d.metric);
  const { direction, strength } = calculateTrendDirection(values);

  // Calculate linear trend
  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = values;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Generate predictions
  const predictions: TrendData[] = [];
  const lastTimestamp = historical[historical.length - 1].timestamp;

  for (let i = 1; i <= periodsAhead; i++) {
    const predictedValue = slope * (n + i - 1) + intercept;
    const timestamp = new Date(lastTimestamp.getTime() + i * 3600000); // 1 hour ahead

    predictions.push({
      timestamp,
      metric: Math.max(0, predictedValue), // Don't predict negative values
    });
  }

  // Calculate confidence based on data variance
  const meanY = sumY / n;
  const variance =
    y.reduce((sum, yi) => sum + (yi - meanY) ** 2, 0) / n;
  const confidence = Math.max(0, 1 - variance / (meanY ** 2 || 1));

  return {
    predictions,
    confidence: Math.min(1, confidence),
    trendDirection: direction,
    changeRate: slope,
  };
}

/**
 * Forecast with seasonality adjustment.
 */
export function seasonalForecast(
  historical: TrendData[],
  periodsAhead: number
): TrendForecast {
  const values = historical.map(d => d.metric);

  // Detect seasonality
  const seasonality = detectSeasonality(values);

  // Get base trend
  const baseForecast = linearForecast(historical, periodsAhead);

  if (!seasonality) {
    return baseForecast;
  }

  // Adjust predictions with seasonal component
  const seasonalValues = values.slice(-seasonality.period);

  baseForecast.predictions = baseForecast.predictions.map((pred, i) => {
    const seasonalIndex = i % seasonality.period;
    const seasonalFactor = seasonalValues[seasonalIndex] / (values[values.length - seasonality.period + seasonalIndex] || 1);

    return {
      ...pred,
      metric: pred.metric * seasonalFactor,
    };
  });

  baseForecast.seasonality = seasonality;

  return baseForecast;
}

/**
 * Analyze content trend lifecycle.
 */
export function analyzeContentLifecycle(
  engagementHistory: TrendData[]
): ContentTrendAnalysis {
  if (engagementHistory.length < 3) {
    return {
      growthRate: 0,
      peakTime: new Date(),
      decayRate: 0,
      viralityScore: 0,
      lifecycle: 'emerging',
    };
  }

  const values = engagementHistory.map(d => d.metric);
  const timestamps = engagementHistory.map(d => d.timestamp);

  // Find peak
  const maxValue = Math.max(...values);
  const peakIndex = values.indexOf(maxValue);
  const peakTime = timestamps[peakIndex];

  // Calculate growth rate (before peak)
  const growthPhase = values.slice(0, peakIndex + 1);
  const growthRate = growthPhase.length > 1
    ? (growthPhase[growthPhase.length - 1] - growthPhase[0]) / growthPhase.length
    : 0;

  // Calculate decay rate (after peak)
  const decayPhase = values.slice(peakIndex);
  const decayRate = decayPhase.length > 1
    ? (decayPhase[0] - decayPhase[decayPhase.length - 1]) / decayPhase.length
    : 0;

  // Virality score: how quickly it grew relative to baseline
  const baseline = values[0] || 1;
  const viralityScore = Math.min(1, (maxValue - baseline) / baseline);

  // Determine lifecycle stage
  let lifecycle: ContentTrendAnalysis['lifecycle'] = 'emerging';
  const currentValue = values[values.length - 1];
  const percentOfPeak = currentValue / maxValue;

  if (peakIndex < values.length * 0.3) {
    lifecycle = 'emerging';
  } else if (peakIndex < values.length * 0.7 && percentOfPeak > 0.8) {
    lifecycle = 'trending';
  } else if (peakIndex >= values.length - 2 && percentOfPeak > 0.9) {
    lifecycle = 'peak';
  } else if (percentOfPeak < 0.5) {
    lifecycle = 'declining';
  } else if (percentOfPeak < 0.2) {
    lifecycle = 'saturated';
  }

  return {
    growthRate,
    peakTime,
    decayRate,
    viralityScore,
    lifecycle,
  };
}

/**
 * Find optimal posting times based on historical engagement.
 */
export function findOptimalPostingTimes(
  engagementByHour: Map<number, number[]>,
  topN: number = 3
): { hour: number; score: number; confidence: number }[] {
  const hourlyScores: { hour: number; score: number; confidence: number }[] = [];

  for (const [hour, engagements] of engagementByHour.entries()) {
    if (engagements.length === 0) continue;

    const avgEngagement = engagements.reduce((a, b) => a + b, 0) / engagements.length;
    const variance = engagements.reduce((sum, e) => sum + (e - avgEngagement) ** 2, 0) / engagements.length;
    const confidence = 1 - Math.min(1, variance / (avgEngagement ** 2 || 1));

    hourlyScores.push({
      hour,
      score: avgEngagement,
      confidence,
    });
  }

  return hourlyScores
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

/**
 * Predict engagement for a given posting time.
 */
export function predictEngagement(
  postTime: Date,
  historicalData: TrendData[],
  contentType?: string
): {
  predictedEngagement: number;
  confidence: number;
  recommendation: 'optimal' | 'good' | 'fair' | 'poor';
} {
  const hour = postTime.getHours();

  // Filter by hour of day
  const sameHourData = historicalData.filter(
    d => d.timestamp.getHours() === hour
  );

  if (sameHourData.length === 0) {
    return {
      predictedEngagement: 0,
      confidence: 0,
      recommendation: 'poor',
    };
  }

  const values = sameHourData.map(d => d.metric);
  const avgEngagement = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - avgEngagement) ** 2, 0) / values.length;
  const confidence = 1 - Math.min(1, variance / (avgEngagement ** 2 || 1));

  // Determine recommendation
  const allAvg = historicalData.reduce((sum, d) => sum + d.metric, 0) / historicalData.length;
  const percentile = avgEngagement / allAvg;

  let recommendation: 'optimal' | 'good' | 'fair' | 'poor' = 'poor';
  if (percentile > 1.5) recommendation = 'optimal';
  else if (percentile > 1.0) recommendation = 'good';
  else if (percentile > 0.7) recommendation = 'fair';

  return {
    predictedEngagement: avgEngagement,
    confidence,
    recommendation,
  };
}

/**
 * Generate trend report for content strategy.
 */
export function generateTrendReport(
  historicalData: TrendData[],
  forecastHorizon: number = 24
): {
  currentTrend: ReturnType<typeof calculateTrendDirection>;
  forecast: TrendForecast;
  optimalTimes: ReturnType<typeof findOptimalPostingTimes>;
  lifecycle: ContentTrendAnalysis;
} {
  const currentTrend = calculateTrendDirection(
    historicalData.map(d => d.metric)
  );

  const forecast = seasonalForecast(historicalData, forecastHorizon);

  // Group by hour of day
  const byHour = new Map<number, number[]>();
  historicalData.forEach(d => {
    const hour = d.timestamp.getHours();
    if (!byHour.has(hour)) {
      byHour.set(hour, []);
    }
    byHour.get(hour)!.push(d.metric);
  });

  const optimalTimes = findOptimalPostingTimes(byHour);
  const lifecycle = analyzeContentLifecycle(historicalData);

  return {
    currentTrend,
    forecast,
    optimalTimes,
    lifecycle,
  };
}
