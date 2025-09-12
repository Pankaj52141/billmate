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
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-accent/10 via-transparent to-primary/15"></div>
      
      {/* Floating elements for visual appeal */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-primary/5 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-secondary/8 rounded-full blur-2xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-accent/6 rounded-full blur-lg animate-pulse delay-500"></div>
      
      <div className="relative z-10 p-4 w-full max-w-md">
        <Card className="backdrop-blur-sm bg-card/80 border-border/50 shadow-2xl animate-fade-in">
          <CardHeader className="text-center space-y-6 pb-8">
            {/* Enhanced icon with glow effect */}
            <div className="mx-auto relative">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-2xl animate-scale-in">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                <Lock className="w-10 h-10 text-primary-foreground relative z-10" />
              </div>
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl"></div>
            </div>
            
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
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
                  className="text-center text-xl tracking-[0.5em] font-mono h-14 bg-background/50 border-2 border-border/50 focus:border-primary/50 focus:ring-4 focus:ring-primary/20 transition-all duration-300"
                  autoFocus
                />
                <div className="absolute inset-0 rounded-md bg-gradient-to-r from-primary/5 to-secondary/5 pointer-events-none"></div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:scale-100" 
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