import React, { useState } from 'react';
import { StudentInfo, FormTheme } from '../types';
import { User, Mail, Phone, GraduationCap, Upload, MapPin, Calendar, Heart, Shield, HelpCircle, Users } from 'lucide-react';
import { ImageUploadInput } from './common/ImageUploadInput';

const calculateAge = (dobString: string): string => {
  if (!dobString) return '';
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? String(age) : '';
};

interface StudentInfoFormProps {
  studentInfo: StudentInfo;
  onChange: (field: keyof StudentInfo, value: any) => void;
  theme: FormTheme;
  isSiblingSelected: boolean;
  setIsSiblingSelected: (v: boolean) => void;
  siblingDiscountAmount: number;
  formGrades?: string[];
}

export const StudentInfoForm: React.FC<StudentInfoFormProps> = ({
  studentInfo,
  onChange,
  theme,
  isSiblingSelected,
  setIsSiblingSelected,
  siblingDiscountAmount,
  formGrades,
}) => {
  const [photoPreview, setPhotoPreview] = useState<string>(studentInfo.photoUrl || '');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoPreview(result);
        onChange('photoUrl', result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 mb-6">
      {/* Primary Section: Email & Basic Student Information */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden transition-all">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-4 h-4 text-purple-600" />
            1. Student Information
          </h2>
          <span className="text-xs font-semibold text-red-500">* Indicates required question</span>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-xs text-gray-500">This section contains questions based upon the student</p>

          {/* Email field (PDF Question 1) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                id="student-email"
                type="email"
                required
                value={studentInfo.email || ''}
                onChange={(e) => {
                  onChange('email', e.target.value);
                  onChange('parentEmail', e.target.value);
                }}
                placeholder="Your primary email address"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* First Name, Middle Name, Last Name (PDF Questions 2, 3, 4) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                2. First Name <span className="text-red-500">*</span>
              </label>
              <input
                id="student-firstname"
                type="text"
                required
                value={studentInfo.firstName || ''}
                onChange={(e) => {
                  onChange('firstName', e.target.value);
                  onChange('studentName', `${e.target.value} ${studentInfo.lastName || ''}`.trim());
                }}
                placeholder="First Name"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                3. Middle Name <span className="text-red-500">*</span>
              </label>
              <input
                id="student-middlename"
                type="text"
                required
                value={studentInfo.middleName || ''}
                onChange={(e) => onChange('middleName', e.target.value)}
                placeholder="Middle Name"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                4. Last Name <span className="text-red-500">*</span>
              </label>
              <input
                id="student-lastname"
                type="text"
                required
                value={studentInfo.lastName || ''}
                onChange={(e) => {
                  onChange('lastName', e.target.value);
                  onChange('studentName', `${studentInfo.firstName || ''} ${e.target.value}`.trim());
                }}
                placeholder="Last Name"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Form/Grade & Current School (PDF Questions 5, 6) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                5. Form/Grade <span className="text-red-500">*</span>
              </label>
              <select
                id="student-grade"
                required
                value={studentInfo.formGrade || studentInfo.gradeLevel || ''}
                onChange={(e) => {
                  onChange('formGrade', e.target.value);
                  onChange('gradeLevel', e.target.value);
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden bg-white"
              >
                <option value="">Select Form/Grade</option>
                {(formGrades && formGrades.length > 0
                  ? formGrades
                  : ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Grade 13', 'Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'CAPE Unit 1', 'CAPE Unit 2']
                ).map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                6. Current School <span className="text-red-500">*</span>
              </label>
              <input
                id="student-school"
                type="text"
                required
                value={studentInfo.currentSchool || ''}
                onChange={(e) => onChange('currentSchool', e.target.value)}
                placeholder="e.g. Campion College / Ardenne High"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Age & Date of Birth (PDF Questions 7, 8) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                8. Date of Birth <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  id="student-dob"
                  type="date"
                  required
                  value={studentInfo.dateOfBirth || ''}
                  onChange={(e) => {
                    const dobVal = e.target.value;
                    onChange('dateOfBirth', dobVal);
                    const calculatedAge = calculateAge(dobVal);
                    onChange('age', calculatedAge);
                    onChange('studentAge', calculatedAge);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                7. Age <span className="text-gray-400 font-normal">(Auto-calculated)</span>
              </label>
              <div className="w-full px-3 py-2 text-sm border border-gray-300 bg-gray-50 text-gray-700 rounded-lg min-h-[38px] flex items-center font-medium">
                {studentInfo.dateOfBirth ? `${calculateAge(studentInfo.dateOfBirth)} years old` : 'Enter Date of Birth'}
              </div>
            </div>
          </div>

          {/* Cell phone Number & Home phone number (PDF Questions 9, 10) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                9. Cell phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  id="student-cellphone"
                  type="tel"
                  required
                  value={studentInfo.cellPhone || studentInfo.parentPhone || ''}
                  onChange={(e) => {
                    onChange('cellPhone', e.target.value);
                    onChange('parentPhone', e.target.value);
                  }}
                  placeholder="Cell phone number"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                10. Home phone number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  id="student-homephone"
                  type="tel"
                  required
                  value={studentInfo.homePhone || ''}
                  onChange={(e) => onChange('homePhone', e.target.value)}
                  placeholder="Home phone number"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Identification Photo Upload (PDF Question 11) */}
          <div id="student-photo-section" className="p-4 bg-purple-50/50 border border-purple-100 rounded-xl">
            <ImageUploadInput
              label="11. Student Identification Picture / Photo *"
              description="Please provide a picture of yourself for identification. Your identity will be kept anonymous."
              value={studentInfo.photoUrl || ''}
              onChange={(photo) => {
                setPhotoPreview(photo);
                onChange('photoUrl', photo);
              }}
              placeholder="Upload photo file from device..."
              aspectRatio="square"
            />
          </div>

          {/* Address & Gmail address (PDF Questions 12, 13) */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                12. Address
              </label>
              <textarea
                rows={2}
                value={studentInfo.address || ''}
                onChange={(e) => onChange('address', e.target.value)}
                placeholder="Full residential address"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Gender (PDF Question 14) */}
          <div id="student-gender-section" className="space-y-2 pt-2 border-t border-gray-100">
            <label className="block text-xs font-semibold text-gray-700">
              14. Gender <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="Female"
                  checked={studentInfo.gender === 'Female'}
                  onChange={() => onChange('gender', 'Female')}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <span>Female</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="Male"
                  checked={studentInfo.gender === 'Male'}
                  onChange={() => onChange('gender', 'Male')}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <span>Male</span>
              </label>
            </div>
          </div>

          {/* Who do you currently live with? (PDF Question 15) */}
          <div id="student-liveswith-section" className="space-y-2 pt-2 border-t border-gray-100">
            <label className="block text-xs font-semibold text-gray-700">
              15. Who do you currently live with? <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              <label className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between text-xs font-bold transition-all ${
                studentInfo.livesWith === 'Parent' ? 'border-purple-500 bg-purple-50 text-purple-900 ring-2 ring-purple-200' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="livesWith"
                    value="Parent"
                    checked={studentInfo.livesWith === 'Parent'}
                    onChange={() => onChange('livesWith', 'Parent')}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span>Parent</span>
                </div>
                <span className="text-[11px] font-normal text-gray-500 ml-2">(Fills Parent Information)</span>
              </label>

              <label className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between text-xs font-bold transition-all ${
                studentInfo.livesWith === 'Guardian' ? 'border-purple-500 bg-purple-50 text-purple-900 ring-2 ring-purple-200' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="livesWith"
                    value="Guardian"
                    checked={studentInfo.livesWith === 'Guardian'}
                    onChange={() => onChange('livesWith', 'Guardian')}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span>Guardian</span>
                </div>
                <span className="text-[11px] font-normal text-gray-500 ml-2">(Fills Guardian Information)</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Parent Information Section (PDF Questions 16-31) */}
      {(studentInfo.livesWith === 'Parent' || !studentInfo.livesWith) && (
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden transition-all">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">Parent Information</h2>
            <p className="text-xs text-gray-500">This section should be filled out where applicable (all fields are optional)</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Mother's Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-purple-900 border-b border-purple-100 pb-2">Mother's Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">16. First Name</label>
                  <input
                    type="text"
                    value={studentInfo.motherFirstName || ''}
                    onChange={(e) => {
                      onChange('motherFirstName', e.target.value);
                      if (!studentInfo.parentName) onChange('parentName', e.target.value);
                    }}
                    placeholder="Mother's First Name"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">17. Date of Birth</label>
                  <input
                    type="date"
                    value={studentInfo.motherDob || ''}
                    onChange={(e) => {
                      const dobVal = e.target.value;
                      onChange('motherDob', dobVal);
                      const calculatedAge = calculateAge(dobVal);
                      onChange('motherAge', calculatedAge);
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">18. Middle Name</label>
                  <input
                    type="text"
                    value={studentInfo.motherMiddleName || ''}
                    onChange={(e) => onChange('motherMiddleName', e.target.value)}
                    placeholder="Mother's Middle Name"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">19. Last Name</label>
                  <input
                    type="text"
                    value={studentInfo.motherLastName || ''}
                    onChange={(e) => onChange('motherLastName', e.target.value)}
                    placeholder="Mother's Last Name"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">20. Age <span className="text-gray-400 font-normal">(Auto-calculated)</span></label>
                  <div className="w-full px-3 py-2 text-sm border border-gray-300 bg-gray-50 text-gray-700 rounded-lg min-h-[38px] flex items-center font-medium">
                    {studentInfo.motherDob ? `${calculateAge(studentInfo.motherDob)} years old` : 'Enter DOB'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">21. E-mail address</label>
                  <input
                    type="email"
                    value={studentInfo.motherEmail || ''}
                    onChange={(e) => {
                      onChange('motherEmail', e.target.value);
                      if (!studentInfo.parentEmail) onChange('parentEmail', e.target.value);
                    }}
                    placeholder="Mother's Email Address"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">22. Cell phone Number</label>
                  <input
                    type="tel"
                    value={studentInfo.motherCellPhone || ''}
                    onChange={(e) => onChange('motherCellPhone', e.target.value)}
                    placeholder="Mother's Cell Phone"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">23. Home phone number</label>
                  <input
                    type="tel"
                    value={studentInfo.motherHomePhone || ''}
                    onChange={(e) => onChange('motherHomePhone', e.target.value)}
                    placeholder="Mother's Home Phone"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">24. Address</label>
                  <input
                    type="text"
                    value={studentInfo.motherAddress || ''}
                    onChange={(e) => onChange('motherAddress', e.target.value)}
                    placeholder="Mother's Address"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="checkbox"
                      id="mother-same-address"
                      checked={studentInfo.motherAddress === studentInfo.address && !!studentInfo.address}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onChange('motherAddress', studentInfo.address || '');
                        } else {
                          onChange('motherAddress', '');
                        }
                      }}
                      className="rounded text-purple-600 focus:ring-purple-500 text-xs"
                    />
                    <label htmlFor="mother-same-address" className="text-[11px] text-gray-500 font-medium cursor-pointer">
                      Same as student's address
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Father's Information */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-bold text-purple-900 border-b border-purple-100 pb-2">Father's Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">25. First Name</label>
                  <input
                    type="text"
                    value={studentInfo.fatherFirstName || ''}
                    onChange={(e) => onChange('fatherFirstName', e.target.value)}
                    placeholder="Father's First Name"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">26. Date of Birth</label>
                  <input
                    type="date"
                    value={studentInfo.fatherDob || ''}
                    onChange={(e) => {
                      const dobVal = e.target.value;
                      onChange('fatherDob', dobVal);
                      const calculatedAge = calculateAge(dobVal);
                      onChange('fatherAge', calculatedAge);
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">27. Middle Name</label>
                  <input
                    type="text"
                    value={studentInfo.fatherMiddleName || ''}
                    onChange={(e) => onChange('fatherMiddleName', e.target.value)}
                    placeholder="Father's Middle Name"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">28. Last Name</label>
                  <input
                    type="text"
                    value={studentInfo.fatherLastName || ''}
                    onChange={(e) => onChange('fatherLastName', e.target.value)}
                    placeholder="Father's Last Name"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">29. Age <span className="text-gray-400 font-normal">(Auto-calculated)</span></label>
                  <div className="w-full px-3 py-2 text-sm border border-gray-300 bg-gray-50 text-gray-700 rounded-lg min-h-[38px] flex items-center font-medium">
                    {studentInfo.fatherDob ? `${calculateAge(studentInfo.fatherDob)} years old` : 'Enter DOB'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">30. E-mail address</label>
                  <input
                    type="email"
                    value={studentInfo.fatherEmail || ''}
                    onChange={(e) => onChange('fatherEmail', e.target.value)}
                    placeholder="Father's Email Address"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">31. Cell phone Number</label>
                  <input
                    type="tel"
                    value={studentInfo.fatherCellPhone || ''}
                    onChange={(e) => onChange('fatherCellPhone', e.target.value)}
                    placeholder="Father's Cell Phone"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">32. Home phone number</label>
                  <input
                    type="tel"
                    value={studentInfo.fatherHomePhone || ''}
                    onChange={(e) => onChange('fatherHomePhone', e.target.value)}
                    placeholder="Father's Home Phone"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">33. Address</label>
                  <input
                    type="text"
                    value={studentInfo.fatherAddress || ''}
                    onChange={(e) => onChange('fatherAddress', e.target.value)}
                    placeholder="Father's Address"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="checkbox"
                      id="father-same-address"
                      checked={studentInfo.fatherAddress === studentInfo.address && !!studentInfo.address}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onChange('fatherAddress', studentInfo.address || '');
                        } else {
                          onChange('fatherAddress', '');
                        }
                      }}
                      className="rounded text-purple-600 focus:ring-purple-500 text-xs"
                    />
                    <label htmlFor="father-same-address" className="text-[11px] text-gray-500 font-medium cursor-pointer">
                      Same as student's address
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guardian Information Section (PDF Questions 32-42) */}
      {(studentInfo.livesWith === 'Guardian' || !studentInfo.livesWith) && (
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden transition-all">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">Guardian Information</h2>
            <p className="text-xs text-gray-500">This section should be filled out where applicable (all fields are optional)</p>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">32. First Name</label>
                <input
                  type="text"
                  value={studentInfo.guardianFirstName || ''}
                  onChange={(e) => onChange('guardianFirstName', e.target.value)}
                  placeholder="Guardian's First Name"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">33. Middle Name</label>
                <input
                  type="text"
                  value={studentInfo.guardianMiddleName || ''}
                  onChange={(e) => onChange('guardianMiddleName', e.target.value)}
                  placeholder="Guardian's Middle Name"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">34. Last Name</label>
                <input
                  type="text"
                  value={studentInfo.guardianLastName || ''}
                  onChange={(e) => onChange('guardianLastName', e.target.value)}
                  placeholder="Guardian's Last Name"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">35. Age <span className="text-gray-400 font-normal">(Auto-calculated)</span></label>
                <div className="w-full px-3 py-2 text-sm border border-gray-300 bg-gray-50 text-gray-700 rounded-lg min-h-[38px] flex items-center font-medium">
                  {studentInfo.guardianDob ? `${calculateAge(studentInfo.guardianDob)} years old` : 'Enter DOB'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">36. Date of Birth</label>
                <input
                  type="date"
                  value={studentInfo.guardianDob || ''}
                  onChange={(e) => {
                    const dobVal = e.target.value;
                    onChange('guardianDob', dobVal);
                    const calculatedAge = calculateAge(dobVal);
                    onChange('guardianAge', calculatedAge);
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  37. E-mail address
                </label>
                <input
                  type="email"
                  value={studentInfo.guardianEmail || ''}
                  onChange={(e) => onChange('guardianEmail', e.target.value)}
                  placeholder="Guardian's Email Address"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">38. Cell phone Number</label>
                <input
                  type="tel"
                  value={studentInfo.guardianCellPhone || ''}
                  onChange={(e) => onChange('guardianCellPhone', e.target.value)}
                  placeholder="Guardian's Cell Phone"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">39. Home phone number</label>
                <input
                  type="tel"
                  value={studentInfo.guardianHomePhone || ''}
                  onChange={(e) => onChange('guardianHomePhone', e.target.value)}
                  placeholder="Guardian's Home Phone"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">40. Address</label>
                <input
                  type="text"
                  value={studentInfo.guardianAddress || ''}
                  onChange={(e) => onChange('guardianAddress', e.target.value)}
                  placeholder="Guardian's Address"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    id="guardian-same-address"
                    checked={studentInfo.guardianAddress === studentInfo.address && !!studentInfo.address}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onChange('guardianAddress', studentInfo.address || '');
                      } else {
                        onChange('guardianAddress', '');
                      }
                    }}
                    className="rounded text-purple-600 focus:ring-purple-500 text-xs"
                  />
                  <label htmlFor="guardian-same-address" className="text-[11px] text-gray-500 font-medium cursor-pointer">
                    Same as student's address
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">41. Gender</label>
                <div className="flex items-center gap-4 mt-1">
                  <label className="flex items-center gap-2 text-xs text-gray-700">
                    <input
                      type="radio"
                      name="guardianGender"
                      value="Female"
                      checked={studentInfo.guardianGender === 'Female'}
                      onChange={() => onChange('guardianGender', 'Female')}
                    />
                    <span>Female</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-700">
                    <input
                      type="radio"
                      name="guardianGender"
                      value="Male"
                      checked={studentInfo.guardianGender === 'Male'}
                      onChange={() => onChange('guardianGender', 'Male')}
                    />
                    <span>Male</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  42. Relation to student
                </label>
                <input
                  type="text"
                  value={studentInfo.guardianRelation || ''}
                  onChange={(e) => onChange('guardianRelation', e.target.value)}
                  placeholder="e.g. Aunt / Grandparent / Legal Guardian"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

