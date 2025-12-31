'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Apple,
  BarChart3,
  Calendar,
  Star,
  TrendingUp,
  Users,
  Dumbbell,
  Activity,
  Heart,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background overflow-hidden relative">
      {/* Animated background elements - moved to parent */}
      <div className="absolute inset-0 overflow-visible pointer-events-none">
        <div className="absolute top-40 left-10 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-60 right-10 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-80 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32 relative overflow-visible">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-block mb-4 px-4 py-2 bg-gradient-to-r from-green-100 to-purple-100 dark:from-green-900 dark:to-purple-900 text-green-700 dark:text-green-300 rounded-full text-sm font-medium animate-fade-in shadow-lg">
            <span className="inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Join a Community of Health Champions
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-foreground leading-tight animate-slide-up">
            Your Complete
            <span className="block mt-2 bg-gradient-to-r from-green-600 via-purple-600 to-blue-600 dark:from-green-500 dark:via-purple-500 dark:to-blue-500 bg-clip-text text-transparent animate-gradient">
              Health & Wellness Hub
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed animate-slide-up delay-100">
            Track nutrition, monitor vitals, log workouts, and connect with a
            community committed to healthier lifestyles—all in one powerful
            platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up delay-200">
            <Button
              asChild
              size="lg"
              className="text-lg px-8 py-6 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <Link href="/auth">
                <span className="flex items-center gap-2">
                  Start Your Journey
                  <Zap className="w-5 h-5" />
                </span>
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 hover:bg-muted transition-all duration-300 hover:scale-105"
            >
              <Link href="/dashboard">View Live Demo</Link>
            </Button>
          </div>

          {/* Stats Banner */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto animate-fade-in delay-300">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-500 mb-1">
                100+
              </div>
              <div className="text-sm text-muted-foreground">Features</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-500 mb-1">
                24/7
              </div>
              <div className="text-sm text-muted-foreground">Access</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-500 mb-1">
                ∞
              </div>
              <div className="text-sm text-muted-foreground">Possibilities</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Everything for Your Health Journey
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A comprehensive suite of tools designed to empower your wellness
              goals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Nutrition Tracking */}
            <Card className="border-2 hover:border-green-500/50 dark:hover:border-green-500/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group animate-slide-up">
              <CardContent className="pt-8 pb-8 px-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Apple className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">
                  Smart Nutrition Tracking
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Log meals by breakfast, lunch, and dinner. Get detailed macro
                  and micronutrient breakdowns with RDI comparisons.
                </p>
              </CardContent>
            </Card>

            {/* Workout Tracking */}
            <Card className="border-2 hover:border-purple-500/50 dark:hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group animate-slide-up delay-100">
              <CardContent className="pt-8 pb-8 px-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Dumbbell className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">
                  Workout Logger
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Track exercises, sets, reps, and weights. View volume trends
                  and identify your most frequent lifts.
                </p>
              </CardContent>
            </Card>

            {/* Vital Signs */}
            <Card className="border-2 hover:border-red-500/50 dark:hover:border-red-500/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group animate-slide-up delay-200">
              <CardContent className="pt-8 pb-8 px-6">
                <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">
                  Vital Signs Monitoring
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Monitor temperature, pulse, blood pressure, and oxygen
                  saturation. Visualize health trends over time.
                </p>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card className="border-2 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group animate-slide-up delay-300">
              <CardContent className="pt-8 pb-8 px-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">
                  Advanced Analytics
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Visualize trends with interactive charts. Track streaks,
                  averages, and progress toward your health goals.
                </p>
              </CardContent>
            </Card>

            {/* Calendar */}
            <Card className="border-2 hover:border-orange-500/50 dark:hover:border-orange-500/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group animate-slide-up delay-400">
              <CardContent className="pt-8 pb-8 px-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">
                  Calendar View
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Visualize your entire health journey. Review past days and
                  plan ahead with our intuitive calendar.
                </p>
              </CardContent>
            </Card>

            {/* Goals */}
            <Card className="border-2 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group animate-slide-up delay-500">
              <CardContent className="pt-8 pb-8 px-6">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">
                  Personalized Goals
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Set custom nutrition targets based on your lifestyle. Track
                  daily progress and stay accountable.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Community Section - NEW */}
      <section className="container mx-auto px-4 py-20 bg-gradient-to-r from-green-50 via-purple-50 to-blue-50 dark:from-green-950/20 dark:via-purple-950/20 dark:to-blue-950/20 rounded-3xl my-20 animate-fade-in">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full mb-4 shadow-lg">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                Community Driven
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              You're Not Alone on This Journey
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join a supportive community of people committed to building
              healthier habits
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">
                Supportive Environment
              </h3>
              <p className="text-muted-foreground">
                Connect with others who understand your goals and challenges.
                Share wins, learn from setbacks.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">
                Track Together
              </h3>
              <p className="text-muted-foreground">
                See your progress alongside others. Accountability and
                motivation through shared experiences.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">
                Continuous Growth
              </h3>
              <p className="text-muted-foreground">
                Regular updates, new features, and community-requested
                improvements. We evolve together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Stories from Our Community
            </h2>
            <p className="text-xl text-muted-foreground">
              Real people, real transformations, real results
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-slide-up">
              <CardContent className="pt-8 pb-8 px-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400 animate-pulse"
                      style={{ animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  "The workout tracker changed my fitness game! Seeing my volume
                  increase week over week keeps me motivated. Plus tracking my
                  vitals helps me know when to push hard or rest."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center font-bold text-white">
                    SJ
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">
                      Sarah Johnson
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Fitness Enthusiast
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-slide-up delay-100">
              <CardContent className="pt-8 pb-8 px-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400 animate-pulse"
                      style={{ animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  "Finally, everything in one place! I can track my meals,
                  workouts, and vitals all together. The analytics show me
                  patterns I never noticed before."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center font-bold text-white">
                    MC
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">
                      Michael Chen
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Busy Professional
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-slide-up delay-200">
              <CardContent className="pt-8 pb-8 px-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400 animate-pulse"
                      style={{ animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  "As a health science student, I love how comprehensive this
                  is. Nutrition + vitals + workouts = the perfect health
                  tracking ecosystem!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center font-bold text-white">
                    ER
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">
                      Emily Rodriguez
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Health Science Student
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center relative">
          {/* Animated glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-purple-600 to-blue-600 rounded-2xl blur-3xl opacity-20 animate-pulse" />

          <div className="relative bg-gradient-to-r from-green-600 via-purple-600 to-blue-600 dark:from-green-700 dark:via-purple-700 dark:to-blue-700 rounded-2xl p-12 md:p-16 text-white shadow-2xl animate-gradient">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your Health?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join our community of health champions taking control of their
              wellness journey
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-lg px-8 py-6 shadow-xl hover:scale-105 transition-all duration-300"
              >
                <Link href="/auth">
                  <span className="flex items-center gap-2">
                    Start Free Today
                    <Zap className="w-5 h-5" />
                  </span>
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-transparent border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6 hover:scale-105 transition-all duration-300"
              >
                <Link href="/dashboard">Explore Features</Link>
              </Button>
            </div>
            <p className="mt-6 text-sm opacity-75">
              No credit card required • Free forever
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300 dark:text-slate-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Thryve</h3>
              <p className="text-sm leading-relaxed">
                Your personal nutrition companion for a healthier lifestyle.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/dashboard"
                    className="hover:text-white transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="hover:text-white transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="hover:text-white transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 dark:border-slate-900 mt-12 pt-8 text-center text-sm">
            <p>© 2025 Thryve. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
