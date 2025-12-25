import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PasskeyFormProps {
  onSuccess: () => void;
}

const PasskeyForm = ({ onSuccess }: PasskeyFormProps) => {
  const [passkey, setPasskey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Query Supabase for the passkey
    const { data, error } = await supabase
      .from("passkeys")
      .select("key")
      .eq("key", passkey)
      .single();

    if (data && data.key === passkey) {
      localStorage.setItem("invoice-passkey", "authenticated");
      toast({
        title: "Access Granted",
        description: "Welcome to the Invoice Generator",
      });
      onSuccess();
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid passkey. Please try again.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
    setPasskey("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated gradient background with subtle noise */}
      <div className="absolute inset-0 [background-image:var(--gradient-hero)] opacity-90"></div>
      <div className="absolute inset-0 bg-[radial-gradient(1000px_600px_at_30%_-20%,hsl(var(--primary)/0.08),transparent),radial-gradient(800px_500px_at_80%_120%,hsl(var(--primary-glow)/0.08),transparent)]"></div>
      <div className="pointer-events-none absolute inset-0" style={{backgroundImage:'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22 viewBox=%220 0 40 40%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.02%22%3E%3Cpath d=%22M0 39h40v1H0zM39 0h1v40h-1z%22/%3E%3C/g%3E%3C/svg%3E")'}}></div>

      {/* Floating elements for visual appeal */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-primary/10 rounded-full blur-2xl animate-pulse delay-500"></div>

      <div className="relative z-10 p-4 w-full max-w-md">
        <Card className="backdrop-blur-md bg-card/70 border-white/20 shadow-[var(--shadow-elegant)]">
          <CardHeader className="text-center space-y-6 pb-8">
            {/* Enhanced icon with glow effect */}
            <div className="mx-auto relative">
              <div className="w-20 h-20 bg-[radial-gradient(circle_at_30%_30%,hsl(var(--primary-glow)),hsl(var(--primary)))] rounded-2xl flex items-center justify-center shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.6)] ring-4 ring-primary/20">
                <div className="absolute inset-0 rounded-2xl animate-ping bg-primary/15"></div>
                <Lock className="w-9 h-9 text-primary-foreground relative z-10" />
              </div>
              <div className="absolute inset-0 bg-primary/30 rounded-2xl blur-xl"></div>
            </div>
            
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold bg-[conic-gradient(from_180deg_at_50%_50%,hsl(var(--primary)),hsl(var(--primary-glow)),hsl(var(--primary)))] bg-clip-text text-transparent">
                Secure Access
              </CardTitle>
              <CardDescription className="text-muted-foreground/80 text-lg">
                Enter the passkey to access the Invoice Generator
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <Input
                  type="password"
                  placeholder="••••••"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  className="text-center text-xl tracking-[0.5em] font-mono h-14 bg-background/60 border border-white/30 shadow-inner focus:border-primary focus:ring-4 focus:ring-primary/30 rounded-xl transition-[box-shadow,border,transform] duration-300 hover:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)]"
                  autoFocus
                />
                <div className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(120px_40px_at_50%_50%,hsl(var(--primary)/0.06),transparent)]"></div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-semibold bg-[linear-gradient(90deg,hsl(var(--primary))_0%,hsl(var(--primary-glow))_100%)] text-primary-foreground shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.7)] hover:shadow-[0_12px_42px_-10px_hsl(var(--primary)/0.8)] transition-all duration-300 hover:scale-[1.015] disabled:opacity-50 disabled:scale-100 rounded-xl" 
                disabled={isLoading || !passkey}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                    Verifying...
                  </div>
                ) : (
                  "Access System"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PasskeyForm;