import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, FileText, ArrowRight, Brain, Shield, Zap, Users, Award, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Advanced AI models trained on regulatory compliance and financial documentation',
      color: 'text-blue-600'
    },
    {
      icon: Shield,
      title: 'Regulatory Compliance',
      description: 'Stay compliant with HK Listing Rules, Takeovers Code, and international standards',
      color: 'text-green-600'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Generate comprehensive IPO prospectus documents in minutes, not weeks',
      color: 'text-yellow-600'
    },
    {
      icon: FileText,
      title: 'Professional Documents',
      description: 'Create institutional-grade documentation with our advanced drafting tools',
      color: 'text-purple-600'
    }
  ];

  const stats = [
    { label: 'Documents Generated', value: '2,500+', icon: FileText },
    { label: 'Satisfied Clients', value: '500+', icon: Users },
    { label: 'Success Rate', value: '98%', icon: Award },
    { label: 'Time Saved', value: '85%', icon: TrendingUp },
  ];

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Welcome to SmartFinAI
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          Your intelligent assistant for regulatory compliance and IPO prospectus drafting. 
          Streamline your financial documentation with AI-powered precision and regulatory expertise.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link to="/chat">
              <MessageSquare className="h-5 w-5 mr-2" />
              Start Chatting
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/ipo-prospectus">
              <FileText className="h-5 w-5 mr-2" />
              Create IPO Prospectus
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, index) => (
          <Card key={index} className="text-center">
            <CardContent className="pt-6">
              <stat.icon className="h-8 w-8 mx-auto mb-4 text-primary" />
              <div className="text-3xl font-bold text-foreground mb-2">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features Section */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-8">Why Choose SmartFinAI?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Getting Started Section */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Ready to Get Started?</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join thousands of financial professionals who trust SmartFinAI for their regulatory 
            compliance and documentation needs. Experience the future of financial AI today.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/chat">
                Get Started Now
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Updates */}
      <div className="mt-12">
        <h3 className="text-2xl font-bold mb-6">Platform Updates</h3>
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                <div>
                  <h4 className="font-semibold">Enhanced IPO Prospectus Generation</h4>
                  <p className="text-sm text-muted-foreground">Improved AI models for more accurate and comprehensive prospectus drafting</p>
                  <span className="text-xs text-muted-foreground">2 days ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                <div>
                  <h4 className="font-semibold">New Regulatory Compliance Features</h4>
                  <p className="text-sm text-muted-foreground">Added support for latest HK Listing Rules updates and SFC guidelines</p>
                  <span className="text-xs text-muted-foreground">1 week ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
                <div>
                  <h4 className="font-semibold">Improved Chat Interface</h4>
                  <p className="text-sm text-muted-foreground">Enhanced user experience with faster responses and better context understanding</p>
                  <span className="text-xs text-muted-foreground">2 weeks ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;