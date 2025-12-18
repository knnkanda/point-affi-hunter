"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Search, Zap, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";

interface AnalysisResult {
  service_name: string;
  reward: string;
  conditions: string[];
  denial_conditions: string[];
  affiliate_info: { title: string; link: string; snippet: string }[];
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) throw new Error("Analysis failed");

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analysis failed");

      setResult(data);
    } catch (error: any) {
      console.error(error);
      alert(`エラーが発生しました: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16 max-w-4xl flex-grow flex flex-col">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-4 animate-fade-in-up">
            <Zap className="w-3 h-3 mr-2" />
            AI-Powered Affiliate Hunter
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Point-Affi Hunter
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            ポイントサイトの案件をAIで瞬時に分析。<br />隠れたアフィリエイト報酬を発掘しよう。
          </p>
        </div>

        {/* Search Input */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl shadow-2xl mb-12 overflow-hidden ring-1 ring-white/5">
          <CardContent className="p-2">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                type="url"
                placeholder="ポイントサイトのURLを貼り付けてください (例: https://hapitas.jp/...)"
                className="flex-grow h-14 bg-slate-950/50 border-slate-700/50 text-lg text-slate-100 px-6 rounded-xl focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all placeholder:text-slate-600"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <Button
                type="submit"
                disabled={loading}
                className="h-14 px-8 text-lg font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "分析する"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Main Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-slate-200">ポイントサイト案件情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">{result.service_name}</h3>
                    <div className="text-3xl font-extrabold text-emerald-400">{result.reward}</div>
                  </div>

                  <div className="space-y-3 pt-4">
                    <div>
                      <h4 className="flex items-center text-sm font-semibold text-slate-400 mb-2">
                        <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" />
                        獲得条件
                      </h4>
                      <ul className="space-y-1 pl-6">
                        {result.conditions.map((c, i) => (
                          <li key={i} className="text-sm text-slate-300 list-disc">{c}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="flex items-center text-sm font-semibold text-slate-400 mb-2">
                        <AlertCircle className="w-4 h-4 mr-2 text-rose-500" />
                        却下条件
                      </h4>
                      <ul className="space-y-1 pl-6">
                        {result.denial_conditions.map((c, i) => (
                          <li key={i} className="text-sm text-slate-400 list-disc">{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-slate-200 flex items-center justify-between">
                    <span>ASP逆引き検索</span>
                    <Search className="w-4 h-4 text-slate-500" />
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    案件名で検索されたアフィリエイト情報
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.affiliate_info.length > 0 ? (
                    <div className="space-y-3">
                      {result.affiliate_info.map((info, i) => (
                        <div key={i} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-colors group">
                          <a href={info.link} target="_blank" rel="noopener noreferrer" className="block">
                            <h4 className="font-semibold text-indigo-400 group-hover:text-indigo-300 mb-1 flex items-center">
                              {info.title}
                              <ExternalLink className="w-3 h-3 ml-2 opacity-50" />
                            </h4>
                            <p className="text-xs text-slate-500 line-clamp-2">{info.snippet}</p>
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      ASP情報が見つかりませんでした。
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
