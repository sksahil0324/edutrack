import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { Award, BarChart3, Bell, BookOpen, Loader2, TrendingUp, Users } from "lucide-react";
import { useNavigate } from "react-router";

export default function Landing() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="container mx-auto px-4 py-20"
      >
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex justify-center mb-8"
          >
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-3xl shadow-2xl">
              <BookOpen className="h-16 w-16 text-white" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-5xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          >
            AI-Powered Student Success
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto"
          >
            Predict dropout risks, motivate students through gamification, and enable data-driven interventions
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            {isAuthenticated ? (
              <Button
                size="lg"
                onClick={() => navigate("/role-selection")}
                className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  onClick={() => navigate("/auth")}
                  className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Get Started
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/sign-in")}
                  className="text-lg px-8 py-6"
                >
                  Sign In
                </Button>
              </>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="container mx-auto px-4 py-20"
      >
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              icon: TrendingUp,
              title: "Predictive Analytics",
              description: "AI-powered risk assessment to identify students who need support early",
              color: "from-blue-500 to-cyan-500",
            },
            {
              icon: Award,
              title: "Gamification",
              description: "Motivate students with XP, levels, badges, and engaging challenges",
              color: "from-purple-500 to-pink-500",
            },
            {
              icon: Users,
              title: "Teacher Tools",
              description: "Comprehensive dashboard for monitoring students and managing interventions",
              color: "from-orange-500 to-red-500",
            },
            {
              icon: Bell,
              title: "Real-time Alerts",
              description: "Instant notifications for at-risk students and important updates",
              color: "from-green-500 to-emerald-500",
            },
            {
              icon: BarChart3,
              title: "Progress Tracking",
              description: "Detailed analytics and visualizations of student performance over time",
              color: "from-indigo-500 to-blue-500",
            },
            {
              icon: BookOpen,
              title: "Resource Library",
              description: "Personalized learning resources and recommendations for each student",
              color: "from-pink-500 to-rose-500",
            },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow"
            >
              <div className={`bg-gradient-to-br ${feature.color} p-4 rounded-xl w-fit mb-4`}>
                <feature.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="container mx-auto px-4 py-20"
      >
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-center text-white max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Education?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of educators and students using AI to improve outcomes
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate("/role-selection")}
            className="text-lg px-8 py-6"
          >
            Start Free Today
          </Button>
        </div>
      </motion.div>

      {/* Admin Login Footer */}
      <div className="container mx-auto px-4 py-8 text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin-login")}
          className="text-muted-foreground hover:text-foreground"
        >
          Admin Login
        </Button>
      </div>
    </div>
  );
}