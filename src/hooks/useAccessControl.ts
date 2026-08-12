import { useMemo } from 'react';
import { SchoolUser, UserRole, RolePermission } from '../types';

export function useAccessControl(currentUser: SchoolUser | null, rolePermissions: RolePermission[] = []) {
  const userRoles: UserRole[] = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.roles && currentUser.roles.length > 0) {
      return currentUser.roles;
    }
    return currentUser.role ? [currentUser.role] : ['student'];
  }, [currentUser]);

  const isAdmin = useMemo(() => userRoles.includes('admin'), [userRoles]);
  const isTeacher = useMemo(() => userRoles.includes('teacher'), [userRoles]);
  const isRegistrar = useMemo(() => userRoles.includes('registrar'), [userRoles]);
  const isHod = useMemo(() => userRoles.includes('hod'), [userRoles]);
  const isStudent = useMemo(() => userRoles.includes('student'), [userRoles]);

  const hasRole = (role: UserRole): boolean => {
    return userRoles.includes(role);
  };

  const hasPermission = (permissionId: string): boolean => {
    if (!currentUser) return false;
    if (isAdmin) return true; // Admins have full access

    // Check custom permissions overrides first if defined
    if (currentUser.permissions && currentUser.permissions.length > 0) {
      if (currentUser.permissions.includes(permissionId)) {
        return true;
      }
    }

    // Otherwise check role permissions from the matrix
    const permConfig = rolePermissions.find((p) => p.id === permissionId);
    if (!permConfig) return false;

    return userRoles.some((r) => {
      if (r === 'admin' && permConfig.adminDefault) return true;
      if (r === 'teacher' && permConfig.teacherDefault) return true;
      if (r === 'registrar' && permConfig.registrarDefault) return true;
      if (r === 'hod' && permConfig.hodDefault) return true;
      if (r === 'student' && permConfig.studentDefault) return true;
      return false;
    });
  };

  const canAccessTab = (tabName: string): boolean => {
    if (!currentUser) return false;
    if (isAdmin) return true;

    switch (tabName) {
      case 'dashboard':
        return true;
      case 'admin':
        return isAdmin;
      case 'teacher':
        return isTeacher || isAdmin || isHod;
      case 'registrar':
        return isRegistrar || isAdmin;
      case 'hod':
        return isHod || isAdmin;
      case 'student':
        return isStudent || isTeacher || isAdmin;
      default:
        return true;
    }
  };

  return {
    userRoles,
    isAdmin,
    isTeacher,
    isRegistrar,
    isHod,
    isStudent,
    hasRole,
    hasPermission,
    canAccessTab,
  };
}
