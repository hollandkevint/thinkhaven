'use client';

import { Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PathwayDefinition } from '@/lib/pathways';
import { getPathwayIcon } from '@/lib/pathways';

interface PathwayCardProps {
  pathway: PathwayDefinition;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export default function PathwayCard({
  pathway,
  onSelect,
  disabled,
}: PathwayCardProps) {
  const Icon = getPathwayIcon(pathway.icon);

  return (
    <div
      className={`${pathway.bgColor} rounded-2xl shadow border border-ink/8 p-8 pb-7 flex flex-col gap-5 transition-all duration-200 hover:shadow-md active:scale-[0.98]`}
    >
      <Icon className={`w-7 h-7 ${pathway.accentColor}`} />

      <div className="flex flex-col gap-2 flex-1">
        <h3 className="font-display text-[22px] font-medium leading-tight text-ink">
          {pathway.title}
        </h3>
        <p className="font-body text-sm leading-relaxed text-ink-light">
          {pathway.description}
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <Timer className="w-3.5 h-3.5 text-ink-light/70" />
        <span className="font-display text-[13px] text-ink-light/70">
          {pathway.duration}
        </span>
      </div>

      <Button
        onClick={() => onSelect(pathway.id)}
        disabled={disabled}
        className="w-full"
      >
        Start Session
      </Button>
    </div>
  );
}
