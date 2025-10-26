import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { GraduationCap, Loader2, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

function SignIn() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"roleSelect" | "idEntry">("roleSelect");
  const [selectedRole, setSelectedRole] = useState<"student" | "teacher" | null>(null);
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const loginWithId = useMutation(api.idAuth.loginWithId);

  const handleRoleSelect = (role: "student" | "teacher") => {
    setSelectedRole(role);
    setStep("idEntry");
  };

  const handleIdSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await loginWithId({
        id: userId,
        role: selectedRole!,
      });
      
      if (result.success) {
        toast.success(`Welcome back, ${result.profile.fullName}!`);
        // Store login info in sessionStorage
        sessionStorage.setItem("edutrack_user", JSON.stringify({
          userId: result.userId,
          profileId: result.profileId,
          role: result.role,
          profile: result.profile,
        }));
        
        // Navigate to dashboard
        navigate(`/${result.role}/dashboard`);
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error instanceof Error ? error.message : "Invalid ID. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-4"
      >
        {step === "roleSelect" ? (
          <Card className="w-full pb-0 border shadow-md">
            <CardHeader className="text-center">
              <div className="flex justify-center">
                <img
                  src="./logo.svg"
                  alt="EduTrack AI Logo"
                  width={64}
                  height={64}
                  className="rounded-lg mb-4 mt-4 cursor-pointer"
                  onClick={() => navigate("/")}
                />
              </div>
              <CardTitle className="text-2xl">Sign In</CardTitle>
              <CardDescription>
                Choose your role to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => handleRoleSelect("student")}
                  className="w-full h-auto py-6 flex items-center justify-start gap-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg">Student</div>
                    <div className="text-sm opacity-90">Access your dashboard</div>
                  </div>
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => handleRoleSelect("teacher")}
                  className="w-full h-auto py-6 flex items-center justify-start gap-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  size="lg"
                >
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Users className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg">Teacher</div>
                    <div className="text-sm opacity-90">Monitor your students</div>
                  </div>
                </Button>
              </motion.div>
            </CardContent>

            <div className="py-4 px-6 text-xs text-center text-muted-foreground bg-muted border-t rounded-b-lg">
              Secured by{" "}
              <a
                href="https://vly.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-primary transition-colors"
              >
                vly.ai
              </a>
            </div>
          </Card>
        ) : (
          <Card className="w-full pb-0 border shadow-md">
            <CardHeader className="text-center">
              <div className="flex justify-center">
                <img
                  src="./logo.svg"
                  alt="EduTrack AI Logo"
                  width={64}
                  height={64}
                  className="rounded-lg mb-4 mt-4 cursor-pointer"
                  onClick={() => navigate("/")}
                />
              </div>
              <CardTitle className="text-2xl">
                Sign In as {selectedRole === "student" ? "Student" : "Teacher"}
              </CardTitle>
              <CardDescription>
                Enter your {selectedRole === "student" ? "Student" : "Teacher"} ID
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleIdSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Input
                    name="userId"
                    placeholder={selectedRole === "student" ? "Student ID (e.g., student001)" : "Teacher ID (e.g., teacher001)"}
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    disabled={isLoading}
                    required
                    className="text-center text-lg"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Use your assigned ID to access your account
                  </p>
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !userId}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
                
                <div className="text-center">
                  <Button
                    variant="link"
                    className="p-0 h-auto text-sm"
                    onClick={() => {
                      setStep("roleSelect");
                      setUserId("");
                    }}
                    type="button"
                  >
                    ← Change role
                  </Button>
                </div>
              </CardContent>
            </form>

            <div className="py-4 px-6 text-xs text-center text-muted-foreground bg-muted border-t rounded-b-lg">
              Secured by{" "}
              <a
                href="https://vly.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-primary transition-colors"
              >
                vly.ai
              </a>
            </div>
          </Card>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-4"
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

export default function SignInPage() {
  return <SignIn />;
}