import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building2, Briefcase } from "lucide-react";

interface AuthorHoverCardProps {
  name: string;
  designation?: string | null;
  department?: string | null;
  labelDesignation: string;
  labelDepartment: string;
  className?: string;
  showAvatar?: boolean;
}

export function AuthorHoverCard({
  name,
  designation,
  department,
  labelDesignation,
  labelDepartment,
  className = "font-medium text-foreground cursor-default",
  showAvatar = false,
}: AuthorHoverCardProps) {
  const hasInfo = !!(designation || department);

  const trigger = (
    <span className={`${className} ${hasInfo ? "hover:underline decoration-dotted underline-offset-2 cursor-pointer" : ""}`}>
      {showAvatar ? (
        <span className="flex items-center gap-2">
          <Avatar className="w-6 h-6">
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
              {name.substring(0, 2)}
            </AvatarFallback>
          </Avatar>
          {name}
        </span>
      ) : name}
    </span>
  );

  if (!hasInfo) return trigger;

  return (
    <HoverCard openDelay={150} closeDelay={100}>
      <HoverCardTrigger asChild>
        {trigger}
      </HoverCardTrigger>
      <HoverCardContent className="w-56 p-3" side="top" align="start">
        <div className="space-y-2">
          <p className="font-semibold text-sm text-foreground leading-tight">{name}</p>
          {designation && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Briefcase className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary/60" />
              <div>
                <span className="font-medium text-foreground/70 block text-[10px] uppercase tracking-wide mb-0.5">
                  {labelDesignation}
                </span>
                {designation}
              </div>
            </div>
          )}
          {department && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Building2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary/60" />
              <div>
                <span className="font-medium text-foreground/70 block text-[10px] uppercase tracking-wide mb-0.5">
                  {labelDepartment}
                </span>
                {department}
              </div>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
