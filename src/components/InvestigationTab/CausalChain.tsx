import { ArrowRight, Zap } from 'lucide-react';

export function CausalChain({ chain }: { chain: string[] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <Zap size={16} className="text-red-500" />
        <h3 className="font-bold text-sm text-gray-800">Event Propagation Chain</h3>
        <span className="text-xs text-gray-400 ml-auto">How the incident cascaded</span>
      </div>
      <div className="p-6">
        <div className="flex items-center gap-1 flex-wrap justify-center">
          {chain.map((step, i) => {
            const isFirst = i === 0;
            const isLast = i === chain.length - 1;
            return (
              <div key={i} className="flex items-center gap-1">
                <div className={`rounded-lg border-2 px-3 py-2 text-xs font-bold text-center min-w-[120px] ${
                  isFirst
                    ? 'border-red-400 bg-red-50 text-red-700'
                    : isLast
                    ? 'border-amber-400 bg-amber-50 text-amber-700'
                    : 'border-gray-300 bg-gray-50 text-gray-700'
                }`}>
                  {isFirst && <span className="block text-[9px] text-red-500 font-bold mb-0.5">ROOT CAUSE</span>}
                  {step}
                </div>
                {i < chain.length - 1 && <ArrowRight size={16} className="text-gray-400 shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
