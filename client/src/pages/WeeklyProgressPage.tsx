import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Search, TrendingUp, TrendingDown, Calendar, Users, RefreshCw, Target, ExternalLink, Upload, Download, AlertTriangle } from "lucide-react";
import { useState, useRef } from "react";
import { Link } from "wouter";

interface WeeklyProgressData {
  student: {
    name: string;
    leetcodeUsername: string;
    leetcodeProfileLink: string;
  };
  weeklyData: {
    week1: number;
    week2: number;
    week3: number;
    week4: number;
    week5: number;
    currentWeekScore: number;
    lastWeekToCurrentIncrement: number; // New increment column
  };
  progressIncrements: {
    week2Progress: number;
    week3Progress: number;
    week4Progress: number;
    week5Progress: number;
  };
  realTimeData: {
    currentSolved: number;
    newIncrement: number;
    lastUpdated: string;
  };
  summary: {
    totalScore: number;
    averageWeeklyGrowth: number;
  };
}

export default function WeeklyProgressPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: weeklyData, isLoading, error, refetch } = useQuery<WeeklyProgressData[]>({
    queryKey: ['/api/weekly-progress'],
  });

  // Remove students with zero questions mutation
  const removeZeroStudentsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/cleanup/remove-zero-students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to remove students");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Students Removed",
        description: `Successfully removed ${data.removedCount} students with zero questions solved`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-progress'] });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to remove students with zero questions",
        variant: "destructive",
      });
    },
  });

  // Import CSV data mutation
  const importCSVMutation = useMutation({
    mutationFn: async (csvData: any[]) => {
      const response = await fetch("/api/import/weekly-progress-csv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ csvData }),
      });
      if (!response.ok) throw new Error("Failed to import CSV");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "CSV Import Successful",
        description: `${data.stats.imported} imported, ${data.stats.updated} updated`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-progress'] });
      refetch();
      setIsImporting(false);
    },
    onError: (error: any) => {
      toast({
        title: "CSV Import Failed",
        description: "Failed to import CSV data",
        variant: "destructive",
      });
      setIsImporting(false);
    },
  });

  // Handle CSV file upload
  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        
        // Parse CSV with proper header mapping for the weekly progress format
        const csvData = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          const rowData: any = {};
          
          // Map each value to its corresponding header
          headers.forEach((header, index) => {
            rowData[header] = values[index] || '';
          });
          
          return rowData;
        }).filter(row => row['Name'] && row['LeetCode Username']);

        if (csvData.length === 0) {
          toast({
            title: "Invalid CSV",
            description: "No valid data found in CSV file",
            variant: "destructive",
          });
          return;
        }

        setIsImporting(true);
        importCSVMutation.mutate(csvData);
      } catch (error) {
        toast({
          title: "CSV Parse Error",
          description: "Failed to parse CSV file",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const filteredData = weeklyData?.filter(progress =>
    progress.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    progress.student.leetcodeUsername.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Calculate summary stats
  const summaryStats = weeklyData ? {
    totalStudents: weeklyData.length,
    totalProblems: weeklyData.reduce((sum, p) => sum + p.realTimeData.currentSolved, 0),
    averageProblems: Math.round(weeklyData.reduce((sum, p) => sum + p.realTimeData.currentSolved, 0) / weeklyData.length),
    improving: weeklyData.filter(p => p.summary.averageWeeklyGrowth > 0).length,
    declining: weeklyData.filter(p => p.summary.averageWeeklyGrowth < 0).length
  } : null;

  if (error) {
    return (
      <div className="flex-1 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error loading weekly progress</h3>
          <p className="text-red-600 text-sm mt-1">Failed to load weekly progress data.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-slate-200 rounded-2xl loading-shimmer"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-slate-200 rounded-xl loading-shimmer"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 rounded-xl loading-shimmer"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!weeklyData || weeklyData.length === 0) {
    return (
      <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative px-6 py-16">
            <div className="text-center animate-fade-in">
              <div className="mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm mx-auto">
                  <Calendar className="text-white" size={32} />
                </div>
              </div>
              <h1 className="text-5xl font-bold text-white mb-4">Weekly Progress</h1>
              <p className="text-white/90 text-xl max-w-2xl mx-auto">
                No weekly progress data available yet
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative px-6 py-16">
          <div className="flex justify-between items-center animate-fade-in">
            <div>
              <div className="mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Calendar className="text-white" size={32} />
                </div>
              </div>
              <h1 className="text-5xl font-bold text-white mb-4">Weekly Progress Tracking</h1>
              <p className="text-white/90 text-xl max-w-2xl">
                Monitor student performance and improvement trends week by week
              </p>
              <div className="text-white/80 text-sm mt-2">
                Analyzing {summaryStats?.totalStudents} students with {summaryStats?.totalProblems} problems solved this week
              </div>
            </div>
            
            <div className="flex gap-3 animate-slide-in-right">
              {/* CSV Import Button */}
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting || importCSVMutation.isPending}
                className="bg-emerald-500 hover:bg-emerald-600 text-white border-0"
              >
                <Upload className="mr-2 h-4 w-4" />
                {isImporting ? "Importing..." : "Import CSV"}
              </Button>
              

              
              <Button 
                onClick={() => refetch()}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                variant="outline"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Data
              </Button>
              
              {/* Hidden file input for CSV upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8 -mt-8">
        {/* Summary Stats */}
        {summaryStats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card className="modern-card hover-lift bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-0 shadow-xl animate-fade-in">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 mx-auto mb-3 text-blue-500" />
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{summaryStats.totalStudents}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Active Students</p>
              </CardContent>
            </Card>

            <Card className="modern-card hover-lift bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-0 shadow-xl animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <CardContent className="p-6 text-center">
                <Target className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{summaryStats.totalProblems}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Problems</p>
              </CardContent>
            </Card>

            <Card className="modern-card hover-lift bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border-0 shadow-xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <CardContent className="p-6 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-cyan-500" />
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{summaryStats.averageProblems}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Average per Student</p>
              </CardContent>
            </Card>

            <Card className="modern-card hover-lift bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-0 shadow-xl animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{summaryStats.improving}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Improving</p>
              </CardContent>
            </Card>

            <Card className="modern-card hover-lift bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-0 shadow-xl animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <CardContent className="p-6 text-center">
                <TrendingDown className="h-12 w-12 mx-auto mb-3 text-red-500" />
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{summaryStats.declining}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Need Support</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Weekly Increment Leaderboard */}
        {weeklyData && (
          <Card className="modern-card bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-0 shadow-xl animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                Weekly Increment Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {weeklyData
                  .sort((a, b) => (b.weeklyData.lastWeekToCurrentIncrement || 0) - (a.weeklyData.lastWeekToCurrentIncrement || 0))
                  .slice(0, 10)
                  .map((progress, index) => (
                    <div key={progress.student.leetcodeUsername} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-orange-600 text-white' :
                          'bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                        }`}>
                          #{index + 1}
                        </div>
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-gradient-primary text-white font-semibold text-xs">
                            {progress.student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium text-sm text-slate-900 dark:text-white">{progress.student.name}</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400">@{progress.student.leetcodeUsername}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          +{progress.weeklyData.lastWeekToCurrentIncrement || 0}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">This Week</div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weekly Progress List */}
        <Card className="modern-card border-0 shadow-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm animate-fade-in">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/30 rounded-t-2xl border-b border-cyan-200 dark:border-cyan-800">
            <CardTitle className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              Weekly Performance Overview
              <Badge className="ml-auto bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300">
                {filteredData.length} students
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search students by name or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 text-lg bg-white dark:bg-slate-800 border-0 shadow-lg rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredData.map((progress, index) => (
                <Card 
                  key={progress.student.leetcodeUsername}
                  className="hover:shadow-lg transition-all duration-300 animate-slide-up border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gradient-primary text-white font-semibold text-sm">
                            {progress.student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-sm text-slate-900 dark:text-white leading-tight">{progress.student.name}</h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400">@{progress.student.leetcodeUsername}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-900 dark:text-white">{progress.realTimeData.currentSolved}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Total</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <div className={`text-sm font-bold ${
                          progress.summary.averageWeeklyGrowth > 0 ? 'text-emerald-600 dark:text-emerald-400' :
                          progress.summary.averageWeeklyGrowth < 0 ? 'text-red-600 dark:text-red-400' :
                          'text-slate-600 dark:text-slate-400'
                        }`}>
                          {progress.summary.averageWeeklyGrowth > 0 ? '+' : ''}{progress.summary.averageWeeklyGrowth}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Avg Growth</div>
                      </div>
                      <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                        <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          +{progress.weeklyData.lastWeekToCurrentIncrement || 0}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Weekly +</div>
                      </div>
                      <div className="text-center p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <div className="text-sm font-bold text-orange-600 dark:text-orange-400">{progress.realTimeData.newIncrement}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">New Progress</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-1 mb-3">
                      <div className="text-center p-1 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <div className="text-xs font-semibold text-blue-700 dark:text-blue-300">{progress.weeklyData.week1}</div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">W1</div>
                      </div>
                      <div className="text-center p-1 bg-green-50 dark:bg-green-900/20 rounded">
                        <div className="text-xs font-semibold text-green-700 dark:text-green-300">{progress.weeklyData.week2}</div>
                        <div className="text-xs text-green-600 dark:text-green-400">W2</div>
                      </div>
                      <div className="text-center p-1 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                        <div className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">{progress.weeklyData.week3}</div>
                        <div className="text-xs text-yellow-600 dark:text-yellow-400">W3</div>
                      </div>
                      <div className="text-center p-1 bg-purple-50 dark:bg-purple-900/20 rounded">
                        <div className="text-xs font-semibold text-purple-700 dark:text-purple-300">{progress.weeklyData.week4}</div>
                        <div className="text-xs text-purple-600 dark:text-purple-400">W4</div>
                      </div>
                      <div className="text-center p-1 bg-indigo-50 dark:bg-indigo-900/20 rounded">
                        <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">{progress.weeklyData.week5}</div>
                        <div className="text-xs text-indigo-600 dark:text-indigo-400">W5</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Link href={`/student/${progress.student.leetcodeUsername}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full text-xs">
                          View Profile
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" className="text-xs" asChild>
                        <a href={progress.student.leetcodeProfileLink} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                    
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                      Updated: {progress.realTimeData.lastUpdated}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredData.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 mx-auto text-slate-400 mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-400 mb-2">No progress data found</h3>
                <p className="text-slate-500 dark:text-slate-500">
                  {searchTerm ? 'Try adjusting your search criteria' : 'No weekly progress data available yet'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}