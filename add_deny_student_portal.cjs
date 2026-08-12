const fs = require('fs');
const file = 'src/components/school/StudentPortalPage.tsx';
let code = fs.readFileSync(file, 'utf8');

const bannerStr = `
      {status === 'denied' && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 sm:p-8 flex items-start gap-4 shadow-sm relative overflow-hidden animate-fade-in">
          <XCircle className="w-8 h-8 text-rose-500 shrink-0 mt-0.5" />
          <div className="space-y-3 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 text-xs font-bold uppercase tracking-wider border border-rose-500/20">
              <XCircle className="w-3.5 h-3.5" />
              <span>Application Denied</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-rose-900 tracking-tight">
              Registration Application Denied
            </h2>
            <p className="text-xs sm:text-sm text-rose-800 leading-relaxed font-medium max-w-2xl">
              Unfortunately, your application to Shaw STEM Academy has been denied for the following reasons. Please address these issues before re-applying.
            </p>
            
            <div className="bg-white/60 p-4 rounded-xl border border-rose-200 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider mb-1.5">Invalid Fields</h4>
                <ul className="list-disc list-inside text-sm text-rose-700 space-y-1 font-medium">
                  {(studentUser?.deniedFields || []).map((field: string, idx: number) => (
                    <li key={idx}>{field}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider mb-1.5">Reason for Denial</h4>
                <p className="text-sm text-rose-800 whitespace-pre-wrap">{studentUser?.deniedReason || 'No reason provided.'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace("{/* 2. NOTIFICATION BANNER: PENDING VERIFICATION */}", bannerStr + '\n\n      {/* 2. NOTIFICATION BANNER: PENDING VERIFICATION */}');

fs.writeFileSync(file, code);
