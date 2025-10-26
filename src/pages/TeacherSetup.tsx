import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "convex/react";
import { Loader2, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export default function TeacherSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const createTeacher = useMutation(api.teachers.create);
  const existingTeacher = useQuery(api.teachers.getCurrentTeacher);
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    teacherId: "",
    department: "",
    subjects: [] as string[],
  });
  const [currentSubject, setCurrentSubject] = useState("");

  // Check for ID-based login session - redirect immediately if profile exists
  useEffect(() => {
    const sessionData = sessionStorage.getItem("edutrack_user");
    if (sessionData) {
      try {
        const userData = JSON.parse(sessionData);
        if (userData.role === "teacher" && userData.profileId) {
          // User already has a profile from ID-based login
          toast.info("You already have a teacher profile");
          navigate("/teacher/dashboard");
        }
      } catch (error) {
        console.error("Error parsing session data:", error);
      }
    } else if (existingTeacher) {
      // Redirect if teacher profile already exists (for email OTP users)
      toast.info("You already have a teacher profile");
      navigate("/teacher/dashboard");
    }
  }, [existingTeacher, navigate]);

  const addSubject = () => {
    if (currentSubject.trim() && !formData.subjects.includes(currentSubject.trim())) {
      setFormData({
        ...formData,
        subjects: [...formData.subjects, currentSubject.trim()],
      });
      setCurrentSubject("");
    }
  };

  const removeSubject = (subject: string) => {
    setFormData({
      ...formData,
      subjects: formData.subjects.filter((s) => s !== subject),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.subjects.length === 0) {
      toast.error("Please add at least one subject");
      return;
    }
    
    setIsLoading(true);
    
    try {
      await createTeacher({
        fullName: formData.fullName,
        teacherId: formData.teacherId,
        department: formData.department,
        subjects: formData.subjects,
      });
      
      toast.success("Profile created successfully!");
      navigate("/teacher/dashboard");
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
      return userData.role === "teacher" && userData.profileId;
    } catch {
      return false;
    }
  })() : false;

  // Show loading while checking for existing profile (only for email OTP users)
  if (!hasIdBasedProfile && existingTeacher === undefined) {
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
          <CardTitle>Complete Your Teacher Profile</CardTitle>
          <CardDescription>
            Tell us about your teaching role
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
              <Label htmlFor="teacherId">Teacher ID</Label>
              <Input
                id="teacherId"
                value={formData.teacherId}
                onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subjects">Subjects</Label>
              <div className="flex gap-2">
                <Input
                  id="subjects"
                  value={currentSubject}
                  onChange={(e) => setCurrentSubject(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSubject();
                    }
                  }}
                  placeholder="Add a subject"
                />
                <Button type="button" onClick={addSubject} size="icon" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.subjects.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.subjects.map((subject) => (
                    <div
                      key={subject}
                      className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm"
                    >
                      {subject}
                      <button
                        type="button"
                        onClick={() => removeSubject(subject)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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