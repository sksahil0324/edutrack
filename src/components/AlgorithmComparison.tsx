import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, TrendingUp, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface AlgorithmResult {
  riskScore: number;
  riskLevel: "low" | "moderate" | "high";
  algorithm: string;
  compoundMultiplier?: number;
}

interface ComparisonData {
  original: AlgorithmResult;
  ml: AlgorithmResult;
  holistic: AlgorithmResult;
  comparison: {
    averageScore: number;
    variance: number;
    agreement: string;
    recommendation: string;
  };
}

interface AlgorithmComparisonProps {
  data: ComparisonData;
}

export function AlgorithmComparison({ data }: AlgorithmComparisonProps) {
  const getRiskColor = (level: string) => {
    if (level === "low") return "bg-green-500 text-white";
    if (level === "moderate") return "bg-yellow-500 text-white";
    return "bg-red-500 text-white";
  };

  const getRiskBorderColor = (level: string) => {
    if (level === "low") return "border-green-500";
    if (level === "moderate") return "border-yellow-500";
    return "border-red-500";
  };

  const getAgreementColor = (agreement: string) => {
    if (agreement === "high") return "text-green-600 dark:text-green-400";
    if (agreement === "moderate") return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getAgreementIcon = (agreement: string) => {
    if (agreement === "high") return <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />;
    if (agreement === "moderate") return <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
    return <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
  };

  const algorithms = [
    {
      data: data.original,
      description: "Weighted multi-factor approach with fixed weights",
      features: ["Transparent & Explainable", "Predictable Behavior", "Good Baseline"],
      highlighted: false,
    },
    {
      data: data.ml,
      description: "Non-linear scoring with dynamic weights",
      features: ["Early Intervention Focus", "Adaptive Weighting", "Critical Threshold Detection"],
      highlighted: true,
    },
    {
      data: data.holistic,
      description: "Equal weighting with compound risk detection",
      features: ["Comprehensive View", "Interaction Effects", "Positive Indicators"],
      highlighted: false,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Card className="border-2 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardTitle className="flex items-center gap-2 text-xl">
            <BarChart3 className="w-6 h-6 text-primary" />
            Multi-Algorithm Risk Assessment
          </CardTitle>
          <CardDescription className="text-base">
            Comprehensive analysis using three distinct AI algorithms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Individual Algorithm Results */}
          <div className="grid md:grid-cols-3 gap-4 lg:gap-6">
            {algorithms.map((algo, index) => (
              <motion.div
                key={algo.data.algorithm}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-4 border-2 rounded-lg space-y-3 transition-all hover:shadow-md overflow-hidden ${ 
                  algo.highlighted ? "border-primary bg-primary/5" : getRiskBorderColor(algo.data.riskLevel)
                }`}
              >
                <div className="space-y-2 w-full">
                  <div className="flex items-start justify-between gap-2 w-full">
                    <div className="flex items-center gap-1 flex-1">
                      <h4 className="font-semibold text-xs leading-tight">
                        {algo.data.algorithm}
                      </h4>
                      {algo.highlighted && <TrendingUp className="w-3 h-3 text-primary flex-shrink-0" />}
                    </div>
                    <Badge className={`${getRiskColor(algo.data.riskLevel)} text-xs px-1.5 py-0.5 flex-shrink-0 whitespace-nowrap`}>
                      {algo.data.riskLevel.toUpperCase()}
                    </Badge>
                  </div>

                  {algo.highlighted && (
                    <Badge variant="outline" className="text-xs border-primary text-primary inline-block px-1.5 py-0.5">
                      Recommended
                    </Badge>
                  )}
                </div>

                <div>
                  <div className="text-3xl font-bold text-center mb-2">
                    {algo.data.riskScore.toFixed(1)}%
                  </div>
                  <Progress value={algo.data.riskScore} className="h-3" />
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {algo.description}
                </p>

                <div className="space-y-1 pt-2 border-t">
                  {algo.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <span className="text-primary mt-0.5 flex-shrink-0">✓</span>
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {algo.data.compoundMultiplier && algo.data.compoundMultiplier > 1 && (
                  <div className="pt-2 border-t">
                    <div className="text-xs text-muted-foreground">Compound Risk Multiplier</div>
                    <div className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                      {algo.data.compoundMultiplier.toFixed(2)}x
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Consensus Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 bg-gradient-to-br from-muted/50 to-muted rounded-lg space-y-4 border-2"
          >
            <div className="flex items-center gap-2 mb-4">
              {getAgreementIcon(data.comparison.agreement)}
              <h4 className="font-semibold text-lg">Consensus Analysis</h4>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Average Score</div>
                <div className="text-3xl font-bold">{data.comparison.averageScore.toFixed(1)}%</div>
                <Progress value={data.comparison.averageScore} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Algorithm Agreement</div>
                <div className={`text-3xl font-bold ${getAgreementColor(data.comparison.agreement)}`}>
                  {data.comparison.agreement.toUpperCase()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.comparison.agreement === "high" && "All algorithms strongly agree"}
                  {data.comparison.agreement === "moderate" && "Algorithms show some variation"}
                  {data.comparison.agreement === "low" && "Significant disagreement detected"}
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Score Variance</div>
                <div className="text-3xl font-bold">{data.comparison.variance.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">
                  {data.comparison.variance < 100 && "Low variance - consistent results"}
                  {data.comparison.variance >= 100 && data.comparison.variance < 400 && "Moderate variance"}
                  {data.comparison.variance >= 400 && "High variance - review needed"}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Recommendation:</p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {data.comparison.recommendation}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Algorithm Score Comparison Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-4 border rounded-lg space-y-3"
          >
            <h4 className="font-semibold text-sm">Score Distribution</h4>
            <div className="space-y-3">
              {algorithms.map((algo) => (
                <div key={algo.data.algorithm} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">{algo.data.algorithm}</span>
                    <span className="text-muted-foreground">{algo.data.riskScore.toFixed(1)}%</span>
                  </div>
                  <div className="relative">
                    <Progress value={algo.data.riskScore} className="h-2" />
                    <div
                      className="absolute top-0 h-2 w-0.5 bg-foreground/30"
                      style={{ left: `${data.comparison.averageScore}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                <div className="w-0.5 h-3 bg-foreground/30" />
                <span>Average line at {data.comparison.averageScore.toFixed(1)}%</span>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}