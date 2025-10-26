import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export default function StudentSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const createStudent = useMutation(api.students.create);
  const existingStudent = useQuery(api.students.getCurrentStudent);
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    studentId: "",
    grade: "",
    section: "",
  });

  // Check for ID-based login session - redirect immediately if profile exists
  useEffect(() => {
    const sessionData = sessionStorage.getItem("edutrack_user");
    if (sessionData) {
      try {
        const userData = JSON.parse(sessionData);
        if (userData.role === "student" && userData.profileId) {
          // User already has a profile from ID-based login
          toast.info("You already have a student profile");
          navigate("/student/dashboard");
        }
      } catch (error) {
        console.error("Error parsing session data:", error);
      }
    } else if (existingStudent) {
      // Redirect if student profile already exists (for email OTP users)
      toast.info("You already have a student profile");
      navigate("/student/dashboard");
    }
  }, [existingStudent, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await createStudent({
        fullName: formData.fullName,
        studentId: formData.studentId,
        grade: formData.grade,
        section: formData.section || undefined,
      });
      
      toast.success("Profile created successfully!");
      navigate("/student/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create profile");
    } finally {
      setIsLoading(false);
    }
  };

  // Check session storage first for ID-based login
  const sessionData = sessionStorage.getItem("edutrack_user");
  const hasIdBasedProfile = sessionData ? (() => {
    try {
      const userData = JSON.parse(sessionData);
      return userData.role === "student" && userData.profileId;
    } catch {
      return false;
    }
  })() : false;

  // Show loading while checking for existing profile (only for email OTP users)
  if (!hasIdBasedProfile && existingStudent === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If ID-based profile exists, don't render the form (redirect will happen)
  if (hasIdBasedProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Student Profile</CardTitle>
          <CardDescription>
            Tell us a bit about yourself to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="grade">Year</Label>
              <Select
                value={formData.grade}
                onValueChange={(value) => setFormData({ ...formData, grade: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1st Year</SelectItem>
                  <SelectItem value="2">2nd Year</SelectItem>
                  <SelectItem value="3">3rd Year</SelectItem>
                  <SelectItem value="4">4th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="section">Section (Optional)</Label>
              <Input
                id="section"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Profile...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}