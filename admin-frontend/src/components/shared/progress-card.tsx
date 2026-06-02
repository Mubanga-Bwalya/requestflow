import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function ProgressCard({label,value}:{label:string;value:number}){
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute left-0 top-0 h-1 w-full bg-brand-primary" aria-hidden />
      <CardContent>
        <p className="text-sm text-slate-600">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-brand-dark">{value}%</p>
        <div className="mt-3">
          <Progress value={value}/>
        </div>
      </CardContent>
    </Card>
  );
}

