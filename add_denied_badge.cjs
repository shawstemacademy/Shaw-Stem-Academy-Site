const fs = require('fs');
const file = 'src/components/school/StudentPortalPage.tsx';
let code = fs.readFileSync(file, 'utf8');

const deniedBadge = `
      case 'denied':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Application Denied</span>
          </span>
        );
`;

code = code.replace("case 'prospective':", deniedBadge + "      case 'prospective':");

fs.writeFileSync(file, code);
