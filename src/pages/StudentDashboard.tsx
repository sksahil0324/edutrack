import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { AlertTriangle, Award, BookOpen, Calendar, Flame, Loader2, LogOut, TrendingDown, TrendingUp, Trophy, Zap } from "lucide-react";
import { useNavigate } from "react-router";

export default function StudentDashboard() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  
  const student = useQuery(api.students.getCurrentStudent);
  const riskAssessment = useQuery(api.riskAssessments.getLatestForStudent, student ? { studentId: student._id } : "skip");
  const studentChallenges = useQuery(api.challenges.getStudentChallenges, student ? { studentId: student._id } : "skip");

  if (authLoading || student === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!student) {
    navigate("/student/setup");
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const getRiskColor = (level?: string) => {
    if (!level) return "bg-muted";
    if (level === "low") return "bg-green-500";
    if (level === "moderate") return "bg-yellow-500";
    return "bg-red-500";
  };

  const getRiskText = (level?: string) => {
    if (!level) return "Calculating...";
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back, {student.fullName}!</h1>
            <p className="text-muted-foreground">Track your progress and complete challenges</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Level {student.level}</div>
              <div className="text-2xl font-bold">{student.xp} XP</div>
            </div>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </motion.div>

        {/* Risk Assessment Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Dropout Risk Assessment
                  </CardTitle>
                  <CardDescription>AI-powered analysis of your academic health</CardDescription>
                </div>
                <Badge className={`${getRiskColor(riskAssessment?.riskLevel)} text-white`}>
                  {getRiskText(riskAssessment?.riskLevel)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Risk Score</span>
                    <span className="text-sm text-muted-foreground">
                      {riskAssessment?.riskScore?.toFixed(1) || "0"}%
                    </span>
                  </div>
                  <Progress value={riskAssessment?.riskScore || 0} className="h-2" />
                </div>
                {riskAssessment?.trendDirection && (
                  <div className="flex items-center gap-1">
                    {riskAssessment.trendDirection === "improving" ? (
                      <TrendingDown className="w-5 h-5 text-green-500" />
                    ) : riskAssessment.trendDirection === "declining" ? (
                      <TrendingUp className="w-5 h-5 text-red-500" />
                    ) : null}
                  </div>
                )}
              </div>

              {riskAssessment?.recommendations && riskAssessment.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Recommendations:</h4>
                  <ul className="space-y-1">
                    {riskAssessment.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  GPA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{student.currentGPA.toFixed(2)}</div>
                <Progress value={(student.currentGPA / 4.0) * 100} className="mt-2 h-1" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{student.attendanceRate.toFixed(0)}%</div>
                <Progress value={student.attendanceRate} className="mt-2 h-1" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Flame className="w-4 h-4" />
                  Current Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{student.currentStreak} days</div>
                <p className="text-xs text-muted-foreground mt-1">Longest: {student.longestStreak} days</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Badges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{student.badges.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Achievements earned</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Challenges Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Active Challenges
              </CardTitle>
              <CardDescription>Complete challenges to earn XP and badges</CardDescription>
            </CardHeader>
            <CardContent>
              {studentChallenges && studentChallenges.length > 0 ? (
                <div className="space-y-4">
                  {studentChallenges.map((sc) => (
                    <div key={sc._id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{sc.challenge?.title || "Challenge"}</h4>
                          <p className="text-sm text-muted-foreground">{sc.challenge?.description}</p>
                        </div>
                        <Badge variant={sc.status === "completed" ? "default" : "outline"}>
                          {sc.status}
                        </Badge>
                      </div>
                      <Progress value={sc.progress} className="h-2 mb-2" />
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">{sc.progress}% complete</span>
                        <span className="font-medium text-primary">{sc.challenge?.xpReward} XP</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No active challenges yet</p>
                  <Button variant="outline" className="mt-4">Browse Challenges</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}