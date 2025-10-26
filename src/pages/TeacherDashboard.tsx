import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { AlertTriangle, Award, BookOpen, Calendar, Flame, Loader2, LogOut, Search, TrendingDown, TrendingUp, Trophy, Users, X } from "lucide-react";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";

export default function TeacherDashboard() {
  const { isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [teacherIdFromSession, setTeacherIdFromSession] = useState<Id<"teachers"> | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<Id<"students"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Check sessionStorage for ID-based login
  useEffect(() => {
    const sessionData = sessionStorage.getItem("edutrack_user");
    if (sessionData) {
      try {
        const userData = JSON.parse(sessionData);
        if (userData.role === "teacher" && userData.profileId) {
          setTeacherIdFromSession(userData.profileId);
        }
      } catch (error) {
        console.error("Error parsing session data:", error);
      }
    }
  }, []);
  
  const teacherFromAuth = useQuery(api.teachers.getCurrentTeacher);
  const teacherFromId = useQuery(api.teachers.getById, teacherIdFromSession ? { teacherId: teacherIdFromSession } : "skip");
  
  const teacher = teacherFromId || teacherFromAuth;
  
  const students = useQuery(api.students.getAll);
  
  // Fetch selected student's risk assessment
  const selectedStudentRisk = useQuery(
    api.riskAssessments.getLatestForStudent,
    selectedStudentId ? { studentId: selectedStudentId } : "skip"
  );
  
  const selectedStudent = students?.find(s => s._id === selectedStudentId);

  // Filter students based on search query
  const filteredStudents = students?.filter((student) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      student.fullName.toLowerCase().includes(query) ||
      student.studentId.toLowerCase().includes(query)
    );
  });

  if (authLoading || teacher === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!teacher) {
    navigate("/teacher/setup");
    return null;
  }

  const handleSignOut = async () => {
    try {
      sessionStorage.removeItem("edutrack_user");
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
        {/* Header with Sign Out Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
            <p className="text-muted-foreground">Monitor students and manage interventions</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </motion.div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Total Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{students?.length || 0}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Interventions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teacher.interventionsCompleted}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {teacher.successfulInterventions} successful
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Teacher Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Level {teacher.level}</div>
                <p className="text-xs text-muted-foreground mt-1">{teacher.xp} XP</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Students List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Student Monitoring</CardTitle>
              <CardDescription>Overview of all students and their risk levels</CardDescription>
              
              {/* Search Bar */}
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or student ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {filteredStudents && filteredStudents.length > 0 ? (
                <div className="space-y-3">
                  {filteredStudents.map((student) => (
                    <div key={student._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-medium">{student.fullName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {student.studentId} • {student.grade}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">GPA: {student.currentGPA.toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">
                            Attendance: {student.attendanceRate.toFixed(0)}%
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedStudentId(student._id)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No students found matching "{searchQuery}"</p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No students found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Student Detail Dialog */}
      <Dialog open={!!selectedStudentId} onOpenChange={(open) => !open && setSelectedStudentId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedStudent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedStudent.fullName}</DialogTitle>
                <DialogDescription>
                  {selectedStudent.studentId} • Grade {selectedStudent.grade} {selectedStudent.section && `• Section ${selectedStudent.section}`}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Risk Assessment Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Risk Assessment
                    </h3>
                    <Badge className={`${getRiskColor(selectedStudentRisk?.riskLevel)} text-white`}>
                      {getRiskText(selectedStudentRisk?.riskLevel)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Risk Score</span>
                      <span className="font-medium">{selectedStudentRisk?.riskScore?.toFixed(1) || "0"}%</span>
                    </div>
                    <Progress value={selectedStudentRisk?.riskScore || 0} className="h-2" />
                  </div>

                  {selectedStudentRisk?.trendDirection && (
                    <div className="flex items-center gap-2 text-sm">
                      {selectedStudentRisk.trendDirection === "improving" ? (
                        <>
                          <TrendingDown className="w-4 h-4 text-green-500" />
                          <span className="text-green-600 dark:text-green-400">Improving</span>
                        </>
                      ) : selectedStudentRisk.trendDirection === "declining" ? (
                        <>
                          <TrendingUp className="w-4 h-4 text-red-500" />
                          <span className="text-red-600 dark:text-red-400">Declining</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Stable</span>
                      )}
                    </div>
                  )}

                  {selectedStudentRisk?.recommendations && selectedStudentRisk.recommendations.length > 0 && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Recommendations:</h4>
                      <ul className="space-y-1">
                        {selectedStudentRisk.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Academic Performance */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Academic Performance
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Current GPA</div>
                      <div className="text-2xl font-bold">{selectedStudent.currentGPA.toFixed(2)}</div>
                      <Progress value={(selectedStudent.currentGPA / 4.0) * 100} className="mt-2 h-1" />
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Test Score Average</div>
                      <div className="text-2xl font-bold">{selectedStudent.testScoreAverage}%</div>
                      <Progress value={selectedStudent.testScoreAverage} className="mt-2 h-1" />
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Assignment Completion</div>
                      <div className="text-2xl font-bold">{selectedStudent.assignmentCompletionRate}%</div>
                      <Progress value={selectedStudent.assignmentCompletionRate} className="mt-2 h-1" />
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Class Participation</div>
                      <div className="text-2xl font-bold">{selectedStudent.classParticipationScore}%</div>
                      <Progress value={selectedStudent.classParticipationScore} className="mt-2 h-1" />
                    </div>
                  </div>
                </div>

                {/* Attendance & Engagement */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Attendance & Engagement
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Attendance Rate</div>
                      <div className="text-2xl font-bold">{selectedStudent.attendanceRate.toFixed(0)}%</div>
                      <Progress value={selectedStudent.attendanceRate} className="mt-2 h-1" />
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Total Absences</div>
                      <div className="text-2xl font-bold">{selectedStudent.totalAbsences}</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Tardiness Count</div>
                      <div className="text-2xl font-bold">{selectedStudent.tardinessCount}</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Login Frequency</div>
                      <div className="text-2xl font-bold">{selectedStudent.loginFrequency}/week</div>
                    </div>
                  </div>
                </div>

                {/* Gamification Stats */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Gamification Progress
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Level</div>
                      <div className="text-2xl font-bold">Level {selectedStudent.level}</div>
                      <div className="text-xs text-muted-foreground mt-1">{selectedStudent.xp} XP</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Flame className="w-4 h-4" />
                        Current Streak
                      </div>
                      <div className="text-2xl font-bold">{selectedStudent.currentStreak} days</div>
                      <div className="text-xs text-muted-foreground mt-1">Longest: {selectedStudent.longestStreak} days</div>
                    </div>
                    <div className="p-3 border rounded-lg col-span-2">
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        Badges Earned
                      </div>
                      <div className="text-2xl font-bold mb-2">{selectedStudent.badges.length}</div>
                      {selectedStudent.badges.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedStudent.badges.map((badge, idx) => (
                            <Badge key={idx} variant="secondary">{badge}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Financial Status */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Financial Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Fee Payment Status</div>
                      <Badge 
                        variant={selectedStudent.feePaymentStatus === "current" ? "default" : "destructive"}
                        className="mt-2"
                      >
                        {selectedStudent.feePaymentStatus}
                      </Badge>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Scholarship</div>
                      <div className="text-lg font-medium mt-1">
                        {selectedStudent.hasScholarship ? "Yes" : "No"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}