import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building2, Briefcase, User } from "lucide-react";

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
  const initials = name.trim().substring(0, 2);

  return (
    <HoverCard openDelay={0} closeDelay={0}>
      <HoverCardTrigger asChild>
        <span className={`${className} underline decoration-dotted underline-offset-2 cursor-pointer`}>
          {showAvatar ? (
            <span className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {name}
            </span>
          ) : name}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-56 p-3" side="top" align="start">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <p className="font-semibold text-sm text-foreground leading-tight">{name}</p>
          </div>
          {designation ? (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Briefcase className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary/60" />
              <div>
                <span className="font-medium text-foreground/70 block text-[10px] uppercase tracking-wide mb-0.5">
                  {labelDesignation}
                </span>
                {designation}
              </div>
            </div>
          ) : null}
          {department ? (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Building2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary/60" />
              <div>
                <span className="font-medium text-foreground/70 block text-[10px] uppercase tracking-wide mb-0.5">
                  {labelDepartment}
                </span>
                {department}
              </div>
            </div>
          ) : null}
          {!designation && !department && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="w-3.5 h-3.5 shrink-0 text-primary/60" />
              <span>{name}</span>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
