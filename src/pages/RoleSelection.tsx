import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { GraduationCap, Users } from "lucide-react";
import { useNavigate } from "react-router";

export default function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-5xl"
      >
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-5xl md:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          >
            Choose Your Role
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-xl text-muted-foreground"
          >
            Select how you'd like to use the platform
          </motion.p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Student Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className="cursor-pointer h-full border-2 hover:border-primary transition-all duration-300 hover:shadow-lg"
              onClick={() => navigate("/student/setup")}
            >
              <CardHeader className="text-center pb-6">
                <div className="mx-auto mb-6 w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border-2 border-blue-200 dark:border-blue-800">
                  <GraduationCap className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-3xl font-bold">Student</CardTitle>
                <CardDescription className="text-base mt-2">
                  Track your progress, complete challenges, and improve your performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 dark:text-blue-400 font-bold mt-1">✓</span>
                    <span className="text-sm">View your risk assessment</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 dark:text-blue-400 font-bold mt-1">✓</span>
                    <span className="text-sm">Complete daily challenges</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 dark:text-blue-400 font-bold mt-1">✓</span>
                    <span className="text-sm">Earn XP and badges</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 dark:text-blue-400 font-bold mt-1">✓</span>
                    <span className="text-sm">Track attendance and grades</span>
                  </li>
                </ul>
                <Button className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white" size="lg">
                  Continue as Student
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Teacher Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className="cursor-pointer h-full border-2 hover:border-primary transition-all duration-300 hover:shadow-lg"
              onClick={() => navigate("/teacher/setup")}
            >
              <CardHeader className="text-center pb-6">
                <div className="mx-auto mb-6 w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border-2 border-purple-200 dark:border-purple-800">
                  <Users className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-3xl font-bold">Teacher</CardTitle>
                <CardDescription className="text-base mt-2">
                  Monitor students, create interventions, and improve outcomes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 dark:text-purple-400 font-bold mt-1">✓</span>
                    <span className="text-sm">Monitor all students</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 dark:text-purple-400 font-bold mt-1">✓</span>
                    <span className="text-sm">View risk analytics</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 dark:text-purple-400 font-bold mt-1">✓</span>
                    <span className="text-sm">Create interventions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 dark:text-purple-400 font-bold mt-1">✓</span>
                    <span className="text-sm">Track effectiveness</span>
                  </li>
                </ul>
                <Button className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white" size="lg">
                  Continue as Teacher
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center"
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Back to Home
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}