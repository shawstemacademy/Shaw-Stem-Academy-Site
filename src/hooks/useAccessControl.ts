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

  // Helper flags for key processes
  const canManageRegistrationControls = useMemo(() => {
    return isAdmin || isRegistrar || hasPermission('perm-reg-controls');
  }, [isAdmin, isRegistrar, currentUser, rolePermissions]);

  const canProcessRegistrations = useMemo(() => {
    return isAdmin || isRegistrar || hasPermission('perm-reg-process');
  }, [isAdmin, isRegistrar, currentUser, rolePermissions]);

  const canManageAddDrop = useMemo(() => {
    return isAdmin || isRegistrar || hasPermission('perm-add-drop');
  }, [isAdmin, isRegistrar, currentUser, rolePermissions]);

  const canUseQrScanner = useMemo(() => {
    return isAdmin || isTeacher || isHod || hasPermission('perm-qr-attendance');
  }, [isAdmin, isTeacher, isHod, currentUser, rolePermissions]);

  const canSubmitClaims = useMemo(() => {
    return isAdmin || isTeacher || isHod || hasPermission('perm-claim-submit');
  }, [isAdmin, isTeacher, isHod, currentUser, rolePermissions]);

  const canVerifyClaims = useMemo(() => {
    return isAdmin || isHod || isRegistrar || hasPermission('perm-claim-verify');
  }, [isAdmin, isHod, isRegistrar, currentUser, rolePermissions]);

  const canManageCurriculum = useMemo(() => {
    return isAdmin || isHod || isTeacher || hasPermission('perm-curriculum');
  }, [isAdmin, isHod, isTeacher, currentUser, rolePermissions]);

  const canUploadResources = useMemo(() => {
    return isAdmin || isTeacher || isHod || hasPermission('perm-resources');
  }, [isAdmin, isTeacher, isHod, currentUser, rolePermissions]);

  const canPublishNews = useMemo(() => {
    return isAdmin || isHod || hasPermission('perm-news-publish');
  }, [isAdmin, isHod, currentUser, rolePermissions]);

  const canManageDiscounts = useMemo(() => {
    return isAdmin || isRegistrar || hasPermission('perm-discounts');
  }, [isAdmin, isRegistrar, currentUser, rolePermissions]);

  const canViewFinancials = useMemo(() => {
    return isAdmin || isRegistrar || hasPermission('perm-billing');
  }, [isAdmin, isRegistrar, currentUser, rolePermissions]);

  const canManageUsers = useMemo(() => {
    return isAdmin || hasPermission('perm-user-mgmt');
  }, [isAdmin, currentUser, rolePermissions]);

  const canManageRoles = useMemo(() => {
    return isAdmin || hasPermission('perm-role-mgmt');
  }, [isAdmin, currentUser, rolePermissions]);

  const canAccessTab = (tabName: string): boolean => {
    if (!currentUser) return false;
    if (isAdmin) return true;

    switch (tabName) {
      case 'dashboard':
        return true;
      case 'admin':
        return isAdmin || isRegistrar;
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
    // Process-specific capabilities
    canManageRegistrationControls,
    canProcessRegistrations,
    canManageAddDrop,
    canUseQrScanner,
    canSubmitClaims,
    canVerifyClaims,
    canManageCurriculum,
    canUploadResources,
    canPublishNews,
    canManageDiscounts,
    canViewFinancials,
    canManageUsers,
    canManageRoles,
  };
}

