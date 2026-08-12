const fs = require('fs');
const file = 'src/components/school/StudentSearchDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

const denyModalStr = `
      {denyModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 shrink-0">
              <h2 className="text-xl font-bold text-slate-900">Deny Student Application</h2>
              <p className="text-sm text-slate-500 mt-1">
                Rejecting <span className="font-semibold text-slate-700">{denyModal.studentName}</span>
              </p>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Invalid Fields <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  {['Invalid Phone Number', 'Invalid Address', 'Incomplete Profile', 'Invalid Document', 'Other'].map(field => (
                    <label key={field} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                        checked={denyModal.fields.includes(field)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDenyModal(prev => ({ ...prev, fields: [...prev.fields, field] }));
                          } else {
                            setDenyModal(prev => ({ ...prev, fields: prev.fields.filter(f => f !== field) }));
                          }
                        }}
                      />
                      <span className="text-sm text-slate-700">{field}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Explanation / Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm min-h-[100px] resize-y"
                  placeholder="Provide a detailed explanation for the denial..."
                  value={denyModal.reason}
                  onChange={(e) => setDenyModal(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-slate-50">
              <button
                onClick={() => setDenyModal({ isOpen: false, studentId: '', studentName: '', fields: [], reason: '' })}
                className="px-4 py-2 font-bold text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (denyModal.fields.length === 0 || !denyModal.reason.trim()) {
                    alert('Please select at least one invalid field and provide a reason.');
                    return;
                  }
                  
                  const student = users.find(u => u.id === denyModal.studentId);
                  if (student) {
                    const updatedUser = {
                      ...student,
                      status: 'denied' as const,
                      deniedFields: denyModal.fields,
                      deniedReason: denyModal.reason
                    };
                    saveDocToFirestore('schoolUsers', student.id, updatedUser);
                    if (selectedStudent?.id === student.id) {
                      setSelectedStudent(updatedUser);
                    }
                    setDenyModal({ isOpen: false, studentId: '', studentName: '', fields: [], reason: '' });
                    alert('Student application has been denied.');
                  }
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors shadow-xs"
              >
                Confirm Denial
              </button>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace('    </div>\n  );\n};', denyModalStr + '\n    </div>\n  );\n};');

fs.writeFileSync(file, code);
