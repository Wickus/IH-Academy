import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, CreditCard, Calendar, MapPin, Users, Clock } from "lucide-react";
import { api, type Class } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { formatCurrency, formatDateTime, getSportColor } from "@/lib/utils";
import { initiatePayfastPayment, generatePaymentId } from "@/lib/payfast";

const bookingFormSchema = z.object({
  participantName: z.string().min(1, "Participant name is required"),
  participantEmail: z.string().email("Valid email is required"),
  participantPhone: z.string().optional(),
  participantAge: z.string().optional(),
  notes: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  classData: Class;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function BookingForm({ classData, onSuccess, onCancel }: BookingFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'form' | 'payment' | 'confirmation'>('form');

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      participantName: "",
      participantEmail: "",
      participantPhone: "",
      participantAge: "",
      notes: "",
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: api.createBooking,
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      
      toast({
        title: "Booking created",
        description: "Your booking has been created. Redirecting to payment...",
      });

      // Initiate Payfast payment
      const paymentData = {
        name_first: booking.participantName.split(' ')[0] || '',
        name_last: booking.participantName.split(' ').slice(1).join(' ') || '',
        email_address: booking.participantEmail,
        m_payment_id: generatePaymentId(),
        amount: Number(booking.amount),
        item_name: classData.name,
        item_description: `Sports class booking for ${classData.name}`,
        custom_str1: booking.id.toString(),
        custom_str2: classData.id.toString(),
        custom_str3: 'class_booking',
      };

      // Update booking with payment ID
      api.updateBooking(booking.id, { 
        payfastPaymentId: paymentData.m_payment_id 
      });

      // Initiate payment
      initiatePayfastPayment(paymentData);
      
      setPaymentStep('payment');
    },
    onError: (error) => {
      console.error('Booking error:', error);
      toast({
        title: "Booking failed",
        description: "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true);
    
    try {
      const bookingData = {
        classId: classData.id,
        participantName: data.participantName,
        participantEmail: data.participantEmail,
        participantPhone: data.participantPhone || null,
        participantAge: data.participantAge ? parseInt(data.participantAge) : null,
        paymentStatus: 'pending' as const,
        paymentMethod: 'payfast' as const,
        amount: Number(classData.price),
        notes: data.notes || null,
      };

      await createBookingMutation.mutateAsync(bookingData);
    } catch (error) {
      console.error('Failed to create booking:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sportColor = getSportColor(classData.sport?.name || '');

  if (paymentStep === 'payment') {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Payment Processing</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <CreditCard className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground">
            You are being redirected to Payfast for secure payment processing...
          </p>
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Class Information Summary */}
      <Card className="bg-gradient-to-br from-[#24D3BF] to-[#22C4B0] text-white border-[#24D3BF]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{classData.name}</CardTitle>
            <Badge 
              variant="outline"
              className="bg-white/20 text-white border-white/30"
            >
              {classData.sport?.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-white/80" />
              <span>{formatDateTime(classData.startTime)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-white/80" />
              <span>Duration: {Math.round((new Date(classData.endTime).getTime() - new Date(classData.startTime).getTime()) / (1000 * 60))} minutes</span>
            </div>
            {classData.location && (
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-white/80" />
                <span>{classData.location}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-white/80" />
              <span>{classData.availableSpots} spots available</span>
            </div>
          </div>
          
          {classData.description && (
            <div>
              <p className="text-sm text-white/90">{classData.description}</p>
            </div>
          )}

          {classData.requirements && (
            <div>
              <h4 className="font-medium text-sm mb-1">Requirements:</h4>
              <p className="text-sm text-white/90">{classData.requirements}</p>
            </div>
          )}

          <Separator className="bg-white/20" />
          
          <div className="flex items-center justify-between">
            <span className="font-medium">Total Amount:</span>
            <span className="text-2xl font-bold text-white">
              {formatCurrency(Number(classData.price))}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Booking Form */}
      <Card>
        <CardHeader>
          <CardTitle>Participant Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="participantName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter participant's full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="participantEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="participant@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="participantPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+27 12 345 6789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="participantAge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Age in years" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any special requirements, medical conditions, or additional information..."
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Information */}
              <div className="bg-gradient-to-br from-[#24D3BF] to-[#22C4B0] p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Shield className="h-5 w-5 text-white" />
                  <h4 className="font-medium text-white">Secure Payment with Payfast</h4>
                </div>
                <p className="text-sm text-white/90 mb-3">
                  Your payment will be processed securely through Payfast. You will receive a booking confirmation and calendar invite via email.
                </p>
                <div className="flex items-center space-x-4 text-xs text-white/80">
                  <span>• SSL Encrypted</span>
                  <span>• PCI Compliant</span>
                  <span>• Instant Confirmation</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || createBookingMutation.isPending || classData.availableSpots === 0}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {isSubmitting || createBookingMutation.isPending ? (
                    "Processing..."
                  ) : classData.availableSpots === 0 ? (
                    "Class Full"
                  ) : (
                    `Pay ${formatCurrency(Number(classData.price))} & Book`
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
