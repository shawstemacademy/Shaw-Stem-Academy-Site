import React, { useState, useMemo } from 'react';
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
  ArrowRight,
  Search,
  Filter,
  Layers,
  GraduationCap,
  Calendar,
  DollarSign
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');

  // Extract unique categories and levels from all offered classes
  const categories = useMemo(() => {
    const cats = new Set<string>();
    classes.forEach(c => {
      if (c.category) cats.add(c.category);
    });
    return Array.from(cats);
  }, [classes]);

  const levels = useMemo(() => {
    const lvls = new Set<string>();
    classes.forEach(c => {
      if (c.classType) lvls.add(c.classType);
    });
    return Array.from(lvls);
  }, [classes]);

  const filteredClasses = useMemo(() => {
    return classes.filter(c => {
      const matchesSearch = 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.instructor || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
      const matchesLevel = selectedLevel === 'all' || c.classType === selectedLevel;

      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [classes, searchQuery, selectedCategory, selectedLevel]);

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

      {/* Course Catalog Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Explore Course Offerings</h2>
            <p className="text-sm text-slate-500">
              Browse our complete curriculum of hands-on, high-impact STEM classes.
            </p>
          </div>
          <button
            onClick={onOpenRegistration}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0 self-start sm:self-auto"
          >
            <span>Proceed to Registration</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Search and Filters panel */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search classes by name, description, or instructor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-medium placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-900"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* Category filters */}
            <div className="space-y-1.5 w-full">
              <span className="font-bold text-slate-700 block">Department / Category:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Level / ClassType filters */}
            {levels.length > 0 && (
              <div className="space-y-1.5 w-full pt-1">
                <span className="font-bold text-slate-700 block">Course Level:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedLevel('all')}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                      selectedLevel === 'all'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    All Levels
                  </button>
                  {levels.map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setSelectedLevel(lvl)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                        selectedLevel === lvl
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Classes list */}
        {filteredClasses.length === 0 ? (
          <div className="bg-white border border-slate-200 p-12 rounded-3xl text-center space-y-3">
            <Layers className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">No Courses Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              We couldn't find any courses matching your search keyword or selected filters. Try adjusting your query or resetting filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedLevel('all');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredClasses.map((cls) => (
              <div
                key={cls.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        {cls.category}
                      </span>
                      {cls.classType && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                          {cls.classType}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                      Age {cls.ageGroup}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{cls.title}</h3>
                    <p className="text-xs text-slate-500 font-semibold">Instructor: {cls.instructor}</p>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {cls.description}
                  </p>

                  {cls.prerequisites && (
                    <div className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-100 text-[11px] text-slate-700">
                      <strong className="text-amber-800">Prerequisites:</strong> {cls.prerequisites}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Weekly Schedule</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {cls.schedule}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Tuition Fee</span>
                    <span className="text-base font-extrabold text-blue-600">
                      ${cls.price}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
