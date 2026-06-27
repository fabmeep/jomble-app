import React from 'react';
import { statusMap } from '@/lib/status';
import CompanyLogo from '@/components/ui/company-logo';

// Define a subset/full shape matching the API response
export interface Lead {
  id: string;
  companyName: string;
  jobTitle: string;
  status: string;
  excitementScore: number | null;
}

interface HotLeadsProps {
  leads?: Lead[];
}

export function HotLeads({ leads }: HotLeadsProps) {
  if (!leads || leads.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg overflow-hidden p-6 text-center text-xs text-muted-foreground">
        No hot leads yet. Keep applying!
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-3.5 px-4.5 border-b border-border flex items-center justify-between">
        <h3 className="text-[13.5px] font-bold">Hottest leads ♥</h3>
        <a href="/applications" className="text-xs text-primary font-semibold hover:underline">See all</a>
      </div>

      {leads.map((lead) => {
        const statusConfig = statusMap[lead.status] || {
          label: lead.status,
          bg: 'bg-secondary',
          text: 'text-foreground',
        };

        return (
          <div className="flex gap-2.5 items-start p-3 px-4 border-b border-border last:border-b-0" key={lead.id}>
            <CompanyLogo companyName={lead.companyName} className="animate-fade-in" />
            <div className="flex-1 min-w-0">
              <h4 className="text-[12.5px] font-bold truncate">{lead.companyName}</h4>
              <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate">{lead.jobTitle}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10.5px] font-semibold before:content-[''] before:w-1 before:h-1 before:rounded-full before:bg-current before:opacity-70 ${statusConfig.bg} ${statusConfig.text}`}
                >
                  {statusConfig.label}
                </span>
                <span className="flex gap-[1px] text-[10px]">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < (lead.excitementScore ?? 0) ? 'text-primary' : 'text-border'}>
                      ♥
                    </span>
                  ))}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
