import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { GraduationCap, Users } from "lucide-react";
import { useNavigate } from "react-router";

export default function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Choose Your Role</h1>
          <p className="text-muted-foreground text-lg">
            Select how you'd like to use the platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="cursor-pointer h-full border-2 hover:border-primary transition-colors" onClick={() => navigate("/student/setup")}>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="w-10 h-10 text-primary" />
                </div>
                <CardTitle className="text-2xl">Student</CardTitle>
                <CardDescription className="text-base">
                  Track your progress, complete challenges, and improve your performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li>• View your risk assessment</li>
                  <li>• Complete daily challenges</li>
                  <li>• Earn XP and badges</li>
                  <li>• Track attendance and grades</li>
                </ul>
                <Button className="w-full" size="lg">
                  Continue as Student
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="cursor-pointer h-full border-2 hover:border-primary transition-colors" onClick={() => navigate("/teacher/setup")}>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-10 h-10 text-primary" />
                </div>
                <CardTitle className="text-2xl">Teacher</CardTitle>
                <CardDescription className="text-base">
                  Monitor students, create interventions, and improve outcomes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li>• Monitor all students</li>
                  <li>• View risk analytics</li>
                  <li>• Create interventions</li>
                  <li>• Track effectiveness</li>
                </ul>
                <Button className="w-full" size="lg">
                  Continue as Teacher
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
