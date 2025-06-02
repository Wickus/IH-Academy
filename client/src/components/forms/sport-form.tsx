import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const sportFormSchema = z.object({
  name: z.string().min(1, "Sport name is required"),
  color: z.string().min(1, "Color is required"),
  icon: z.string().min(1, "Icon is required"),
});

type SportFormData = z.infer<typeof sportFormSchema>;

interface SportFormProps {
  onSuccess: () => void;
}

const SPORT_ICONS = [
  { emoji: "⚽", name: "Soccer" },
  { emoji: "🏀", name: "Basketball" },
  { emoji: "🏈", name: "Football" },
  { emoji: "🎾", name: "Tennis" },
  { emoji: "🏐", name: "Volleyball" },
  { emoji: "🏓", name: "Table Tennis" },
  { emoji: "🏸", name: "Badminton" },
  { emoji: "🏑", name: "Hockey" },
  { emoji: "🏒", name: "Ice Hockey" },
  { emoji: "🥍", name: "Lacrosse" },
  { emoji: "🏉", name: "Rugby" },
  { emoji: "🎱", name: "Pool" },
  { emoji: "🏊", name: "Swimming" },
  { emoji: "🏃", name: "Running" },
  { emoji: "🚴", name: "Cycling" },
  { emoji: "🧘", name: "Yoga" },
  { emoji: "🤸", name: "Gymnastics" },
  { emoji: "🥊", name: "Boxing" },
  { emoji: "🤼", name: "Wrestling" },
  { emoji: "🏋️", name: "Weightlifting" },
  { emoji: "🤾", name: "Handball" },
  { emoji: "🥋", name: "Martial Arts" },
  { emoji: "🏆", name: "General Sports" },
  { emoji: "🎯", name: "Darts" },
];

export default function SportForm({ onSuccess }: SportFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedIcon, setSelectedIcon] = useState("🏃");
  
  const form = useForm<SportFormData>({
    resolver: zodResolver(sportFormSchema),
    defaultValues: {
      name: "",
      color: "#278DD4",
      icon: selectedIcon,
    },
  });

  const createSportMutation = useMutation({
    mutationFn: api.createSport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sports"] });
      toast({
        title: "Sport created",
        description: "New sport has been added successfully.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create sport. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: SportFormData) => {
    createSportMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#20366B] font-medium">Sport Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., Tennis, Soccer, Swimming" 
                  {...field} 
                  className="border-slate-200 focus:border-[#278DD4] focus:ring-[#278DD4]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#20366B] font-medium">Brand Color</FormLabel>
              <FormControl>
                <div className="flex items-center gap-3">
                  <Input 
                    type="color" 
                    {...field} 
                    className="w-20 h-10 border-slate-200 rounded-md cursor-pointer"
                  />
                  <Input 
                    placeholder="#278DD4" 
                    value={field.value}
                    onChange={field.onChange}
                    className="flex-1 border-slate-200 focus:border-[#278DD4] focus:ring-[#278DD4]"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#20366B] font-medium">Icon</FormLabel>
              <FormControl>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl p-2 border border-slate-200 rounded-md bg-slate-50">
                      {selectedIcon}
                    </div>
                    <div className="text-sm text-slate-600">
                      Selected icon for your sport
                    </div>
                  </div>
                  <div className="grid grid-cols-8 gap-2 p-3 border border-slate-200 rounded-md bg-slate-50 max-h-48 overflow-y-auto">
                    {SPORT_ICONS.map((icon) => (
                      <button
                        key={icon.emoji}
                        type="button"
                        onClick={() => {
                          setSelectedIcon(icon.emoji);
                          field.onChange(icon.emoji);
                        }}
                        className={cn(
                          "p-2 text-2xl rounded-md border-2 transition-all hover:scale-110",
                          selectedIcon === icon.emoji
                            ? "border-[#278DD4] bg-[#278DD4]/10"
                            : "border-transparent hover:border-slate-300 hover:bg-white"
                        )}
                        title={icon.name}
                      >
                        {icon.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4 pt-4 border-t border-slate-200">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onSuccess}
            className="border-slate-300 text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createSportMutation.isPending}
            className="bg-[#24D367] hover:bg-[#1fb557] text-white border-0 shadow-lg"
          >
            {createSportMutation.isPending ? "Creating..." : "Create Sport"}
          </Button>
        </div>
      </form>
    </Form>
  );
}