import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { AlertTriangle, Loader2, TrendingUp, Users } from "lucide-react";
import { useNavigate } from "react-router";

export default function TeacherDashboard() {
  const { isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const teacher = useQuery(api.teachers.getCurrentTeacher);
  const students = useQuery(api.students.getAll);

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

  const getRiskColor = (level?: string) => {
    if (!level) return "bg-muted";
    if (level === "low") return "bg-green-500";
    if (level === "moderate") return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Monitor students and manage interventions</p>
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
            </CardHeader>
            <CardContent>
              {students && students.length > 0 ? (
                <div className="space-y-3">
                  {students.map((student) => (
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
                        <Button variant="outline" size="sm">View Details</Button>
                      </div>
                    </div>
                  ))}
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
    </div>
  );
}
