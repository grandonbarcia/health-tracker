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
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-4 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            🎉 Your Personal Nutrition Coach
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-slate-900 leading-tight">
            Track Your Nutrition,
            <span className="text-green-600"> Transform Your Health</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Make informed decisions about your diet with powerful nutrient
            tracking, meal analysis, and personalized insights.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="text-lg px-8 py-6 bg-green-600 hover:bg-green-700"
            >
              <Link href="/dashboard">Get Started Free</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6"
            >
              <Link href="/dashboard">View Demo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Powerful features designed to help you understand and improve your
              nutrition
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-green-200 transition-all hover:shadow-lg">
              <CardContent className="pt-8 pb-8 px-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Apple className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">
                  Smart Food Tracking
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Log meals organized by breakfast, lunch, and dinner with our
                  intuitive interface. Never lose track of what you eat.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-green-200 transition-all hover:shadow-lg">
              <CardContent className="pt-8 pb-8 px-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">
                  Nutrient Analysis
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Get detailed breakdowns of macros, vitamins, and minerals.
                  Compare your intake against recommended daily values.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-green-200 transition-all hover:shadow-lg">
              <CardContent className="pt-8 pb-8 px-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">
                  Calendar View
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Visualize your nutrition journey over time. Identify patterns
                  and track your progress with an elegant calendar interface.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-green-200 transition-all hover:shadow-lg">
              <CardContent className="pt-8 pb-8 px-6">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">
                  Progress Tracking
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Monitor your daily, weekly, and monthly nutrition trends. See
                  how your habits improve over time.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-green-200 transition-all hover:shadow-lg">
              <CardContent className="pt-8 pb-8 px-6">
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-pink-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">
                  Personal Account
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Keep your data secure with user authentication. Access your
                  nutrition history from any device.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-green-200 transition-all hover:shadow-lg">
              <CardContent className="pt-8 pb-8 px-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">
                  Data Insights
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Get actionable insights about your eating habits. Understand
                  which nutrients you're getting enough of—or not.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">
              Loved by Health-Conscious Users
            </h2>
            <p className="text-xl text-slate-600">
              See what people are saying about Health Tracker
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white">
              <CardContent className="pt-8 pb-8 px-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  "This app has completely changed how I think about food. The
                  nutrient breakdowns are eye-opening and helped me fix my
                  diet."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center font-bold text-green-700">
                    SJ
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      Sarah Johnson
                    </div>
                    <div className="text-sm text-slate-500">
                      Fitness Enthusiast
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="pt-8 pb-8 px-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  "Finally, a nutrition tracker that's simple and doesn't
                  overwhelm you. The meal grouping feature makes logging so much
                  easier."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700">
                    MC
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      Michael Chen
                    </div>
                    <div className="text-sm text-slate-500">
                      Busy Professional
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="pt-8 pb-8 px-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  "I love the calendar view! Being able to see my nutrition
                  history at a glance keeps me motivated and accountable."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-700">
                    ER
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      Emily Rodriguez
                    </div>
                    <div className="text-sm text-slate-500">
                      Nutrition Student
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
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-12 md:p-16 text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Health?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users who are taking control of their nutrition
          </p>
          <Button
            asChild
            size="lg"
            className="bg-white text-green-700 hover:bg-slate-100 text-lg px-8 py-6"
          >
            <Link href="/dashboard">Start Tracking Today</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">
                Health Tracker
              </h3>
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

          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-sm">
            <p>© 2025 Health Tracker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
