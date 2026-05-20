import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Upload, Link as LinkIcon, FileText, Sparkles, TrendingUp, AlertTriangle, CheckCircle2, Lightbulb, Trash2 } from 'lucide-react';

type ScoreItem = { score: number; comment: string };
type Analysis = {
  id?: string;
  deck_name: string;
  overall_score: number;
  vc_verdict: string;
  summary: string;
  scores: Record<string, ScoreItem>;
  strengths: string[];
  weaknesses: string[];
  improvements: { slide: string; tip: string; priority: 'high' | 'medium' | 'low' }[];
  created_at?: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  problem: 'Problem', solution: 'Solution', market: 'Market Size', traction: 'Traction',
  business_model: 'Business Model', team: 'Team', competition: 'Competition',
  gtm: 'Go-to-Market', product: 'Product', ask: 'The Ask', storytelling: 'Storytelling',
};

const scoreColor = (s: number) => s >= 80 ? 'text-emerald-500' : s >= 60 ? 'text-amber-500' : s >= 40 ? 'text-orange-500' : 'text-red-500';
const scoreBg = (s: number) => s >= 80 ? 'bg-emerald-500' : s >= 60 ? 'bg-amber-500' : s >= 40 ? 'bg-orange-500' : 'bg-red-500';

export default function PitchScan() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<Analysis | null>(null);
  const [history, setHistory] = useState<Analysis[]>([]);

  const loadHistory = async () => {
    if (!user) return;
    const { data } = await supabase.from('pitch_analyses').select('*').order('created_at', { ascending: false }).limit(10);
    if (data) setHistory(data as any);
  };

  useEffect(() => { loadHistory(); }, [user]);

  const fileToBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve((r.result as string).split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

  const runAnalysis = async (payload: { pdfBase64?: string; fileName?: string; sourceUrl?: string }) => {
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('pitch-analyze', { body: payload });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const analysis = data as Analysis;
      if (user) {
        const { data: inserted } = await supabase.from('pitch_analyses').insert({
          user_id: user.id,
          deck_name: analysis.deck_name,
          source_type: payload.sourceUrl ? 'url' : 'upload',
          source_url: payload.sourceUrl,
          overall_score: analysis.overall_score,
          scores: analysis.scores,
          strengths: analysis.strengths,
          weaknesses: analysis.weaknesses,
          improvements: analysis.improvements,
          summary: analysis.summary,
          vc_verdict: analysis.vc_verdict,
        }).select().single();
        if (inserted) analysis.id = inserted.id;
      }
      setResult(analysis);
      loadHistory();
      toast.success(`Scored ${analysis.overall_score}/100 — ${analysis.vc_verdict}`);
    } catch (e: any) {
      toast.error(e.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast.error('PDF too large (max 20MB)'); return; }
    const pdfBase64 = await fileToBase64(file);
    await runAnalysis({ pdfBase64, fileName: file.name });
  };

  const handleUrl = async () => {
    if (!url.trim()) return;
    await runAnalysis({ sourceUrl: url.trim() });
  };

  const deleteAnalysis = async (id: string) => {
    await supabase.from('pitch_analyses').delete().eq('id', id);
    loadHistory();
    if (result?.id === id) setResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">PitchScan</h1>
              <p className="text-xs text-muted-foreground">VC-grade pitch deck analysis</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Upload card */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
          <h2 className="text-2xl font-bold mb-2">Get scored like A16Z, YC & Draper would</h2>
          <p className="text-sm text-muted-foreground mb-6">Upload your deck as PDF or paste a Google Slides / public URL. Get a detailed VC scorecard in under 60 seconds.</p>

          <div className="grid md:grid-cols-2 gap-4">
            <label className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">Upload PDF</p>
              <p className="text-xs text-muted-foreground mt-1">Max 20MB</p>
              <input type="file" accept="application/pdf" className="hidden" onChange={handleFile} disabled={loading} />
            </label>

            <div className="border-2 border-dashed border-border rounded-lg p-6">
              <LinkIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium text-center mb-3">Paste deck URL</p>
              <div className="flex gap-2">
                <Input placeholder="https://docs.google.com/presentation/..." value={url} onChange={(e) => setUrl(e.target.value)} disabled={loading} />
                <Button onClick={handleUrl} disabled={loading || !url.trim()}>Scan</Button>
              </div>
            </div>
          </div>

          {loading && (
            <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4 animate-pulse text-primary" />
              Analyzing your deck slide-by-slide... this can take 30-60 seconds.
            </div>
          )}
        </Card>

        {/* Result */}
        {result && (
          <div className="space-y-6">
            {/* Overall */}
            <Card className="p-8">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="text-center">
                  <div className={`text-7xl font-bold ${scoreColor(result.overall_score)}`}>{result.overall_score}</div>
                  <div className="text-sm text-muted-foreground mt-1">out of 100</div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-2xl font-bold">{result.deck_name}</h2>
                    <Badge variant="secondary" className="text-sm">{result.vc_verdict}</Badge>
                  </div>
                  <p className="text-muted-foreground">{result.summary}</p>
                </div>
              </div>
            </Card>

            {/* Category scorecard */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Scorecard Breakdown</h3>
              <div className="space-y-4">
                {Object.entries(result.scores).map(([key, item]) => (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-medium text-sm">{CATEGORY_LABELS[key] || key}</span>
                      <span className={`text-sm font-bold ${scoreColor(item.score)}`}>{item.score}/100</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${scoreBg(item.score)} transition-all`} style={{ width: `${item.score}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">{item.comment}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Strengths / Weaknesses */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-6">
                <h3 className="font-bold mb-3 flex items-center gap-2 text-emerald-500"><CheckCircle2 className="w-5 h-5" /> Strengths</h3>
                <ul className="space-y-2 text-sm">
                  {result.strengths.map((s, i) => <li key={i} className="flex gap-2"><span className="text-emerald-500 mt-1">●</span><span>{s}</span></li>)}
                </ul>
              </Card>
              <Card className="p-6">
                <h3 className="font-bold mb-3 flex items-center gap-2 text-orange-500"><AlertTriangle className="w-5 h-5" /> Weaknesses</h3>
                <ul className="space-y-2 text-sm">
                  {result.weaknesses.map((w, i) => <li key={i} className="flex gap-2"><span className="text-orange-500 mt-1">●</span><span>{w}</span></li>)}
                </ul>
              </Card>
            </div>

            {/* Improvements */}
            <Card className="p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-amber-500" /> How to Improve</h3>
              <div className="space-y-3">
                {result.improvements.map((imp, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/40">
                    <Badge variant={imp.priority === 'high' ? 'destructive' : imp.priority === 'medium' ? 'default' : 'secondary'} className="h-fit shrink-0">
                      {imp.priority}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{imp.slide}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{imp.tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <Card className="p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2"><FileText className="w-5 h-5" /> Previous Scans</h3>
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/40 cursor-pointer" onClick={() => setResult(h)}>
                  <div className="flex items-center gap-3">
                    <div className={`text-2xl font-bold ${scoreColor(h.overall_score)}`}>{h.overall_score}</div>
                    <div>
                      <p className="font-medium text-sm">{h.deck_name}</p>
                      <p className="text-xs text-muted-foreground">{h.vc_verdict} · {new Date(h.created_at!).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteAnalysis(h.id!); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
