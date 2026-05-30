/**
 * Content ROI Calculator - Calculate return on investment for content marketing
 *
 * Tracks content creation costs, distribution expenses, and measures returns
 * through engagement, conversions, and revenue attribution.
 */

interface ContentCost {
  creationTime: number; // hours
  hourlyRate: number;
  toolsCost: number;
  promotionCost: number;
  totalCost?: number;
}

interface ContentPerformance {
  impressions: number;
  reach: number;
  engagement: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

interface ROIMetrics {
  totalCost: number;
  totalRevenue: number;
  roi: number; // percentage
  roas: number; // return on ad spend
  cpa: number; // cost per acquisition
  cpc: number; // cost per click
  cpe: number; // cost per engagement
  cpm: number; // cost per thousand impressions
  conversionRate: number;
  engagementRate: number;
  revenuePerImpression: number;
  profitMargin: number;
}

interface ContentPiece {
  id: string;
  title: string;
  platform: string;
  publishDate: Date;
  cost: ContentCost;
  performance: ContentPerformance;
}

interface CampaignROI {
  campaignName: string;
  startDate: Date;
  endDate: Date;
  contentPieces: ContentPiece[];
  aggregatedMetrics: ROIMetrics;
  topPerformers: ContentPiece[];
  underperformers: ContentPiece[];
}

export class ContentROICalculator {
  /**
   * Calculate total cost for content piece
   */
  calculateTotalCost(cost: ContentCost): number {
    const laborCost = cost.creationTime * cost.hourlyRate;
    return laborCost + cost.toolsCost + cost.promotionCost;
  }

  /**
   * Calculate comprehensive ROI metrics
   */
  calculateROI(content: ContentPiece): ROIMetrics {
    const totalCost = this.calculateTotalCost(content.cost);
    const { performance } = content;

    // ROI = (Revenue - Cost) / Cost * 100
    const roi = totalCost > 0
      ? ((performance.revenue - totalCost) / totalCost) * 100
      : 0;

    // ROAS = Revenue / Ad Spend
    const roas = content.cost.promotionCost > 0
      ? performance.revenue / content.cost.promotionCost
      : 0;

    // Cost per acquisition
    const cpa = performance.conversions > 0
      ? totalCost / performance.conversions
      : 0;

    // Cost per click
    const cpc = performance.clicks > 0
      ? totalCost / performance.clicks
      : 0;

    // Cost per engagement
    const cpe = performance.engagement > 0
      ? totalCost / performance.engagement
      : 0;

    // Cost per thousand impressions
    const cpm = performance.impressions > 0
      ? (totalCost / performance.impressions) * 1000
      : 0;

    // Conversion rate
    const conversionRate = performance.clicks > 0
      ? (performance.conversions / performance.clicks) * 100
      : 0;

    // Engagement rate
    const engagementRate = performance.reach > 0
      ? (performance.engagement / performance.reach) * 100
      : 0;

    // Revenue per impression
    const revenuePerImpression = performance.impressions > 0
      ? performance.revenue / performance.impressions
      : 0;

    // Profit margin
    const profitMargin = performance.revenue > 0
      ? ((performance.revenue - totalCost) / performance.revenue) * 100
      : 0;

    return {
      totalCost,
      totalRevenue: performance.revenue,
      roi,
      roas,
      cpa,
      cpc,
      cpe,
      cpm,
      conversionRate,
      engagementRate,
      revenuePerImpression,
      profitMargin
    };
  }

  /**
   * Calculate campaign-level ROI
   */
  calculateCampaignROI(
    campaignName: string,
    contentPieces: ContentPiece[],
    startDate: Date,
    endDate: Date
  ): CampaignROI {
    // Aggregate costs and performance
    let totalCost = 0;
    let totalRevenue = 0;
    let totalImpressions = 0;
    let totalReach = 0;
    let totalEngagement = 0;
    let totalClicks = 0;
    let totalConversions = 0;

    const pieceMetrics = contentPieces.map(piece => {
      const metrics = this.calculateROI(piece);
      totalCost += metrics.totalCost;
      totalRevenue += piece.performance.revenue;
      totalImpressions += piece.performance.impressions;
      totalReach += piece.performance.reach;
      totalEngagement += piece.performance.engagement;
      totalClicks += piece.performance.clicks;
      totalConversions += piece.performance.conversions;

      return { piece, metrics };
    });

    // Calculate aggregated metrics
    const aggregatedMetrics: ROIMetrics = {
      totalCost,
      totalRevenue,
      roi: totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0,
      roas: totalCost > 0 ? totalRevenue / totalCost : 0,
      cpa: totalConversions > 0 ? totalCost / totalConversions : 0,
      cpc: totalClicks > 0 ? totalCost / totalClicks : 0,
      cpe: totalEngagement > 0 ? totalCost / totalEngagement : 0,
      cpm: totalImpressions > 0 ? (totalCost / totalImpressions) * 1000 : 0,
      conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
      engagementRate: totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0,
      revenuePerImpression: totalImpressions > 0 ? totalRevenue / totalImpressions : 0,
      profitMargin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0
    };

    // Identify top performers and underperformers
    const sortedByROI = pieceMetrics.sort((a, b) => b.metrics.roi - a.metrics.roi);
    const topPerformers = sortedByROI.slice(0, 5).map(pm => pm.piece);
    const underperformers = sortedByROI.slice(-5).map(pm => pm.piece);

    return {
      campaignName,
      startDate,
      endDate,
      contentPieces,
      aggregatedMetrics,
      topPerformers,
      underperformers
    };
  }

  /**
   * Predict future ROI based on historical data
   */
  predictROI(
    historicalPieces: ContentPiece[],
    plannedCost: ContentCost
  ): {
    estimatedRevenue: number;
    estimatedROI: number;
    confidenceInterval: { low: number; high: number };
  } {
    if (historicalPieces.length === 0) {
      return {
        estimatedRevenue: 0,
        estimatedROI: 0,
        confidenceInterval: { low: 0, high: 0 }
      };
    }

    const totalPlannedCost = this.calculateTotalCost(plannedCost);

    // Calculate average revenue per dollar spent
    const revenueRatios = historicalPieces.map(piece => {
      const cost = this.calculateTotalCost(piece.cost);
      return cost > 0 ? piece.performance.revenue / cost : 0;
    });

    const avgRevenueRatio = revenueRatios.reduce((a, b) => a + b, 0) / revenueRatios.length;
    const stdDevRatio = Math.sqrt(
      revenueRatios.reduce((sum, ratio) =>
        sum + Math.pow(ratio - avgRevenueRatio, 2), 0) / revenueRatios.length
    );

    const estimatedRevenue = totalPlannedCost * avgRevenueRatio;
    const estimatedROI = ((estimatedRevenue - totalPlannedCost) / totalPlannedCost) * 100;

    // 95% confidence interval (±1.96 std dev)
    const marginOfError = 1.96 * stdDevRatio * totalPlannedCost;

    return {
      estimatedRevenue,
      estimatedROI,
      confidenceInterval: {
        low: estimatedRevenue - marginOfError,
        high: estimatedRevenue + marginOfError
      }
    };
  }

  /**
   * Compare ROI across different platforms
   */
  comparePlatformROI(contentPieces: ContentPiece[]): Array<{
    platform: string;
    avgROI: number;
    totalRevenue: number;
    totalCost: number;
    contentCount: number;
  }> {
    const platformGroups = new Map<string, ContentPiece[]>();

    contentPieces.forEach(piece => {
      const pieces = platformGroups.get(piece.platform) || [];
      pieces.push(piece);
      platformGroups.set(piece.platform, pieces);
    });

    return Array.from(platformGroups.entries()).map(([platform, pieces]) => {
      const metrics = pieces.map(p => this.calculateROI(p));
      const totalRevenue = metrics.reduce((sum, m) => sum + m.totalRevenue, 0);
      const totalCost = metrics.reduce((sum, m) => sum + m.totalCost, 0);
      const avgROI = metrics.reduce((sum, m) => sum + m.roi, 0) / metrics.length;

      return {
        platform,
        avgROI,
        totalRevenue,
        totalCost,
        contentCount: pieces.length
      };
    }).sort((a, b) => b.avgROI - a.avgROI);
  }

  /**
   * Calculate break-even point
   */
  calculateBreakeven(
    fixedCosts: number,
    variableCostPerPiece: number,
    avgRevenuePerPiece: number
  ): {
    piecesNeeded: number;
    revenueNeeded: number;
    timeToBreakeven: number; // days, assuming 1 piece per day
  } {
    const contributionMargin = avgRevenuePerPiece - variableCostPerPiece;

    if (contributionMargin <= 0) {
      return {
        piecesNeeded: Infinity,
        revenueNeeded: Infinity,
        timeToBreakeven: Infinity
      };
    }

    const piecesNeeded = Math.ceil(fixedCosts / contributionMargin);
    const revenueNeeded = piecesNeeded * avgRevenuePerPiece;

    return {
      piecesNeeded,
      revenueNeeded,
      timeToBreakeven: piecesNeeded
    };
  }

  /**
   * Generate ROI report
   */
  generateReport(contentPieces: ContentPiece[]): {
    summary: ROIMetrics;
    byPlatform: Array<{ platform: string; avgROI: number }>;
    topPerformers: ContentPiece[];
    recommendations: string[];
  } {
    // Calculate overall summary
    let totalCost = 0;
    let totalRevenue = 0;
    let totalImpressions = 0;
    let totalReach = 0;
    let totalEngagement = 0;
    let totalClicks = 0;
    let totalConversions = 0;

    contentPieces.forEach(piece => {
      const cost = this.calculateTotalCost(piece.cost);
      totalCost += cost;
      totalRevenue += piece.performance.revenue;
      totalImpressions += piece.performance.impressions;
      totalReach += piece.performance.reach;
      totalEngagement += piece.performance.engagement;
      totalClicks += piece.performance.clicks;
      totalConversions += piece.performance.conversions;
    });

    const summary: ROIMetrics = {
      totalCost,
      totalRevenue,
      roi: totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0,
      roas: totalCost > 0 ? totalRevenue / totalCost : 0,
      cpa: totalConversions > 0 ? totalCost / totalConversions : 0,
      cpc: totalClicks > 0 ? totalCost / totalClicks : 0,
      cpe: totalEngagement > 0 ? totalCost / totalEngagement : 0,
      cpm: totalImpressions > 0 ? (totalCost / totalImpressions) * 1000 : 0,
      conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
      engagementRate: totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0,
      revenuePerImpression: totalImpressions > 0 ? totalRevenue / totalImpressions : 0,
      profitMargin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0
    };

    // Platform comparison
    const byPlatform = this.comparePlatformROI(contentPieces);

    // Top performers
    const piecesWithMetrics = contentPieces.map(piece => ({
      piece,
      metrics: this.calculateROI(piece)
    }));

    const topPerformers = piecesWithMetrics
      .sort((a, b) => b.metrics.roi - a.metrics.roi)
      .slice(0, 5)
      .map(pm => pm.piece);

    // Generate recommendations
    const recommendations: string[] = [];

    if (summary.roi < 50) {
      recommendations.push('ROI is below 50%. Consider reducing costs or improving targeting.');
    }

    if (summary.conversionRate < 2) {
      recommendations.push('Conversion rate is low. Optimize your call-to-action and landing pages.');
    }

    const bestPlatform = byPlatform[0];
    if (bestPlatform) {
      recommendations.push(`Focus more on ${bestPlatform.platform} - highest ROI at ${bestPlatform.avgROI.toFixed(1)}%.`);
    }

    if (summary.cpa > 50) {
      recommendations.push('Cost per acquisition is high. Consider organic growth strategies.');
    }

    return {
      summary,
      byPlatform: byPlatform.map(({ platform, avgROI }) => ({ platform, avgROI })),
      topPerformers,
      recommendations
    };
  }
}

export type { ContentCost, ContentPerformance, ROIMetrics, ContentPiece, CampaignROI };
