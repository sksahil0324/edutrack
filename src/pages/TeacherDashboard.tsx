import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { motion } from "framer-motion";
import { AlertTriangle, Award, BookOpen, Calendar, Flame, Loader2, LogOut, Search, TrendingDown, TrendingUp, Trophy, Users, X, Edit, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { AlgorithmComparison } from "@/components/AlgorithmComparison";

export default function TeacherDashboard() {
  const { isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [teacherIdFromSession, setTeacherIdFromSession] = useState<Id<"teachers"> | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<Id<"students"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    currentCGPA: 0,
    assignmentCompletionRate: 0,
    testScoreAverage: 0,
    attendanceRate: 0,
    totalAbsences: 0,
    tardinessCount: 0,
    loginFrequency: 0,
    classParticipationScore: 0,
  });
  const [algorithmComparison, setAlgorithmComparison] = useState<any>(null);
  const [isLoadingComparison, setIsLoadingComparison] = useState(false);
  
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
  
  const selectedStudentRisk = useQuery(
    api.riskAssessments.getLatestForStudent,
    selectedStudentId ? { studentId: selectedStudentId } : "skip"
  );
  
  const selectedStudent = students?.find(s => s._id === selectedStudentId);

  const updateStudentMetrics = useMutation(api.students.updateMetrics);
  const calculateRisk = useMutation(api.riskAssessments.calculateRisk);
  const calculateAllAlgorithms = useMutation(api.riskAssessments.calculateAllAlgorithms);

  // Initialize edit form when student is selected
  useEffect(() => {
    if (selectedStudent && isEditMode) {
      setEditFormData({
        currentCGPA: selectedStudent.currentCGPA,
        assignmentCompletionRate: selectedStudent.assignmentCompletionRate,
        testScoreAverage: selectedStudent.testScoreAverage,
        attendanceRate: selectedStudent.attendanceRate,
        totalAbsences: selectedStudent.totalAbsences,
        tardinessCount: selectedStudent.tardinessCount,
        loginFrequency: selectedStudent.loginFrequency,
        classParticipationScore: selectedStudent.classParticipationScore,
      });
    }
  }, [selectedStudent, isEditMode]);

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

  const handleEditStudent = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedStudentId) return;
    
    try {
      // Update student metrics
      await updateStudentMetrics({
        studentId: selectedStudentId,
        ...editFormData,
      });
      
      // Recalculate risk score based on new metrics
      await calculateRisk({
        studentId: selectedStudentId,
      });
      
      toast.success("Student details and risk score updated successfully");
      setIsEditMode(false);
    } catch (error) {
      toast.error("Failed to update student details");
      console.error("Update error:", error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  const handleViewAlgorithmComparison = async () => {
    if (!selectedStudentId) return;
    
    setIsLoadingComparison(true);
    try {
      const result = await calculateAllAlgorithms({ studentId: selectedStudentId });
      setAlgorithmComparison(result);
      toast.success("Algorithm comparison generated");
    } catch (error) {
      toast.error("Failed to generate comparison");
      console.error("Comparison error:", error);
    } finally {
      setIsLoadingComparison(false);
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
                <Input
                  placeholder="Search by name or student ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
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
                          {student.studentId} • Year {student.grade}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">CGPA: {student.currentCGPA.toFixed(2)}</div>
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
      <Dialog open={!!selectedStudentId} onOpenChange={(open) => {
        if (!open) {
          setSelectedStudentId(null);
          setIsEditMode(false);
          setAlgorithmComparison(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedStudent && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-2xl">{selectedStudent.fullName}</DialogTitle>
                    <DialogDescription>
                      {selectedStudent.studentId} • Year {selectedStudent.grade} {selectedStudent.section && `• Section ${selectedStudent.section}`}
                    </DialogDescription>
                  </div>
                  <div className="flex gap-2">
                    {!isEditMode ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleViewAlgorithmComparison}
                          disabled={isLoadingComparison}
                        >
                          {isLoadingComparison ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <BarChart3 className="mr-2 h-4 w-4" />
                          )}
                          Compare Algorithms
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleEditStudent}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Details
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSaveEdit}>
                          Save Changes
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Algorithm Comparison Section */}
                {algorithmComparison && (
                  <AlgorithmComparison data={algorithmComparison} />
                )}

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
                  {isEditMode ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cgpa">Current CGPA (0-10)</Label>
                        <Input
                          id="cgpa"
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          value={editFormData.currentCGPA}
                          onChange={(e) => handleInputChange("currentCGPA", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="testScore">Test Score Average (%)</Label>
                        <Input
                          id="testScore"
                          type="number"
                          min="0"
                          max="100"
                          value={editFormData.testScoreAverage}
                          onChange={(e) => handleInputChange("testScoreAverage", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="assignment">Assignment Completion (%)</Label>
                        <Input
                          id="assignment"
                          type="number"
                          min="0"
                          max="100"
                          value={editFormData.assignmentCompletionRate}
                          onChange={(e) => handleInputChange("assignmentCompletionRate", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="participation">Class Participation (%)</Label>
                        <Input
                          id="participation"
                          type="number"
                          min="0"
                          max="100"
                          value={editFormData.classParticipationScore}
                          onChange={(e) => handleInputChange("classParticipationScore", e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 border rounded-lg">
                        <div className="text-sm text-muted-foreground">Current CGPA</div>
                        <div className="text-2xl font-bold">{selectedStudent.currentCGPA.toFixed(2)}</div>
                        <Progress value={(selectedStudent.currentCGPA / 10.0) * 100} className="mt-2 h-1" />
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
                  )}
                </div>

                {/* Attendance & Engagement */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Attendance & Engagement
                  </h3>
                  {isEditMode ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="attendance">Attendance Rate (%)</Label>
                        <Input
                          id="attendance"
                          type="number"
                          min="0"
                          max="100"
                          value={editFormData.attendanceRate}
                          onChange={(e) => handleInputChange("attendanceRate", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="absences">Total Absences</Label>
                        <Input
                          id="absences"
                          type="number"
                          min="0"
                          value={editFormData.totalAbsences}
                          onChange={(e) => handleInputChange("totalAbsences", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="tardiness">Tardiness Count</Label>
                        <Input
                          id="tardiness"
                          type="number"
                          min="0"
                          value={editFormData.tardinessCount}
                          onChange={(e) => handleInputChange("tardinessCount", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="loginFreq">Login Frequency (per week)</Label>
                        <Input
                          id="loginFreq"
                          type="number"
                          min="0"
                          value={editFormData.loginFrequency}
                          onChange={(e) => handleInputChange("loginFrequency", e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
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
                  )}
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