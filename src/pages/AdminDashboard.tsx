import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { BarChart3, Download, Loader2, LogOut, Search, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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
    try {
      toast.loading("Generating code archive...");
      
      // Simulate code generation and download
      const codeContent = "Project files would be included here";
      const blob = new Blob([codeContent], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "DropoutPredictor_Code.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Code downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download code");
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
      t.teacherId.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getRiskBadgeColor = (riskLevel?: string) => {
    if (!riskLevel) return "bg-gray-100 text-gray-800";
    if (riskLevel === "low") return "bg-green-100 text-green-800";
    if (riskLevel === "moderate") return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
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
                  placeholder="Search users by name, email, or role..."
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
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="text-left py-3 px-4 font-medium">Name</th>
                            <th className="text-left py-3 px-4 font-medium">Student ID</th>
                            <th className="text-left py-3 px-4 font-medium">Grade</th>
                            <th className="text-left py-3 px-4 font-medium">GPA</th>
                            <th className="text-left py-3 px-4 font-medium">Attendance</th>
                            <th className="text-left py-3 px-4 font-medium">Risk Level</th>
                            <th className="text-left py-3 px-4 font-medium">XP / Level</th>
                            <th className="text-left py-3 px-4 font-medium">Streak</th>
                            <th className="text-left py-3 px-4 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((student) => (
                            <motion.tr
                              key={student._id}
                              className="border-b hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                              whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
                            >
                              <td className="py-3 px-4">
                                <div className="font-medium">{student.fullName}</div>
                                <div className="text-xs text-muted-foreground">
                                  Participation: {student.classParticipationScore}%
                                </div>
                              </td>
                              <td className="py-3 px-4 text-muted-foreground">{student.studentId}</td>
                              <td className="py-3 px-4">
                                <div>{student.grade}</div>
                                <div className="text-xs text-muted-foreground">
                                  Section: {student.section || 'N/A'}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-semibold">{student.currentGPA.toFixed(2)}</div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                  <div 
                                    className="bg-blue-600 h-1.5 rounded-full" 
                                    style={{ width: `${(student.currentGPA / 4.0) * 100}%` }}
                                  />
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-semibold">{student.attendanceRate.toFixed(0)}%</div>
                                <div className="text-xs text-muted-foreground">
                                  Absences: {student.totalAbsences}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <Badge className={getRiskBadgeColor()}>
                                  Calculating...
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-semibold">{student.xp} XP</div>
                                <Badge variant="secondary" className="text-xs mt-1">
                                  Level {student.level}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-1">
                                  <span className="text-orange-500">🔥</span>
                                  <span className="font-semibold">{student.currentStreak}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Best: {student.longestStreak}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Active
                                </Badge>
                                {student.badges.length > 0 && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    🏆 {student.badges.length} badges
                                  </div>
                                )}
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
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
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="text-left py-3 px-4 font-medium">Name</th>
                            <th className="text-left py-3 px-4 font-medium">Teacher ID</th>
                            <th className="text-left py-3 px-4 font-medium">Department</th>
                            <th className="text-left py-3 px-4 font-medium">Level</th>
                            <th className="text-left py-3 px-4 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTeachers.map((teacher) => (
                            <motion.tr
                              key={teacher._id}
                              className="border-b hover:bg-purple-50 dark:hover:bg-gray-700/50 transition-colors"
                              whileHover={{ backgroundColor: "rgba(147, 51, 234, 0.05)" }}
                            >
                              <td className="py-3 px-4 font-medium">{teacher.fullName}</td>
                              <td className="py-3 px-4 text-muted-foreground">{teacher.teacherId}</td>
                              <td className="py-3 px-4">{teacher.department}</td>
                              <td className="py-3 px-4">
                                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                                  Level {teacher.level}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Active
                                </Badge>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
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