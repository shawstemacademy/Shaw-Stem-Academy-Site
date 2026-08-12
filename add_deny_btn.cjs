const fs = require('fs');
const file = 'src/components/school/StudentSearchDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

const btnStr = `
                    <button
                      onClick={() => {
                        if (selectedStudent) {
                          setDenyModal({
                            isOpen: true,
                            studentId: selectedStudent.id,
                            studentName: selectedStudent.name || 'Student',
                            fields: [],
                            reason: ''
                          });
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl font-bold transition-all border border-rose-200 shadow-xs"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Deny Student</span>
                    </button>
`;

code = code.replace('<span>Waitlist Student</span>\n                    </button>', '<span>Waitlist Student</span>\n                    </button>' + '\n' + btnStr);

fs.writeFileSync(file, code);
