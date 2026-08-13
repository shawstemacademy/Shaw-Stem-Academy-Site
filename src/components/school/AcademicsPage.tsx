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
import { TeacherProfile, ClassItem, Department, isDepartmentVisibleToStudents, PortalTab } from '../../types';

interface AcademicsPageProps {
  teachers: TeacherProfile[];
  classes: ClassItem[];
  departments: Department[];
  isLoggedIn: boolean;
  isAccepted: boolean;
  onNavigate: (tab: PortalTab) => void;
  onOpenRegistration?: () => void;
}

export const AcademicsPage: React.FC<AcademicsPageProps> = ({
  teachers = [],
  classes = [],
  departments = [],
  isLoggedIn,
  isAccepted,
  onNavigate,
  onOpenRegistration,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');

  const handleEnrollInDepartment = () => {
    if (!isLoggedIn) {
      onNavigate('admissions');
    } else if (!isAccepted) {
      alert("You have not been accepted yet. Registration and class enrollment are unavailable until your application is approved by the administration. You will be redirected to the Student Portal to check your status.");
      onNavigate('student-portal');
    } else {
      onNavigate('registration');
    }
  };

  const handleProceedToRegistration = () => {
    if (!isLoggedIn) {
      onNavigate('admissions');
    } else if (!isAccepted) {
      alert("You have not been accepted yet. Registration and class enrollment are unavailable until your application is approved by the administration. You will be redirected to the Student Portal to check your status.");
      onNavigate('student-portal');
    } else {
      onNavigate('registration');
    }
  };

  const handleOpenRegistrationForm = () => {
    if (!isLoggedIn) {
      onNavigate('admissions');
    } else if (!isAccepted) {
      alert("You have not been accepted yet. Registration and class enrollment are unavailable until your application is approved by the administration. You will be redirected to the Student Portal to check your status.");
      onNavigate('student-portal');
    } else {
      onNavigate('registration');
    }
  };

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

  // Dynamically synthesize a department for any class category that is missing from the explicit departments collection
  const effectiveDepartments = useMemo(() => {
    const list = [...departments];
    
    // Find all categories from classes
    const classCategories = new Set<string>();
    classes.forEach(c => {
      if (c.category) {
        classCategories.add(c.category);
      }
    });
    
    // For each category, if no department matches (case-insensitive), synthesize a department
    classCategories.forEach(cat => {
      const hasDept = list.some(d => d.name.toLowerCase() === cat.toLowerCase());
      if (!hasDept) {
        let color = 'bg-blue-600';
        let room = 'Lab Room 3';
        const lowerCat = cat.toLowerCase();
        if (lowerCat.includes('physic')) {
          color = 'bg-sky-600';
          room = 'Physics Lab 3';
        } else if (lowerCat.includes('biolog')) {
          color = 'bg-emerald-600';
          room = 'Biology Lab 1';
        } else if (lowerCat.includes('chem')) {
          color = 'bg-cyan-600';
          room = 'Chemistry Lab 2';
        } else if (lowerCat.includes('math')) {
          color = 'bg-indigo-600';
          room = 'Math Seminar 105';
        } else if (lowerCat.includes('tech') || lowerCat.includes('code') || lowerCat.includes('comput')) {
          color = 'bg-teal-600';
          room = 'Computing Studio B';
        }
        
        list.push({
          id: `virtual-dept-${cat.toLowerCase().replace(/\s+/g, '-')}`,
          name: cat,
          code: cat.toUpperCase().slice(0, 4),
          description: `Academy laboratory and curriculum resources focusing on practical, hands-on ${cat} exploration.`,
          headOfDepartment: 'Vacant',
          color: color,
          room: room,
          showToStudents: true
        });
      }
    });
    
    return list;
  }, [departments, classes]);

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

      {/* Course Catalog Section (Explore Course Offerings) */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Explore Course Offerings</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Browse our complete curriculum of hands-on, high-impact STEM classes.
            </p>
          </div>
          {/* Proceed to Registration button removed per user request */}
        </div>

        {/* Search and Filters panel */}
        <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search classes by name, description, or instructor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* Category filters */}
            <div className="space-y-1.5 w-full">
              <span className="font-bold text-slate-700 dark:text-slate-300 block">Department / Category:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
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
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
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
                <span className="font-bold text-slate-700 dark:text-slate-300 block">Course Level:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedLevel('all')}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                      selectedLevel === 'all'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
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
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
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
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 p-12 rounded-3xl text-center space-y-4 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6 text-slate-400 dark:text-slate-500" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">No classes found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                We couldn't find any courses matching your search keyword or selected filters. Try browsing all our active STEM academy course offerings.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedLevel('all');
              }}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 text-xs font-bold rounded-xl transition-all shadow-xs hover:shadow-md"
            >
              Browse All
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredClasses.map((cls) => (
              <div
                key={cls.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40">
                        {cls.category}
                      </span>
                      {cls.classType && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-900/40">
                          {cls.classType}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                      Age {cls.ageGroup}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{cls.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Instructor: {cls.instructor}</p>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {cls.description}
                  </p>

                  {cls.prerequisites && (
                    <div className="p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-[11px] text-slate-700 dark:text-slate-300">
                      <strong className="text-amber-800 dark:text-amber-400">Prerequisites:</strong> {cls.prerequisites}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[9px] tracking-wider block">Weekly Schedule</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      {cls.schedule}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[9px] tracking-wider block">Tuition Fee</span>
                    <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                      ${cls.price}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Academic Departments & Labs */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Academic Departments & Labs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {effectiveDepartments.filter(d => isDepartmentVisibleToStudents(d)).map((dept) => {
            const bgClass = dept.color ? dept.color.replace('600', '50') : 'bg-blue-50';
            const borderClass = dept.color ? dept.color.replace('bg-', 'border-').replace('600', '200') : 'border-blue-200';
            const textClass = dept.color ? dept.color.replace('bg-', 'text-') : 'text-blue-600';
            return (
            <div
              key={dept.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-xl ${bgClass} ${borderClass} border flex items-center justify-center dark:bg-slate-800/40 dark:border-slate-700/50`}>
                    <BookOpen className={`w-6 h-6 ${textClass}`} />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg">
                    {dept.room || 'General Lab'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{dept.name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{dept.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {classes.filter((c) => c.category === dept.name).length} Open Classes
                </span>
                <button
                  onClick={handleEnrollInDepartment}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Faculty & Department Chairs</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Meet our instructors and check their weekly office hours for student mentorship.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teachers.filter((t) => t.status !== 'disabled').map((teacher) => (
            <div
              key={teacher.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col sm:flex-row gap-5"
            >
              <img
                src={teacher.avatar}
                alt={teacher.name}
                className="w-20 h-20 rounded-2xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
              />
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <div className="flex flex-wrap gap-1">
                    {teacher.departmentNames && teacher.departmentNames.length > 0 ? (
                      teacher.departmentNames.map((deptName, idx) => (
                        <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40 whitespace-nowrap">
                          {deptName}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40 whitespace-nowrap">
                        {teacher.department || 'General Faculty'}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {teacher.officeHours}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">{teacher.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{teacher.title}</p>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{teacher.bio}</p>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                  <a
                    href={`mailto:${teacher.email}`}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {teacher.email}
                  </a>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
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
          onClick={handleOpenRegistrationForm}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg whitespace-nowrap"
        >
          Open Registration Form
        </button>
      </div>
    </div>
  );
};
