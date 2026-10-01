import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PasskeyFormProps {
  onSuccess: () => void;
}

const PasskeyForm = ({ onSuccess }: PasskeyFormProps) => {
  const [passkey, setPasskey] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkey.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("passkeys")
        .select("key")
        .eq("key", passkey)
        .single();

      if (error || !data) {
        toast({
          title: "Access Denied",
          description: "Invalid passkey. Please try again.",
          variant: "destructive",
        });
      } else {
        localStorage.setItem("invoice-passkey", "authenticated");
        onSuccess();
      }
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center p-4">
      <div className="glass-card-strong rounded-3xl p-8 md:p-10 w-full max-w-sm animate-slide-up">
        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Lock className="h-7 w-7 text-primary" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-center text-foreground mb-1">
          BillMate
        </h1>
        <p className="text-muted-foreground text-center text-sm mb-8">
          Enter your passkey to continue
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="passkey" className="text-sm font-medium">
              Passkey
            </Label>
            <Input
              id="passkey"
              type="password"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              placeholder="Enter your passkey"
              className="h-12 rounded-xl glass-input text-base px-4"
              autoComplete="current-password"
              autoFocus
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !passkey.trim()}
            className="w-full h-12 rounded-xl bg-primary text-white font-medium text-base hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 mr-2" />
                Access System
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-[11px] text-muted-foreground mt-6">
          Protected by secure authentication
        </p>
      </div>
    </div>
  );
};

export default PasskeyForm;