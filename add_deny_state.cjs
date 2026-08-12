const fs = require('fs');
const file = 'src/components/school/StudentSearchDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

const hookStr = `
  const [denyModal, setDenyModal] = useState<{
    isOpen: boolean;
    studentId: string;
    studentName: string;
    fields: string[];
    reason: string;
  }>({ isOpen: false, studentId: '', studentName: '', fields: [], reason: '' });
`;

code = code.replace('  const [confirmModal, setConfirmModal] = useState<{', hookStr + '\n  const [confirmModal, setConfirmModal] = useState<{');

fs.writeFileSync(file, code);
