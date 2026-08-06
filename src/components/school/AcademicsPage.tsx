import React from 'react';
import { 
  Cpu, 
  Code2, 
  Palette, 
  Music, 
  Sparkles, 
  UserCheck, 
  Mail, 
  Clock, 
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { TeacherProfile, ClassItem, Department } from '../../types';

interface AcademicsPageProps {
  teachers: TeacherProfile[];
  classes: ClassItem[];
  departments: Department[];
  onOpenRegistration: () => void;
}

export const AcademicsPage: React.FC<AcademicsPageProps> = ({
  teachers = [],
  classes = [],
  departments = [],
  onOpenRegistration,
}) => {

  return (
    <div className="space-y-12 pb-16">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-500/20">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Curriculum & Laboratories</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Academics & Faculty Directory
        </h1>
        <p className="text-slate-300 max-w-3xl text-sm sm:text-base leading-relaxed">
          Shaw STEM Academy combines rigorous engineering theory with project-based studio work. Our curriculum is taught by industry veterans, researchers, and professional creators.
        </p>
      </div>

      {/* Departments Grid */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Academic Departments & Labs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {departments.map((dept) => {
            const bgClass = dept.color.replace('600', '50');
            const borderClass = dept.color.replace('bg-', 'border-').replace('600', '200');
            const textClass = dept.color.replace('bg-', 'text-');
            return (
            <div
              key={dept.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-xl ${bgClass} ${borderClass} border flex items-center justify-center`}>
                    <BookOpen className={`w-6 h-6 ${textClass}`} />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                    {dept.room || 'General Lab'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">{dept.name}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{dept.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  {classes.filter((c) => c.category === dept.name).length} Open Classes
                </span>
                <button
                  onClick={onOpenRegistration}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <span>Enroll in Department</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )})}
        </div>
      </div>

      {/* Faculty Directory */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Faculty & Department Chairs</h2>
          <p className="text-sm text-slate-500">
            Meet our instructors and check their weekly office hours for student mentorship.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teachers.filter((t) => t.status !== 'disabled').map((teacher) => (
            <div
              key={teacher.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row gap-5"
            >
              <img
                src={teacher.avatar}
                alt={teacher.name}
                className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shrink-0"
              />
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {teacher.department}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {teacher.officeHours}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{teacher.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{teacher.title}</p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{teacher.bio}</p>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <a
                    href={`mailto:${teacher.email}`}
                    className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {teacher.email}
                  </a>
                  <span className="text-[11px] text-slate-400">
                    {(teacher?.assignedClassIds || []).length} Active Course
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Bottom Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-3xl p-8 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-xl font-bold">Ready to enroll in our STEM courses?</h3>
          <p className="text-xs sm:text-sm text-slate-300">
            Use our interactive registration app to configure your class bundle and calculate multi-class discounts.
          </p>
        </div>
        <button
          onClick={onOpenRegistration}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg whitespace-nowrap"
        >
          Open Registration Form
        </button>
      </div>
    </div>
  );
};
