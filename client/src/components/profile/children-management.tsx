import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  Baby, 
  Calendar,
  Phone,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const childSchema = z.object({
  name: z.string().min(1, "Child's name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required for age verification"),
  medicalInfo: z.string().min(1, "Medical information is required for child safety"),
  emergencyContact: z.string().min(1, "Emergency contact is required"),
  emergencyPhone: z.string().min(1, "Emergency phone number is required"),
});

type ChildFormData = z.infer<typeof childSchema>;

interface ChildrenManagementProps {
  userId: number;
}

export default function ChildrenManagement({ userId }: ChildrenManagementProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingChild, setEditingChild] = useState<any>(null);
  const { toast } = useToast();

  const { data: children = [] } = useQuery({
    queryKey: ["/api/children"],
    queryFn: () => api.getUserChildren(),
  });

  const form = useForm<ChildFormData>({
    resolver: zodResolver(childSchema),
    defaultValues: {
      name: "",
      dateOfBirth: "",
      medicalInfo: "",
      emergencyContact: "",
      emergencyPhone: "",
    },
  });

  const createChildMutation = useMutation({
    mutationFn: api.createChild,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      toast({
        title: "Success",
        description: "Child added successfully",
      });
      setShowAddForm(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add child",
        variant: "destructive",
      });
    },
  });

  const updateChildMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ChildFormData }) => 
      api.updateChild(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      toast({
        title: "Success",
        description: "Child updated successfully",
      });
      setEditingChild(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update child",
        variant: "destructive",
      });
    },
  });

  const deleteChildMutation = useMutation({
    mutationFn: api.deleteChild,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      toast({
        title: "Success",
        description: "Child removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove child",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ChildFormData) => {
    if (editingChild) {
      updateChildMutation.mutate({ id: editingChild.id, data });
    } else {
      createChildMutation.mutate(data);
    }
  };

  const handleEdit = (child: any) => {
    setEditingChild(child);
    form.reset({
      name: child.name,
      dateOfBirth: child.dateOfBirth || "",
      medicalInfo: child.medicalInfo || "",
      emergencyContact: child.emergencyContact || "",
      emergencyPhone: child.emergencyPhone || "",
    });
    setShowAddForm(true);
  };

  const handleDelete = (childId: number) => {
    if (confirm("Are you sure you want to remove this child? This action cannot be undone.")) {
      deleteChildMutation.mutate(childId);
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(dateOfBirth);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  return (
    <Card className="border-0 shadow-md bg-white">
      <CardHeader className="bg-gradient-to-r from-[#20366B] to-[#278DD4] text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-xl">
            <Users className="mr-2 h-5 w-5" />
            My Children
          </CardTitle>
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white hover:text-[#20366B]"
                onClick={() => {
                  setEditingChild(null);
                  form.reset();
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Child
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle className="text-[#20366B]">
                  {editingChild ? "Edit Child" : "Add New Child"}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#20366B] font-medium">Child's Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter child's full name" 
                            {...field}
                            className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#20366B] font-medium">Date of Birth</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field}
                            className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4]"
                          />
                        </FormControl>
                        <FormDescription>
                          This helps determine age-appropriate classes
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="emergencyContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#20366B] font-medium">Emergency Contact</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Contact person name" 
                              {...field}
                              className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emergencyPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#20366B] font-medium">Emergency Phone</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="+27 12 345 6789" 
                              {...field}
                              className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="medicalInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#20366B] font-medium">Medical Information *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Please include:&#10;• Any allergies (food, medication, environmental)&#10;• Medical conditions (asthma, diabetes, etc.)&#10;• Current medications&#10;• Physical limitations or restrictions&#10;• Emergency medical procedures if needed"
                            {...field}
                            value={field.value || ''}
                            onChange={field.onChange}
                            className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4] min-h-[120px] bg-white text-slate-900"
                            style={{ whiteSpace: 'pre-line' }}
                          />
                        </FormControl>
                        <FormDescription className="text-slate-600">
                          This information is crucial for your child's safety during activities. Please be thorough and accurate.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowAddForm(false)}
                      className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createChildMutation.isPending || updateChildMutation.isPending}
                      className="bg-[#24D367] hover:bg-[#24D367]/90 text-white"
                    >
                      {createChildMutation.isPending || updateChildMutation.isPending
                        ? "Saving..." 
                        : editingChild 
                        ? "Update Child" 
                        : "Add Child"
                      }
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {children.length > 0 ? (
          <div className="space-y-4">
            {children.map((child: any) => {
              const age = child.dateOfBirth ? calculateAge(child.dateOfBirth) : null;
              
              return (
                <div key={child.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-[#278DD4]/10 rounded-lg">
                        <Baby className="h-5 w-5 text-[#278DD4]" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#20366B]">{child.name}</h4>
                        {age !== null && (
                          <p className="text-sm text-slate-600">
                            {age} year{age !== 1 ? 's' : ''} old
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(child)}
                        className="text-[#278DD4] border-[#278DD4] hover:bg-[#278DD4] hover:text-white"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(child.id)}
                        className="text-red-500 border-red-300 hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {(child.emergencyContact || child.emergencyPhone) && (
                    <div className="mb-3">
                      <Separator className="mb-2" />
                      <div className="flex items-center space-x-4 text-sm text-slate-600">
                        {child.emergencyContact && (
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3" />
                            <span>{child.emergencyContact}</span>
                          </div>
                        )}
                        {child.emergencyPhone && (
                          <span>{child.emergencyPhone}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {child.medicalInfo && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">Medical Information</p>
                          <p className="text-sm text-amber-700">{child.medicalInfo}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Baby className="mx-auto h-16 w-16 text-slate-400 mb-4" />
            <h3 className="text-xl font-semibold text-[#20366B] mb-2">No children added yet</h3>
            <p className="text-slate-600 mb-4">
              Add your children to easily book sessions for them
            </p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-[#278DD4] hover:bg-[#278DD4]/90 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Child
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}