import React, { useState } from 'react';
import { StudentInfo, FormTheme } from '../types';
import { User, Mail, Phone, GraduationCap, Upload, MapPin, Calendar, Heart, Shield, HelpCircle, Users, Eye, EyeOff, CheckCircle2, Sliders, Copy } from 'lucide-react';
import { ImageUploadInput } from './common/ImageUploadInput';
import { FormFieldSetting, getFieldSetting } from '../lib/formFieldsConfig';
import { getPhoneValidationError, sanitizePhoneDigits } from '../lib/phoneValidation';
import { calculateAge } from '../lib/ageValidation';

interface StudentInfoFormProps {
  studentInfo: StudentInfo;
  onChange: (field: keyof StudentInfo, value: any) => void;
  theme: FormTheme;
  isSiblingSelected: boolean;
  setIsSiblingSelected: (v: boolean) => void;
  siblingDiscountAmount: number;
  formGrades?: string[];
  fieldSettings?: FormFieldSetting[];
  isAdminLoggedIn?: boolean;
  onToggleFieldSetting?: (formId: string, fieldId: string, property: 'enabled' | 'required') => void;
}

export const StudentInfoForm: React.FC<StudentInfoFormProps> = ({
  studentInfo,
  onChange,
  theme,
  isSiblingSelected,
  setIsSiblingSelected,
  siblingDiscountAmount,
  formGrades,
  fieldSettings = [],
  isAdminLoggedIn = false,
  onToggleFieldSetting,
}) => {
  const [photoPreview, setPhotoPreview] = useState<string>(studentInfo.photoUrl || '');

  const FORM_ID = 'student_registration';

  const isEnabled = (fieldId: string): boolean => {
    return getFieldSetting(fieldSettings, FORM_ID, fieldId).enabled;
  };

  const isRequired = (fieldId: string): boolean => {
    return getFieldSetting(fieldSettings, FORM_ID, fieldId).required;
  };

  const getLabel = (fieldId: string, defaultLabel: string): string => {
    const setting = getFieldSetting(fieldSettings, FORM_ID, fieldId);
    return setting.customLabel || defaultLabel;
  };

  const renderAdminFieldBadge = (fieldId: string) => {
    if (!isAdminLoggedIn || !onToggleFieldSetting) return null;
    const setting = getFieldSetting(fieldSettings, FORM_ID, fieldId);

    return (
      <span className="inline-flex items-center gap-1.5 ml-2 bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-200 px-2 py-0.5 rounded text-2xs font-semibold">
        <Sliders className="w-3 h-3 text-purple-600" />
        Admin Control:
        <button
          type="button"
          onClick={() => onToggleFieldSetting(FORM_ID, fieldId, 'enabled')}
          className={`px-1.5 py-0.2 text-2xs rounded font-bold ${
            setting.enabled ? 'bg-emerald-600 text-white' : 'bg-slate-400 text-white'
          }`}
          title="Toggle field visibility"
        >
          {setting.enabled ? 'Enabled' : 'Disabled'}
        </button>
        <button
          type="button"
          onClick={() => onToggleFieldSetting(FORM_ID, fieldId, 'required')}
          className={`px-1.5 py-0.2 text-2xs rounded font-bold ${
            setting.required ? 'bg-purple-600 text-white' : 'bg-slate-300 text-slate-700'
          }`}
          title="Toggle required status"
        >
          {setting.required ? 'Req (*)' : 'Opt'}
        </button>
      </span>
    );
  };

  const handlePhoneInputChange = (fieldKey: keyof StudentInfo, rawValue: string) => {
    // Sanitize non-digits
    const digitsOnly = sanitizePhoneDigits(rawValue);
    onChange(fieldKey, digitsOnly);
  };

  return (
    <div className="space-y-6 mb-6">
      {isAdminLoggedIn && (
        <div className="bg-purple-900 text-white p-3.5 rounded-xl text-xs font-medium flex items-center justify-between border border-purple-700 shadow-sm">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-300" />
            <span>
              <strong>Admin Live Form Editor Active:</strong> You can enable/disable fields and toggle required constraints directly on this form or via the Admin Dashboard Form Fields Editor.
            </span>
          </div>
        </div>
      )}

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

          {/* Email field */}
          {isEnabled('email') && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                {getLabel('email', 'Email')}{' '}
                {isRequired('email') && <span className="text-red-500">*</span>}
                {renderAdminFieldBadge('email')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  id="student-email"
                  type="email"
                  required={isRequired('email')}
                  value={studentInfo.email || ''}
                  onChange={(e) => onChange('email', e.target.value)}
                  placeholder="Your primary email address"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* First Name, Middle Name, Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {isEnabled('firstName') && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  {getLabel('firstName', '2. First Name')}{' '}
                  {isRequired('firstName') && <span className="text-red-500">*</span>}
                  {renderAdminFieldBadge('firstName')}
                </label>
                <input
                  id="student-firstname"
                  type="text"
                  required={isRequired('firstName')}
                  value={studentInfo.firstName || ''}
                  onChange={(e) => {
                    onChange('firstName', e.target.value);
                    onChange('studentName', `${e.target.value} ${studentInfo.lastName || ''}`.trim());
                  }}
                  placeholder="First Name"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>
            )}

            {isEnabled('middleName') && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  {getLabel('middleName', '3. Middle Name')}{' '}
                  {isRequired('middleName') && <span className="text-red-500">*</span>}
                  {renderAdminFieldBadge('middleName')}
                </label>
                <input
                  id="student-middlename"
                  type="text"
                  required={isRequired('middleName')}
                  value={studentInfo.middleName || ''}
                  onChange={(e) => onChange('middleName', e.target.value)}
                  placeholder="Middle Name"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>
            )}

            {isEnabled('lastName') && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  {getLabel('lastName', '4. Last Name')}{' '}
                  {isRequired('lastName') && <span className="text-red-500">*</span>}
                  {renderAdminFieldBadge('lastName')}
                </label>
                <input
                  id="student-lastname"
                  type="text"
                  required={isRequired('lastName')}
                  value={studentInfo.lastName || ''}
                  onChange={(e) => {
                    onChange('lastName', e.target.value);
                    onChange('studentName', `${studentInfo.firstName || ''} ${e.target.value}`.trim());
                  }}
                  placeholder="Last Name"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>
            )}
          </div>

          {/* Form/Grade & Current School */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isEnabled('gradeLevel') && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  {getLabel('gradeLevel', '5. Form/Grade')}{' '}
                  {isRequired('gradeLevel') && <span className="text-red-500">*</span>}
                  {renderAdminFieldBadge('gradeLevel')}
                </label>
                <select
                  id="student-grade"
                  required={isRequired('gradeLevel')}
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
            )}

            {isEnabled('presentSchool') && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  {getLabel('presentSchool', '6. Current School')}{' '}
                  {isRequired('presentSchool') && <span className="text-red-500">*</span>}
                  {renderAdminFieldBadge('presentSchool')}
                </label>
                <input
                  id="student-school"
                  type="text"
                  required={isRequired('presentSchool')}
                  value={studentInfo.currentSchool || ''}
                  onChange={(e) => onChange('currentSchool', e.target.value)}
                  placeholder="e.g. Campion College / Ardenne High"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>
            )}
          </div>

          {/* Age & Date of Birth */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isEnabled('dob') && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  {getLabel('dob', '8. Date of Birth')}{' '}
                  {isRequired('dob') && <span className="text-red-500">*</span>}
                  {renderAdminFieldBadge('dob')}
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    id="student-dob"
                    type="date"
                    required={isRequired('dob')}
                    value={studentInfo.dateOfBirth || ''}
                    onChange={(e) => {
                      const dobVal = e.target.value;
                      onChange('dateOfBirth', dobVal);
                      const calculatedAgeNum = calculateAge(dobVal);
                      const calculatedAgeStr = calculatedAgeNum !== null ? String(calculatedAgeNum) : '';
                      onChange('age', calculatedAgeStr);
                      onChange('studentAge', calculatedAgeStr);
                    }}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            {isEnabled('age') && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  {getLabel('age', '7. Age')}{' '}
                  {renderAdminFieldBadge('age')}
                </label>
                <div className={`w-full px-3 py-2 text-sm border rounded-lg min-h-[38px] flex items-center justify-between font-medium ${
                  studentInfo.dateOfBirth && (Number(studentInfo.age) < 14 || Number(studentInfo.age) > 100)
                    ? 'border-red-300 bg-red-50 text-red-700'
                    : 'border-gray-300 bg-gray-50 text-gray-700'
                }`}>
                  <span>
                    {studentInfo.dateOfBirth 
                      ? `${studentInfo.age || ''} years old` 
                      : 'Enter Date of Birth'}
                  </span>
                  {studentInfo.dateOfBirth && (Number(studentInfo.age) < 14 || Number(studentInfo.age) > 100) && (
                    <span className="text-[11px] font-bold text-red-600 animate-pulse">
                      Must be 14-100 years old
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Cell phone Number & Home phone number with strict numeric & 10 digit validation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isEnabled('cellPhone') && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  {getLabel('cellPhone', '9. Cell phone Number')}{' '}
                  {isRequired('cellPhone') && <span className="text-red-500">*</span>}
                  {renderAdminFieldBadge('cellPhone')}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    id="student-cellphone"
                    type="text"
                    inputMode="numeric"
                    required={isRequired('cellPhone')}
                    value={studentInfo.cellPhone || ''}
                    onChange={(e) => handlePhoneInputChange('cellPhone', e.target.value)}
                    placeholder="10-digit phone number (numbers only)"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
                {getPhoneValidationError(studentInfo.cellPhone || '', isRequired('cellPhone')) && (
                  <p className="text-2xs text-amber-600 font-semibold mt-0.5">
                    {getPhoneValidationError(studentInfo.cellPhone || '', isRequired('cellPhone'))}
                  </p>
                )}
              </div>
            )}

            {isEnabled('homePhone') && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  {getLabel('homePhone', '10. Home phone number')}{' '}
                  {isRequired('homePhone') && <span className="text-red-500">*</span>}
                  {renderAdminFieldBadge('homePhone')}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    id="student-homephone"
                    type="text"
                    inputMode="numeric"
                    required={isRequired('homePhone')}
                    value={studentInfo.homePhone || ''}
                    onChange={(e) => handlePhoneInputChange('homePhone', e.target.value)}
                    placeholder="10-digit home phone (numbers only)"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
                {getPhoneValidationError(studentInfo.homePhone || '', isRequired('homePhone')) && (
                  <p className="text-2xs text-amber-600 font-semibold mt-0.5">
                    {getPhoneValidationError(studentInfo.homePhone || '', isRequired('homePhone'))}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Identification Photo Upload */}
          {isEnabled('photoUrl') && (
            <div id="student-photo-section" className="p-4 bg-purple-50/50 border border-purple-100 rounded-xl">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                {getLabel('photoUrl', '11. Student Identification Picture / Photo')}{' '}
                {isRequired('photoUrl') && <span className="text-red-500">*</span>}
                {renderAdminFieldBadge('photoUrl')}
              </label>
              <ImageUploadInput
                label="Student Photo"
                description="Please provide a picture of yourself for identification."
                value={studentInfo.photoUrl || ''}
                onChange={(photo) => {
                  setPhotoPreview(photo);
                  onChange('photoUrl', photo);
                }}
                placeholder="Upload photo file from device..."
                aspectRatio="square"
                hideDownload={true}
              />
            </div>
          )}

          {/* Address */}
          {isEnabled('address') && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                {getLabel('address', '12. Address')}{' '}
                {isRequired('address') && <span className="text-red-500">*</span>}
                {renderAdminFieldBadge('address')}
              </label>
              <textarea
                rows={2}
                required={isRequired('address')}
                value={studentInfo.address || ''}
                onChange={(e) => onChange('address', e.target.value)}
                placeholder="Full residential address"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              />
            </div>
          )}

          {/* Gender */}
          {isEnabled('gender') && (
            <div id="student-gender-section" className="space-y-2 pt-2 border-t border-gray-100">
              <label className="block text-xs font-semibold text-gray-700">
                {getLabel('gender', '14. Gender')}{' '}
                {isRequired('gender') && <span className="text-red-500">*</span>}
                {renderAdminFieldBadge('gender')}
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
          )}

          {/* Who do you currently live with? */}
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

      {/* Parent Information Section */}
      {(studentInfo.livesWith === 'Parent' || !studentInfo.livesWith) && (
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden transition-all">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">Parent Information</h2>
            <p className="text-xs text-gray-500">This section should be filled out where applicable</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Mother's Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-purple-900 border-b border-purple-100 pb-2">Mother's Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {isEnabled('motherFirstName') && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {getLabel('motherFirstName', "16. Mother's First Name")}{' '}
                      {isRequired('motherFirstName') && <span className="text-red-500">*</span>}
                      {renderAdminFieldBadge('motherFirstName')}
                    </label>
                    <input
                      type="text"
                      required={isRequired('motherFirstName')}
                      value={studentInfo.motherFirstName || ''}
                      onChange={(e) => {
                        onChange('motherFirstName', e.target.value);
                        if (!studentInfo.parentName) onChange('parentName', e.target.value);
                      }}
                      placeholder="Mother's First Name"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>
                )}
                {isEnabled('motherLastName') && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {getLabel('motherLastName', "Mother's Last Name")}{' '}
                      {isRequired('motherLastName') && <span className="text-red-500">*</span>}
                      {renderAdminFieldBadge('motherLastName')}
                    </label>
                    <input
                      type="text"
                      required={isRequired('motherLastName')}
                      value={studentInfo.motherLastName || ''}
                      onChange={(e) => onChange('motherLastName', e.target.value)}
                      placeholder="Mother's Last Name"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>
                )}
                {isEnabled('motherEmail') && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {getLabel('motherEmail', "Mother's E-mail")}{' '}
                      {isRequired('motherEmail') && <span className="text-red-500">*</span>}
                      {renderAdminFieldBadge('motherEmail')}
                    </label>
                    <input
                      type="email"
                      required={isRequired('motherEmail')}
                      value={studentInfo.motherEmail || ''}
                      onChange={(e) => {
                        onChange('motherEmail', e.target.value);
                        if (!studentInfo.parentEmail) onChange('parentEmail', e.target.value);
                      }}
                      placeholder="Mother's Email Address"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {isEnabled('motherCellPhone') && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {getLabel('motherCellPhone', "Mother's Cell Phone")}{' '}
                      {isRequired('motherCellPhone') && <span className="text-red-500">*</span>}
                      {renderAdminFieldBadge('motherCellPhone')}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required={isRequired('motherCellPhone')}
                      value={studentInfo.motherCellPhone || ''}
                      onChange={(e) => handlePhoneInputChange('motherCellPhone', e.target.value)}
                      placeholder="10-digit cell phone (numbers only)"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                    {getPhoneValidationError(studentInfo.motherCellPhone || '', isRequired('motherCellPhone')) && (
                      <p className="text-2xs text-amber-600 font-semibold mt-0.5">
                        {getPhoneValidationError(studentInfo.motherCellPhone || '', isRequired('motherCellPhone'))}
                      </p>
                    )}
                  </div>
                )}
                {isEnabled('motherHomePhone') && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {getLabel('motherHomePhone', "Mother's Home Phone")}{' '}
                      {isRequired('motherHomePhone') && <span className="text-red-500">*</span>}
                      {renderAdminFieldBadge('motherHomePhone')}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required={isRequired('motherHomePhone')}
                      value={studentInfo.motherHomePhone || ''}
                      onChange={(e) => handlePhoneInputChange('motherHomePhone', e.target.value)}
                      placeholder="10-digit home phone (numbers only)"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                    {getPhoneValidationError(studentInfo.motherHomePhone || '', isRequired('motherHomePhone')) && (
                      <p className="text-2xs text-amber-600 font-semibold mt-0.5">
                        {getPhoneValidationError(studentInfo.motherHomePhone || '', isRequired('motherHomePhone'))}
                      </p>
                    )}
                  </div>
                )}
                {isEnabled('motherAddress') && (
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                      <label className="block text-xs font-semibold text-gray-700">
                        {getLabel('motherAddress', "Mother's Address")}{' '}
                        {isRequired('motherAddress') && <span className="text-red-500">*</span>}
                        {renderAdminFieldBadge('motherAddress')}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const addr = studentInfo.address || (studentInfo as any).studentAddress || '';
                          if (!addr) {
                            alert("Please enter the student's address in Section 1 (Student Information) first.");
                            return;
                          }
                          onChange('motherAddress', addr);
                        }}
                        className="px-2.5 py-1 bg-purple-100 dark:bg-purple-950/50 hover:bg-purple-200 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold rounded-lg border border-purple-200 dark:border-purple-800/80 text-xs inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        title="Copy student residential address to mother's address"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Same as child address</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      required={isRequired('motherAddress')}
                      value={studentInfo.motherAddress || ''}
                      onChange={(e) => onChange('motherAddress', e.target.value)}
                      placeholder="Mother's Address"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Father's Information */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-bold text-purple-900 border-b border-purple-100 pb-2">Father's Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {isEnabled('fatherFirstName') && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {getLabel('fatherFirstName', "Father's First Name")}{' '}
                      {isRequired('fatherFirstName') && <span className="text-red-500">*</span>}
                      {renderAdminFieldBadge('fatherFirstName')}
                    </label>
                    <input
                      type="text"
                      required={isRequired('fatherFirstName')}
                      value={studentInfo.fatherFirstName || ''}
                      onChange={(e) => onChange('fatherFirstName', e.target.value)}
                      placeholder="Father's First Name"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>
                )}
                {isEnabled('fatherLastName') && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {getLabel('fatherLastName', "Father's Last Name")}{' '}
                      {isRequired('fatherLastName') && <span className="text-red-500">*</span>}
                      {renderAdminFieldBadge('fatherLastName')}
                    </label>
                    <input
                      type="text"
                      required={isRequired('fatherLastName')}
                      value={studentInfo.fatherLastName || ''}
                      onChange={(e) => onChange('fatherLastName', e.target.value)}
                      placeholder="Father's Last Name"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>
                )}
                {isEnabled('fatherEmail') && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {getLabel('fatherEmail', "Father's E-mail")}{' '}
                      {isRequired('fatherEmail') && <span className="text-red-500">*</span>}
                      {renderAdminFieldBadge('fatherEmail')}
                    </label>
                    <input
                      type="email"
                      required={isRequired('fatherEmail')}
                      value={studentInfo.fatherEmail || ''}
                      onChange={(e) => onChange('fatherEmail', e.target.value)}
                      placeholder="Father's Email Address"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {isEnabled('fatherCellPhone') && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {getLabel('fatherCellPhone', "Father's Cell Phone")}{' '}
                      {isRequired('fatherCellPhone') && <span className="text-red-500">*</span>}
                      {renderAdminFieldBadge('fatherCellPhone')}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required={isRequired('fatherCellPhone')}
                      value={studentInfo.fatherCellPhone || ''}
                      onChange={(e) => handlePhoneInputChange('fatherCellPhone', e.target.value)}
                      placeholder="10-digit cell phone (numbers only)"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                    {getPhoneValidationError(studentInfo.fatherCellPhone || '', isRequired('fatherCellPhone')) && (
                      <p className="text-2xs text-amber-600 font-semibold mt-0.5">
                        {getPhoneValidationError(studentInfo.fatherCellPhone || '', isRequired('fatherCellPhone'))}
                      </p>
                    )}
                  </div>
                )}
                {isEnabled('fatherHomePhone') && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {getLabel('fatherHomePhone', "Father's Home Phone")}{' '}
                      {isRequired('fatherHomePhone') && <span className="text-red-500">*</span>}
                      {renderAdminFieldBadge('fatherHomePhone')}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required={isRequired('fatherHomePhone')}
                      value={studentInfo.fatherHomePhone || ''}
                      onChange={(e) => handlePhoneInputChange('fatherHomePhone', e.target.value)}
                      placeholder="10-digit home phone (numbers only)"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                    {getPhoneValidationError(studentInfo.fatherHomePhone || '', isRequired('fatherHomePhone')) && (
                      <p className="text-2xs text-amber-600 font-semibold mt-0.5">
                        {getPhoneValidationError(studentInfo.fatherHomePhone || '', isRequired('fatherHomePhone'))}
                      </p>
                    )}
                  </div>
                )}
                {isEnabled('fatherAddress') && (
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                      <label className="block text-xs font-semibold text-gray-700">
                        {getLabel('fatherAddress', "Father's Address")}{' '}
                        {isRequired('fatherAddress') && <span className="text-red-500">*</span>}
                        {renderAdminFieldBadge('fatherAddress')}
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const addr = studentInfo.address || (studentInfo as any).studentAddress || '';
                            if (!addr) {
                              alert("Please enter the student's address in Section 1 (Student Information) first.");
                              return;
                            }
                            onChange('fatherAddress', addr);
                          }}
                          className="px-2.5 py-1 bg-purple-100 dark:bg-purple-950/50 hover:bg-purple-200 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold rounded-lg border border-purple-200 dark:border-purple-800/80 text-xs inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                          title="Copy student residential address to father's address"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Same as child address</span>
                        </button>
                        {studentInfo.motherAddress && (
                          <button
                            type="button"
                            onClick={() => onChange('fatherAddress', studentInfo.motherAddress || '')}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-xs inline-flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                            title="Copy mother's address"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Same as Mother's</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <input
                      type="text"
                      required={isRequired('fatherAddress')}
                      value={studentInfo.fatherAddress || ''}
                      onChange={(e) => onChange('fatherAddress', e.target.value)}
                      placeholder="Father's Address"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guardian Information Section */}
      {(studentInfo.livesWith === 'Guardian' || !studentInfo.livesWith) && (
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden transition-all">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">Guardian Information</h2>
            <p className="text-xs text-gray-500">This section should be filled out where applicable</p>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {isEnabled('guardianFirstName') && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {getLabel('guardianFirstName', "Guardian's First Name")}{' '}
                    {isRequired('guardianFirstName') && <span className="text-red-500">*</span>}
                    {renderAdminFieldBadge('guardianFirstName')}
                  </label>
                  <input
                    type="text"
                    required={isRequired('guardianFirstName')}
                    value={studentInfo.guardianFirstName || ''}
                    onChange={(e) => onChange('guardianFirstName', e.target.value)}
                    placeholder="Guardian's First Name"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
              )}
              {isEnabled('guardianLastName') && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {getLabel('guardianLastName', "Guardian's Last Name")}{' '}
                    {isRequired('guardianLastName') && <span className="text-red-500">*</span>}
                    {renderAdminFieldBadge('guardianLastName')}
                  </label>
                  <input
                    type="text"
                    required={isRequired('guardianLastName')}
                    value={studentInfo.guardianLastName || ''}
                    onChange={(e) => onChange('guardianLastName', e.target.value)}
                    placeholder="Guardian's Last Name"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
              )}
              {isEnabled('guardianEmail') && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {getLabel('guardianEmail', "Guardian's E-mail")}{' '}
                    {isRequired('guardianEmail') && <span className="text-red-500">*</span>}
                    {renderAdminFieldBadge('guardianEmail')}
                  </label>
                  <input
                    type="email"
                    required={isRequired('guardianEmail')}
                    value={studentInfo.guardianEmail || ''}
                    onChange={(e) => onChange('guardianEmail', e.target.value)}
                    placeholder="Guardian's Email Address"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {isEnabled('guardianCellPhone') && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {getLabel('guardianCellPhone', "Guardian's Cell Phone")}{' '}
                    {isRequired('guardianCellPhone') && <span className="text-red-500">*</span>}
                    {renderAdminFieldBadge('guardianCellPhone')}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required={isRequired('guardianCellPhone')}
                    value={studentInfo.guardianCellPhone || ''}
                    onChange={(e) => handlePhoneInputChange('guardianCellPhone', e.target.value)}
                    placeholder="10-digit cell phone (numbers only)"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                  {getPhoneValidationError(studentInfo.guardianCellPhone || '', isRequired('guardianCellPhone')) && (
                    <p className="text-2xs text-amber-600 font-semibold mt-0.5">
                      {getPhoneValidationError(studentInfo.guardianCellPhone || '', isRequired('guardianCellPhone'))}
                    </p>
                  )}
                </div>
              )}
              {isEnabled('guardianHomePhone') && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {getLabel('guardianHomePhone', "Guardian's Home Phone")}{' '}
                    {isRequired('guardianHomePhone') && <span className="text-red-500">*</span>}
                    {renderAdminFieldBadge('guardianHomePhone')}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required={isRequired('guardianHomePhone')}
                    value={studentInfo.guardianHomePhone || ''}
                    onChange={(e) => handlePhoneInputChange('guardianHomePhone', e.target.value)}
                    placeholder="10-digit home phone (numbers only)"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                  {getPhoneValidationError(studentInfo.guardianHomePhone || '', isRequired('guardianHomePhone')) && (
                    <p className="text-2xs text-amber-600 font-semibold mt-0.5">
                      {getPhoneValidationError(studentInfo.guardianHomePhone || '', isRequired('guardianHomePhone'))}
                    </p>
                  )}
                </div>
              )}
              {isEnabled('guardianAddress') && (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                    <label className="block text-xs font-semibold text-gray-700">
                      {getLabel('guardianAddress', "Guardian's Address")}{' '}
                      {isRequired('guardianAddress') && <span className="text-red-500">*</span>}
                      {renderAdminFieldBadge('guardianAddress')}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const addr = studentInfo.address || (studentInfo as any).studentAddress || '';
                        if (!addr) {
                          alert("Please enter the student's address in Section 1 (Student Information) first.");
                          return;
                        }
                        onChange('guardianAddress', addr);
                      }}
                      className="px-2.5 py-1 bg-purple-100 dark:bg-purple-950/50 hover:bg-purple-200 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold rounded-lg border border-purple-200 dark:border-purple-800/80 text-xs inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                      title="Copy student residential address to guardian's address"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Same as child address</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required={isRequired('guardianAddress')}
                    value={studentInfo.guardianAddress || ''}
                    onChange={(e) => onChange('guardianAddress', e.target.value)}
                    placeholder="Guardian's Address"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
