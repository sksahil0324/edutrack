import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, TrendingUp, AlertCircle } from "lucide-react";

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

  const getAgreementColor = (agreement: string) => {
    if (agreement === "high") return "text-green-600";
    if (agreement === "moderate") return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Algorithm Comparison Analysis
        </CardTitle>
        <CardDescription>
          Three different AI algorithms analyzing dropout risk
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Individual Algorithm Results */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Original Algorithm */}
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">{data.original.algorithm}</h4>
              <Badge className={getRiskColor(data.original.riskLevel)}>
                {data.original.riskLevel.toUpperCase()}
              </Badge>
            </div>
            <div>
              <div className="text-2xl font-bold">{data.original.riskScore.toFixed(1)}%</div>
              <Progress value={data.original.riskScore} className="h-2 mt-2" />
            </div>
            <p className="text-xs text-muted-foreground">
              Weighted multi-factor approach with fixed weights
            </p>
          </div>

          {/* ML-Inspired Algorithm */}
          <div className="p-4 border rounded-lg space-y-3 border-primary">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm flex items-center gap-1">
                {data.ml.algorithm}
                <TrendingUp className="w-3 h-3" />
              </h4>
              <Badge className={getRiskColor(data.ml.riskLevel)}>
                {data.ml.riskLevel.toUpperCase()}
              </Badge>
            </div>
            <div>
              <div className="text-2xl font-bold">{data.ml.riskScore.toFixed(1)}%</div>
              <Progress value={data.ml.riskScore} className="h-2 mt-2" />
            </div>
            <p className="text-xs text-muted-foreground">
              Non-linear scoring with dynamic weights (Recommended)
            </p>
          </div>

          {/* Holistic Algorithm */}
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">{data.holistic.algorithm}</h4>
              <Badge className={getRiskColor(data.holistic.riskLevel)}>
                {data.holistic.riskLevel.toUpperCase()}
              </Badge>
            </div>
            <div>
              <div className="text-2xl font-bold">{data.holistic.riskScore.toFixed(1)}%</div>
              <Progress value={data.holistic.riskScore} className="h-2 mt-2" />
            </div>
            <p className="text-xs text-muted-foreground">
              Equal weighting with compound risk detection
            </p>
          </div>
        </div>

        {/* Consensus Analysis */}
        <div className="p-4 bg-muted rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <h4 className="font-semibold">Consensus Analysis</h4>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Average Score</div>
              <div className="text-xl font-bold">{data.comparison.averageScore.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Algorithm Agreement</div>
              <div className={`text-xl font-bold ${getAgreementColor(data.comparison.agreement)}`}>
                {data.comparison.agreement.toUpperCase()}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Variance</div>
              <div className="text-xl font-bold">{data.comparison.variance.toFixed(1)}</div>
            </div>
          </div>
          <div className="pt-2 border-t">
            <p className="text-sm font-medium">Recommendation:</p>
            <p className="text-sm text-muted-foreground mt-1">{data.comparison.recommendation}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
