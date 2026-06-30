import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/translations";
import { useGetMySubscription, useSubmitSubscription } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Subscription() {
  const { language } = useAuth();
  const t = useTranslation(language).nav;
  const { toast } = useToast();
  
  const { data: sub, refetch } = useGetMySubscription();
  const submitSub = useSubmitSubscription();

  const [senderName, setSenderName] = useState("");
  const [transferDate, setTransferDate] = useState("");

  const handleSubmit = () => {
    submitSub.mutate({
      data: {
        senderName,
        transferDate,
        bankAccount: "1000123456789"
      }
    }, {
      onSuccess: () => {
        toast({ title: "Receipt submitted successfully" });
        refetch();
      }
    });
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-serif font-bold text-foreground">{t.subscription}</h1>
      
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <h2 className="text-xl font-bold mb-2">Premium Plan</h2>
        <p className="text-primary font-bold text-2xl mb-4">990 ETB / month</p>
        
        <div className="bg-white/50 p-4 rounded-xl mb-6">
          <p className="text-sm text-muted-foreground mb-1">CBE Bank Account</p>
          <p className="font-mono text-lg tracking-wider font-bold text-foreground">1000123456789</p>
        </div>

        {sub?.status === 'pending' ? (
          <div className="bg-secondary/50 p-4 rounded-xl text-center text-secondary-foreground font-medium">
            Your subscription is pending approval.
          </div>
        ) : sub?.status === 'active' ? (
          <div className="bg-green-100 text-green-800 p-4 rounded-xl text-center font-medium">
            Your premium subscription is active!
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Upload Receipt Details</h3>
            <Input placeholder="Sender Name" value={senderName} onChange={e => setSenderName(e.target.value)} />
            <Input type="date" value={transferDate} onChange={e => setTransferDate(e.target.value)} />
            <Button onClick={handleSubmit} disabled={submitSub.isPending || !senderName || !transferDate} className="w-full">
              Submit Payment
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}