import React, { useState } from 'react';
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { 
  Calendar, 
  Users, 
  CreditCard, 
  BarChart, 
  Shield, 
  Smartphone,
  Clock,
  CheckCircle,
  ArrowRight,
  PlayCircle,
  Trophy,
  Target,
  Zap,
  X
} from "lucide-react";

import ItsHappening_Africa_Logo_Picture_Mark_small from "@assets/ItsHappening.Africa Logo_Picture Mark_small.png";

export default function LandingPage() {
  const [showDemoModal, setShowDemoModal] = useState(false);

  // Fetch real pricing data from the API
  const { data: pricingData, isLoading: pricingLoading } = useQuery({
    queryKey: ['/api/pricing'],
    queryFn: async () => {
      const response = await fetch('/api/pricing');
      if (!response.ok) {
        throw new Error('Failed to fetch pricing');
      }
      return response.json();
    },
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <img 
                src={ItsHappening_Africa_Logo_Picture_Mark_small} 
                alt="ItsHappening.Africa" 
                className="h-10 w-auto"
              />
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-[#20366B]">IH Academy</h1>
                <p className="text-sm text-gray-600">Sports Academy Management</p>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-gray-600 hover:text-[#20366B] transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-[#20366B] transition-colors">Pricing</a>
              <a href="#about" className="text-gray-600 hover:text-[#20366B] transition-colors">About</a>
              <a href="https://itshappening.africa/contact" className="text-gray-600 hover:text-[#20366B] transition-colors">Contact</a>
            </nav>

            <div className="flex items-center space-x-3">
              <a href="/login">
                <Button variant="outline" className="border-[#20366B] text-[#20366B] hover:bg-[#20366B] hover:text-white">
                  Sign In
                </Button>
              </a>
              <a href="/register">
                <Button className="bg-[#278DD4] hover:bg-[#20366B] text-white">
                  Get Started
                </Button>
              </a>
            </div>
          </div>
        </div>
      </header>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#20366B] via-[#278DD4] to-[#24D367] text-white py-20 lg:py-32">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-white/20 text-white border-white/30 hover:bg-white/30">
              Proudly South African 🇿🇦
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Transform Your Sports Academy with 
              <span className="block text-[#24D367]">Professional Management</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Complete academy management system designed for South African sports organizations. 
              Handle bookings, payments, coaching staff, and member communications all in one place.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <a href="/register">
                <Button size="lg" className="bg-[#24D367] hover:bg-green-500 text-white px-8 py-4 text-lg">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-[#20366B] px-8 py-4 text-lg"
                onClick={() => setShowDemoModal(true)}
              >
                <PlayCircle className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-blue-100">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-[#24D367]" />
                No Setup Fees
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-[#24D367]" />
                Free 30-Day Trial
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-[#24D367]" />
                PayFast Integration
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Welcome Overview Section */}
      <section className="py-16 bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[#20366B] mb-4">
                Welcome to the Future of Academy Management
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                From grassroots clubs to professional academies, IH Academy streamlines every aspect of your operations 
                with tools designed specifically for South African sports organizations.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Key Features Grid */}
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#278DD4]/10 rounded-lg flex items-center justify-center">
                    <Zap className="h-6 w-6 text-[#278DD4]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#20366B] mb-2">Quick Setup in Minutes</h3>
                    <p className="text-gray-600">
                      Get your academy online in under 10 minutes. No technical knowledge required - 
                      our guided setup walks you through every step.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#24D367]/10 rounded-lg flex items-center justify-center">
                    <Smartphone className="h-6 w-6 text-[#24D367]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#20366B] mb-2">Mobile-First Design</h3>
                    <p className="text-gray-600">
                      Coaches mark attendance on their phones, parents book classes on the go, 
                      and admins manage everything from any device.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#278DD4]/10 rounded-lg flex items-center justify-center">
                    <Shield className="h-6 w-6 text-[#278DD4]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#20366B] mb-2">Bank-Level Security</h3>
                    <p className="text-gray-600">
                      Your data is protected with enterprise-grade security, automatic backups, 
                      and compliance with South African data protection laws.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#24D367]/10 rounded-lg flex items-center justify-center">
                    <Target className="h-6 w-6 text-[#24D367]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#20366B] mb-2">Built for South Africa</h3>
                    <p className="text-gray-600">
                      PayFast integration, South African banking support, local currency, 
                      and features designed for how local academies operate.
                    </p>
                  </div>
                </div>
              </div>

              {/* Visual Dashboard Preview */}
              <div className="lg:pl-8">
                <div className="relative">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 shadow-2xl">
                    <div className="bg-white rounded-xl p-6 shadow-lg">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-semibold text-[#20366B]">Academy Dashboard</h3>
                          <p className="text-sm text-gray-500">Real-time overview</p>
                        </div>
                        <div className="w-3 h-3 bg-[#24D367] rounded-full animate-pulse"></div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gradient-to-r from-[#278DD4] to-[#20366B] rounded-lg p-4 text-white">
                          <div className="text-2xl font-bold">247</div>
                          <div className="text-sm opacity-90">Active Members</div>
                        </div>
                        <div className="bg-gradient-to-r from-[#24D367] to-green-500 rounded-lg p-4 text-white">
                          <div className="text-2xl font-bold">R45,680</div>
                          <div className="text-sm opacity-90">Monthly Revenue</div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-[#278DD4] rounded-full flex items-center justify-center">
                              <Calendar className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">Swimming Lessons</div>
                              <div className="text-xs text-gray-500">Today 15:00</div>
                            </div>
                          </div>
                          <Badge className="bg-[#24D367] text-white text-xs">12/15</Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-[#24D367] rounded-full flex items-center justify-center">
                              <Trophy className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">Tennis Coaching</div>
                              <div className="text-xs text-gray-500">Tomorrow 09:00</div>
                            </div>
                          </div>
                          <Badge className="bg-yellow-500 text-white text-xs">8/10</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating Feature Badges */}
                  <div className="absolute -top-4 -right-4 bg-[#24D367] text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                    Live Updates
                  </div>
                  <div className="absolute -bottom-4 -left-4 bg-[#278DD4] text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                    Mobile Ready
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Quick Benefits Bar */}
      <section className="py-8 bg-[#20366B]/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm">
            <div className="flex items-center text-[#20366B]">
              <Clock className="h-4 w-4 mr-2 text-[#278DD4]" />
              <span className="font-medium">Setup in 10 minutes</span>
            </div>
            <div className="flex items-center text-[#20366B]">
              <Shield className="h-4 w-4 mr-2 text-[#24D367]" />
              <span className="font-medium">Bank-grade security</span>
            </div>
            <div className="flex items-center text-[#20366B]">
              <Users className="h-4 w-4 mr-2 text-[#278DD4]" />
              <span className="font-medium">Unlimited members</span>
            </div>
            <div className="flex items-center text-[#20366B]">
              <CreditCard className="h-4 w-4 mr-2 text-[#24D367]" />
              <span className="font-medium">PayFast included</span>
            </div>
            <div className="flex items-center text-[#20366B]">
              <Smartphone className="h-4 w-4 mr-2 text-[#278DD4]" />
              <span className="font-medium">Mobile optimized</span>
            </div>
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#20366B] mb-4">
              Everything Your Academy Needs
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built specifically for South African sports academies with local payment integration and mobile-first design
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-[#278DD4]/10 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-[#278DD4]" />
                </div>
                <CardTitle className="text-[#20366B]">Class Scheduling</CardTitle>
                <CardDescription>
                  Easy-to-use scheduling system with recurring classes, coach assignments, and automatic reminders
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-[#24D367]/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-[#24D367]" />
                </div>
                <CardTitle className="text-[#20366B]">Member Management</CardTitle>
                <CardDescription>
                  Complete member profiles, family accounts, attendance tracking, and achievement systems
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-[#278DD4]/10 rounded-lg flex items-center justify-center mb-4">
                  <CreditCard className="h-6 w-6 text-[#278DD4]" />
                </div>
                <CardTitle className="text-[#20366B]">PayFast Integration</CardTitle>
                <CardDescription>
                  Secure South African payment processing with debit orders, membership plans, and automated billing
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-[#24D367]/10 rounded-lg flex items-center justify-center mb-4">
                  <BarChart className="h-6 w-6 text-[#24D367]" />
                </div>
                <CardTitle className="text-[#20366B]">Analytics & Reports</CardTitle>
                <CardDescription>
                  Detailed insights into revenue, attendance, member growth, and academy performance
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-[#278DD4]/10 rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="h-6 w-6 text-[#278DD4]" />
                </div>
                <CardTitle className="text-[#20366B]">Mobile Optimized</CardTitle>
                <CardDescription>
                  Works perfectly on any device. Coaches and members can access everything from their phones
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-[#24D367]/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-[#24D367]" />
                </div>
                <CardTitle className="text-[#20366B]">Secure & Reliable</CardTitle>
                <CardDescription>
                  Bank-level security, automatic backups, and 99.9% uptime guarantee for your peace of mind
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>


      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#20366B] mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              No hidden fees. Cancel anytime. All plans include PayFast integration.
            </p>
          </div>

          {pricingLoading ? (
            <div className="flex justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-[#278DD4] border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Free Plan */}
              <Card className="border-2 border-gray-200 hover:border-[#278DD4] transition-colors">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-[#20366B] text-xl">{pricingData?.membership?.free?.name || 'Starter'}</CardTitle>
                  <div className="text-3xl font-bold text-[#278DD4] mt-4">
                    R{pricingData?.membership?.free?.price || '0'}<span className="text-base font-normal text-gray-600">/month</span>
                  </div>
                  <CardDescription>Perfect for getting started</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-[#24D367] mr-3" />
                      Up to {pricingData?.membership?.free?.maxMembers || '25'} members
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-[#24D367] mr-3" />
                      Up to {pricingData?.membership?.free?.maxClasses || '5'} classes
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-[#24D367] mr-3" />
                      {pricingData?.membership?.free?.storage || '1'}GB storage
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-[#24D367] mr-3" />
                      PayFast integration
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-[#24D367] mr-3" />
                      Email support
                    </li>
                  </ul>
                  <Button className="w-full bg-[#278DD4] hover:bg-[#20366B] text-white mt-6">
                    Start Free
                  </Button>
                </CardContent>
              </Card>

              {/* Basic Plan */}
              <Card className="border-2 border-[#24D367] relative hover:shadow-xl transition-shadow">
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#24D367] text-white">
                  Most Popular
                </Badge>
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-[#20366B] text-xl">{pricingData?.membership?.basic?.name || 'Professional'}</CardTitle>
                  <div className="text-3xl font-bold text-[#278DD4] mt-4">
                    R{pricingData?.membership?.basic?.price || '299'}<span className="text-base font-normal text-gray-600">/month</span>
                  </div>
                  <CardDescription>Ideal for growing academies</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-[#24D367] mr-3" />
                      Up to {pricingData?.membership?.basic?.maxMembers || '100'} members
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-[#24D367] mr-3" />
                      Up to {pricingData?.membership?.basic?.maxClasses || '25'} classes
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-[#24D367] mr-3" />
                      {pricingData?.membership?.basic?.storage || '10'}GB storage
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-[#24D367] mr-3" />
                      Advanced analytics
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-[#24D367] mr-3" />
                      Priority support
                    </li>
                  </ul>
                  <Button className="w-full bg-[#24D367] hover:bg-green-600 text-white mt-6">
                    Start Free Trial
                  </Button>
                </CardContent>
              </Card>

              {/* Premium Plan */}
              <Card className="border-2 border-gray-200 hover:border-[#278DD4] transition-colors">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-[#20366B] text-xl">{pricingData?.membership?.premium?.name || 'Enterprise'}</CardTitle>
                  <div className="text-3xl font-bold text-[#278DD4] mt-4">
                    R{pricingData?.membership?.premium?.price || '599'}<span className="text-base font-normal text-gray-600">/month</span>
                  </div>
                  <CardDescription>For large organizations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-[#24D367] mr-3" />
                      {pricingData?.membership?.premium?.maxMembers || 'Unlimited'} members
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-[#24D367] mr-3" />
                      {pricingData?.membership?.premium?.maxClasses || 'Unlimited'} classes
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-[#24D367] mr-3" />
                      {pricingData?.membership?.premium?.storage || '100'}GB storage
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-[#24D367] mr-3" />
                      Custom branding
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-[#24D367] mr-3" />
                      Dedicated support
                    </li>
                  </ul>
                  <Button className="w-full bg-[#278DD4] hover:bg-[#20366B] text-white mt-6">
                    Contact Sales
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#20366B] to-[#278DD4] text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Academy?
          </h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Join hundreds of South African sports academies already using IH Academy to streamline their operations and grow their business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-[#24D367] hover:bg-green-500 text-white px-8 py-4 text-lg">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[#20366B] px-8 py-4 text-lg">
              Schedule a Demo
            </Button>
          </div>
          <p className="text-sm text-blue-200 mt-4">
            No credit card required • 30-day free trial • Cancel anytime
          </p>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-gray-50 text-gray-800 py-16">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img 
                  src="https://itshappening.africa/wp-content/uploads/2024/06/images-1.jpeg" 
                  alt="ItsHappening.Africa" 
                  className="h-8 w-auto"
                />
                <div>
                  <div className="font-bold text-[#20366B]">IH Academy</div>
                  <div className="text-sm text-gray-600">by ItsHappening.Africa</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Professional sports academy management software designed for South African organizations.
              </p>
              <div className="text-sm text-gray-600">
                Part of the ItsHappening.Africa ecosystem
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-[#20366B] mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-gray-600 hover:text-[#278DD4] transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-gray-600 hover:text-[#278DD4] transition-colors">Pricing</a></li>
                <li><a href="/register" className="text-gray-600 hover:text-[#278DD4] transition-colors">Free Trial</a></li>
                <li><a href="#" className="text-gray-600 hover:text-[#278DD4] transition-colors">Mobile App</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-[#20366B] mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="https://itshappening.africa/contact" className="text-gray-600 hover:text-[#278DD4] transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-600 hover:text-[#278DD4] transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-600 hover:text-[#278DD4] transition-colors">System Status</a></li>
                <li><a href="#" className="text-gray-600 hover:text-[#278DD4] transition-colors">API Docs</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-[#20366B] mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="https://itshappening.africa/about" className="text-gray-600 hover:text-[#278DD4] transition-colors">About</a></li>
                <li><a href="https://itshappening.africa" className="text-gray-600 hover:text-[#278DD4] transition-colors">ItsHappening.Africa</a></li>
                <li><a href="#" className="text-gray-600 hover:text-[#278DD4] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-600 hover:text-[#278DD4] transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-300 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-600">
              © 2025 ItsHappening.Africa. All rights reserved.
            </div>
            <div className="text-sm text-gray-600 mt-4 md:mt-0">
              Made with ❤️ in South Africa
            </div>
          </div>
      </footer>

      {/* Demo Video Modal */}
      <Dialog open={showDemoModal} onOpenChange={setShowDemoModal}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-bold text-[#20366B] flex items-center justify-between">
              IH Academy Platform Demo
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDemoModal(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 pt-4">
            <div className="aspect-video bg-gradient-to-br from-[#20366B] to-[#278DD4] rounded-lg overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&modestbranding=1"
                title="IH Academy Platform Demo"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-lg"
              ></iframe>
            </div>
            
            <div className="mt-6 grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-[#20366B] mb-3">What You'll See in This Demo</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-[#24D367] mr-2" />
                    Complete academy setup in minutes
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-[#24D367] mr-2" />
                    Class scheduling and management
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-[#24D367] mr-2" />
                    Member booking and payment flow
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-[#24D367] mr-2" />
                    Coach attendance tracking
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-[#24D367] mr-2" />
                    PayFast payment integration
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-[#20366B] mb-3">Ready to Get Started?</h3>
                <p className="text-gray-600 mb-4">
                  See how easy it is to transform your sports academy with professional management tools.
                </p>
                <div className="space-y-3">
                  <a href="/register" className="w-full">
                    <Button className="w-full bg-[#24D367] hover:bg-green-500 text-white">
                      Start Your Free Trial
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                  <a href="https://itshappening.africa/contact" className="w-full">
                    <Button variant="outline" className="w-full border-[#20366B] text-[#20366B] hover:bg-[#20366B] hover:text-white">
                      Schedule Personal Demo
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}