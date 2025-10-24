import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Download, Loader2, LogOut, Search, Users, X, ChevronDown, ChevronUp, AlertTriangle, TrendingUp, Award, Flame, CheckCircle, Clock, AlertCircle, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [expandedTeacher, setExpandedTeacher] = useState<string | null>(null);

  const students = useQuery(api.admin.getAllStudents);
  const teachers = useQuery(api.admin.getAllTeachers);
  const stats = useQuery(api.admin.getStatistics);

  useEffect(() => {
    const adminSession = localStorage.getItem("adminSession");
    if (!adminSession) {
      navigate("/admin-login");
      return;
    }
    setIsAuthorized(true);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("adminSession");
    toast.success("Logged out successfully");
    navigate("/admin-login");
  };

  const handleDownloadCode = async () => {
    setIsDownloading(true);
    const toastId = toast.loading("Generating code archive...");
    
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      // Comprehensive list of all project files - automatically includes latest changes
      const filesToInclude = [
        // Root config files
        "package.json",
        "README.md",
        "index.html",
        "vite.config.ts",
        "tsconfig.json",
        "tailwind.config.ts",
        "components.json",
        
        // Main source files
        "src/main.tsx",
        "src/index.css",
        "src/vite-env.d.ts",
        "src/instrumentation.tsx",
        "src/types/global.d.ts",
        
        // Utilities and hooks
        "src/lib/utils.ts",
        "src/hooks/use-auth.ts",
        "src/hooks/use-mobile.ts",
        
        // All page components
        "src/pages/Landing.tsx",
        "src/pages/Auth.tsx",
        "src/pages/RoleSelection.tsx",
        "src/pages/StudentSetup.tsx",
        "src/pages/StudentDashboard.tsx",
        "src/pages/TeacherSetup.tsx",
        "src/pages/TeacherDashboard.tsx",
        "src/pages/AdminLogin.tsx",
        "src/pages/AdminDashboard.tsx",
        "src/pages/NotFound.tsx",
        
        // All Convex backend files
        "src/convex/schema.ts",
        "src/convex/auth.ts",
        "src/convex/auth.config.ts",
        "src/convex/http.ts",
        "src/convex/auth/emailOtp.ts",
        "src/convex/users.ts",
        "src/convex/students.ts",
        "src/convex/teachers.ts",
        "src/convex/admin.ts",
        "src/convex/riskAssessments.ts",
        "src/convex/challenges.ts",
        "src/convex/interventions.ts",
        "src/convex/notifications.ts",
        "src/convex/seedData.ts",
        "src/convex/initData.ts",
        
        // UI Components (shadcn)
        "src/components/ui/accordion.tsx",
        "src/components/ui/alert-dialog.tsx",
        "src/components/ui/alert.tsx",
        "src/components/ui/aspect-ratio.tsx",
        "src/components/ui/avatar.tsx",
        "src/components/ui/badge.tsx",
        "src/components/ui/breadcrumb.tsx",
        "src/components/ui/button.tsx",
        "src/components/ui/calendar.tsx",
        "src/components/ui/card.tsx",
        "src/components/ui/carousel.tsx",
        "src/components/ui/chart.tsx",
        "src/components/ui/checkbox.tsx",
        "src/components/ui/collapsible.tsx",
        "src/components/ui/command.tsx",
        "src/components/ui/context-menu.tsx",
        "src/components/ui/dialog.tsx",
        "src/components/ui/drawer.tsx",
        "src/components/ui/dropdown-menu.tsx",
        "src/components/ui/form.tsx",
        "src/components/ui/hover-card.tsx",
        "src/components/ui/input-otp.tsx",
        "src/components/ui/input.tsx",
        "src/components/ui/label.tsx",
        "src/components/ui/menubar.tsx",
        "src/components/ui/navigation-menu.tsx",
        "src/components/ui/pagination.tsx",
        "src/components/ui/popover.tsx",
        "src/components/ui/progress.tsx",
        "src/components/ui/radio-group.tsx",
        "src/components/ui/resizable.tsx",
        "src/components/ui/scroll-area.tsx",
        "src/components/ui/select.tsx",
        "src/components/ui/separator.tsx",
        "src/components/ui/sheet.tsx",
        "src/components/ui/sidebar.tsx",
        "src/components/ui/skeleton.tsx",
        "src/components/ui/slider.tsx",
        "src/components/ui/sonner.tsx",
        "src/components/ui/switch.tsx",
        "src/components/ui/table.tsx",
        "src/components/ui/tabs.tsx",
        "src/components/ui/textarea.tsx",
        "src/components/ui/toggle-group.tsx",
        "src/components/ui/toggle.tsx",
        "src/components/ui/tooltip.tsx",
        
        // Custom components
        "src/components/LogoDropdown.tsx",
      ];

      let successCount = 0;
      let failCount = 0;

      // Fetch and add files to ZIP
      for (const filePath of filesToInclude) {
        try {
          const response = await fetch(`/${filePath}`);
          if (response.ok) {
            const content = await response.text();
            zip.file(filePath, content);
            successCount++;
          } else {
            failCount++;
            console.warn(`Could not fetch ${filePath} (${response.status})`);
          }
        } catch (error) {
          failCount++;
          console.warn(`Error fetching ${filePath}:`, error);
        }
      }

      // Generate and download ZIP
      const blob = await zip.generateAsync({ 
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 9 }
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "EduTrack_AI_Code.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Code downloaded! (${successCount} files included)`, { id: toastId });
      
      if (failCount > 0) {
        toast.info(`Note: ${failCount} files could not be included`, { duration: 3000 });
      }
    } catch (error) {
      toast.error("Failed to download code", { id: toastId });
      console.error("Download error:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const filteredStudents = students?.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredTeachers = teachers?.filter(
    (t) =>
      t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.teacherId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.department.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getRiskBadgeColor = (riskLevel?: string) => {
    if (!riskLevel) return "bg-gray-100 text-gray-800";
    if (riskLevel === "low") return "bg-green-100 text-green-800";
    if (riskLevel === "moderate") return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getStatusBadgeColor = (status: string) => {
    if (status === "completed") return "bg-green-100 text-green-800";
    if (status === "in-progress") return "bg-blue-100 text-blue-800";
    if (status === "planned") return "bg-gray-100 text-gray-800";
    return "bg-red-100 text-red-800";
  };

  const getPriorityBadgeColor = (priority: string) => {
    if (priority === "high") return "bg-red-100 text-red-800";
    if (priority === "medium") return "bg-yellow-100 text-yellow-800";
    return "bg-blue-100 text-blue-800";
  };

  const toggleStudentExpand = (studentId: string) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  const toggleTeacherExpand = (teacherId: string) => {
    setExpandedTeacher(expandedTeacher === teacherId ? null : teacherId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage users and system statistics</p>
          </div>
          <div className="flex gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleDownloadCode}
                disabled={isDownloading}
                className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                title="Download all project code (Admin only)"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download Code
              </Button>
            </motion.div>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-4 gap-4"
        >
          <motion.div whileHover={{ y: -4 }}>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                  {stats?.totalStudents || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -4 }}>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                  {stats?.totalTeachers || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -4 }}>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">At-Risk Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-500">
                  {stats?.atRiskStudents || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">High/Moderate risk</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -4 }}>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">
                  {stats?.activeUsers || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Currently active</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* User Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>View and manage all registered users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-9"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <Tabs defaultValue="students" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="students">
                    Students ({filteredStudents.length})
                  </TabsTrigger>
                  <TabsTrigger value="teachers">
                    Teachers ({filteredTeachers.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="students" className="space-y-4">
                  {filteredStudents.length > 0 ? (
                    <div className="space-y-2">
                      {filteredStudents.map((student) => (
                        <motion.div
                          key={student._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border rounded-lg overflow-hidden"
                        >
                          {/* Main Row */}
                          <div
                            className="p-4 hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                            onClick={() => toggleStudentExpand(student._id)}
                          >
                            <div className="grid grid-cols-6 gap-4 items-center">
                              <div className="col-span-2">
                                <div className="font-medium">{student.fullName}</div>
                                <div className="text-xs text-muted-foreground">{student.studentId}</div>
                              </div>
                              <div>
                                <div className="text-sm">Grade {student.grade}</div>
                                <div className="text-xs text-muted-foreground">Section {student.section || 'N/A'}</div>
                              </div>
                              <div>
                                <div className="text-sm font-semibold">GPA: {student.currentGPA.toFixed(2)}</div>
                                <div className="text-xs text-muted-foreground">Attendance: {student.attendanceRate.toFixed(0)}%</div>
                              </div>
                              <div>
                                <Badge className={getRiskBadgeColor(student.riskAssessment?.riskLevel)}>
                                  {student.riskAssessment?.riskLevel?.toUpperCase() || "N/A"}
                                </Badge>
                                {student.riskAssessment && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Risk: {student.riskAssessment.riskScore.toFixed(1)}%
                                  </div>
                                )}
                              </div>
                              <div className="flex justify-end">
                                {expandedStudent === student._id ? (
                                  <ChevronUp className="h-5 w-5" />
                                ) : (
                                  <ChevronDown className="h-5 w-5" />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Expanded Details */}
                          <AnimatePresence>
                            {expandedStudent === student._id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="border-t bg-gray-50 dark:bg-gray-800/50"
                              >
                                <div className="p-6 space-y-6">
                                  {/* Academic Metrics */}
                                  <div>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                      <BarChart3 className="h-4 w-4" />
                                      Academic Metrics
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                      <div>
                                        <div className="text-xs text-muted-foreground mb-1">CGPA</div>
                                        <div className="text-lg font-bold">{student.currentGPA.toFixed(2)}</div>
                                        <Progress value={(student.currentGPA / 4.0) * 100} className="h-1 mt-1" />
                                      </div>
                                      <div>
                                        <div className="text-xs text-muted-foreground mb-1">Attendance</div>
                                        <div className="text-lg font-bold">{student.attendanceRate.toFixed(0)}%</div>
                                        <Progress value={student.attendanceRate} className="h-1 mt-1" />
                                      </div>
                                      <div>
                                        <div className="text-xs text-muted-foreground mb-1">Test Scores</div>
                                        <div className="text-lg font-bold">{student.testScoreAverage.toFixed(0)}%</div>
                                        <Progress value={student.testScoreAverage} className="h-1 mt-1" />
                                      </div>
                                      <div>
                                        <div className="text-xs text-muted-foreground mb-1">Assignment Rate</div>
                                        <div className="text-lg font-bold">{student.assignmentCompletionRate.toFixed(0)}%</div>
                                        <Progress value={student.assignmentCompletionRate} className="h-1 mt-1" />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Engagement Metrics */}
                                  <div>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                      <TrendingUp className="h-4 w-4" />
                                      Engagement Metrics
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                      <div>
                                        <div className="text-xs text-muted-foreground mb-1">XP / Level</div>
                                        <div className="text-lg font-bold">{student.xp} XP</div>
                                        <Badge variant="secondary" className="mt-1">Level {student.level}</Badge>
                                      </div>
                                      <div>
                                        <div className="text-xs text-muted-foreground mb-1">Streak</div>
                                        <div className="text-lg font-bold flex items-center gap-1">
                                          <Flame className="h-4 w-4 text-orange-500" />
                                          {student.currentStreak} days
                                        </div>
                                        <div className="text-xs text-muted-foreground">Best: {student.longestStreak}</div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-muted-foreground mb-1">Badges</div>
                                        <div className="text-lg font-bold flex items-center gap-1">
                                          <Award className="h-4 w-4 text-yellow-500" />
                                          {student.badges.length}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-muted-foreground mb-1">Participation</div>
                                        <div className="text-lg font-bold">{student.classParticipationScore}%</div>
                                        <Progress value={student.classParticipationScore} className="h-1 mt-1" />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Dropout Risk Analysis */}
                                  {student.riskAssessment && (
                                    <div>
                                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        Dropout Risk Analysis
                                      </h4>
                                      <div className="space-y-3">
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                          <div>
                                            <div className="text-xs text-muted-foreground mb-1">Academic Risk</div>
                                            <Progress value={student.riskAssessment.academicRisk} className="h-2" />
                                            <div className="text-xs mt-1">{student.riskAssessment.academicRisk.toFixed(0)}%</div>
                                          </div>
                                          <div>
                                            <div className="text-xs text-muted-foreground mb-1">Attendance Risk</div>
                                            <Progress value={student.riskAssessment.attendanceRisk} className="h-2" />
                                            <div className="text-xs mt-1">{student.riskAssessment.attendanceRisk.toFixed(0)}%</div>
                                          </div>
                                          <div>
                                            <div className="text-xs text-muted-foreground mb-1">Engagement Risk</div>
                                            <Progress value={student.riskAssessment.engagementRisk} className="h-2" />
                                            <div className="text-xs mt-1">{student.riskAssessment.engagementRisk.toFixed(0)}%</div>
                                          </div>
                                          <div>
                                            <div className="text-xs text-muted-foreground mb-1">Financial Risk</div>
                                            <Progress value={student.riskAssessment.financialRisk} className="h-2" />
                                            <div className="text-xs mt-1">{student.riskAssessment.financialRisk.toFixed(0)}%</div>
                                          </div>
                                          <div>
                                            <div className="text-xs text-muted-foreground mb-1">Social Risk</div>
                                            <Progress value={student.riskAssessment.socialRisk} className="h-2" />
                                            <div className="text-xs mt-1">{student.riskAssessment.socialRisk.toFixed(0)}%</div>
                                          </div>
                                        </div>
                                        {student.riskAssessment.recommendations.length > 0 && (
                                          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                                            <div className="text-sm font-medium mb-2">Recommendations:</div>
                                            <ul className="space-y-1">
                                              {student.riskAssessment.recommendations.map((rec, idx) => (
                                                <li key={idx} className="text-xs flex items-start gap-2">
                                                  <span className="text-yellow-600 mt-0.5">•</span>
                                                  <span>{rec}</span>
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No students found matching your search</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="teachers" className="space-y-4">
                  {filteredTeachers.length > 0 ? (
                    <div className="space-y-2">
                      {filteredTeachers.map((teacher) => (
                        <motion.div
                          key={teacher._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border rounded-lg overflow-hidden"
                        >
                          {/* Main Row */}
                          <div
                            className="p-4 hover:bg-purple-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                            onClick={() => toggleTeacherExpand(teacher._id)}
                          >
                            <div className="grid grid-cols-6 gap-4 items-center">
                              <div className="col-span-2">
                                <div className="font-medium">{teacher.fullName}</div>
                                <div className="text-xs text-muted-foreground">{teacher.teacherId}</div>
                              </div>
                              <div>
                                <div className="text-sm">{teacher.department}</div>
                                <div className="text-xs text-muted-foreground">
                                  {teacher.subjects.slice(0, 2).join(", ")}
                                </div>
                              </div>
                              <div>
                                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                                  Level {teacher.level}
                                </Badge>
                                <div className="text-xs text-muted-foreground mt-1">{teacher.xp} XP</div>
                              </div>
                              <div>
                                <div className="text-sm font-semibold">{teacher.stats?.totalInterventions || 0} Tasks</div>
                                <div className="text-xs text-muted-foreground">{teacher.stats?.completedInterventions || 0} completed</div>
                              </div>
                              <div className="flex justify-end">
                                {expandedTeacher === teacher._id ? (
                                  <ChevronUp className="h-5 w-5" />
                                ) : (
                                  <ChevronDown className="h-5 w-5" />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Expanded Details */}
                          <AnimatePresence>
                            {expandedTeacher === teacher._id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="border-t bg-gray-50 dark:bg-gray-800/50"
                              >
                                <div className="p-6 space-y-6">
                                  {/* Teacher Stats */}
                                  <div>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                      <BarChart3 className="h-4 w-4" />
                                      Performance Metrics
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                      <div>
                                        <div className="text-xs text-muted-foreground mb-1">Total Interventions</div>
                                        <div className="text-lg font-bold">{teacher.stats?.totalInterventions || 0}</div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-muted-foreground mb-1">Completed</div>
                                        <div className="text-lg font-bold text-green-600">{teacher.stats?.completedInterventions || 0}</div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-muted-foreground mb-1">In Progress</div>
                                        <div className="text-lg font-bold text-blue-600">{teacher.stats?.inProgressInterventions || 0}</div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-muted-foreground mb-1">Planned</div>
                                        <div className="text-lg font-bold text-gray-600">{teacher.stats?.plannedInterventions || 0}</div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-muted-foreground mb-1">High Priority</div>
                                        <div className="text-lg font-bold text-red-600">{teacher.stats?.highPriorityInterventions || 0}</div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Subjects */}
                                  <div>
                                    <h4 className="font-semibold mb-3">Subjects</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {teacher.subjects.map((subject, idx) => (
                                        <Badge key={idx} variant="outline" className="text-sm">
                                          {subject}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Interventions List */}
                                  <div>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                      <Target className="h-4 w-4" />
                                      Interventions & Tasks ({teacher.interventions?.length || 0})
                                    </h4>
                                    {teacher.interventions && teacher.interventions.length > 0 ? (
                                      <motion.div 
                                        className="space-y-3 max-h-96 overflow-y-auto"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                      >
                                        {teacher.interventions.map((intervention, idx) => (
                                          <motion.div 
                                            key={intervention._id} 
                                            className="bg-white dark:bg-gray-800 p-4 rounded-lg border hover:shadow-lg transition-shadow"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.35 + idx * 0.05 }}
                                            whileHover={{ y: -2 }}
                                          >
                                            <div className="flex justify-between items-start mb-2">
                                              <div className="flex-1">
                                                <h5 className="font-medium">{intervention.title}</h5>
                                                <p className="text-sm text-muted-foreground mt-1">{intervention.description}</p>
                                              </div>
                                              <div className="flex gap-2">
                                                <Badge className={getStatusBadgeColor(intervention.status)}>
                                                  {intervention.status === "completed" && <CheckCircle className="h-3 w-3 mr-1" />}
                                                  {intervention.status === "in-progress" && <Clock className="h-3 w-3 mr-1" />}
                                                  {intervention.status === "planned" && <AlertCircle className="h-3 w-3 mr-1" />}
                                                  {intervention.status}
                                                </Badge>
                                                <Badge className={getPriorityBadgeColor(intervention.priority)}>
                                                  {intervention.priority}
                                                </Badge>
                                              </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                                              <div>
                                                <div className="text-xs text-muted-foreground">Student</div>
                                                <div className="font-medium">{intervention.student?.fullName || "N/A"}</div>
                                              </div>
                                              <div>
                                                <div className="text-xs text-muted-foreground">Type</div>
                                                <div className="font-medium capitalize">{intervention.type}</div>
                                              </div>
                                              <div>
                                                <div className="text-xs text-muted-foreground">Initial Risk</div>
                                                <div className="font-medium">{intervention.initialRiskScore.toFixed(1)}%</div>
                                              </div>
                                              {intervention.effectiveness !== undefined && (
                                                <div>
                                                  <div className="text-xs text-muted-foreground">Effectiveness</div>
                                                  <div className="font-medium text-green-600">{intervention.effectiveness.toFixed(0)}%</div>
                                                </div>
                                              )}
                                            </div>

                                            {intervention.notes && (
                                              <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-900 rounded text-sm">
                                                <span className="text-muted-foreground">Notes: </span>
                                                {intervention.notes}
                                              </div>
                                            )}
                                          </motion.div>
                                        ))}
                                      </motion.div>
                                    ) : (
                                      <div className="text-center py-8 text-muted-foreground">
                                        <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>No interventions created yet</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No teachers found matching your search</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}