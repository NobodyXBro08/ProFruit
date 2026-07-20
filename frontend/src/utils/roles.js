const STAFF_ROLES = ['editor', 'admin', 'super_admin'];

const ROLE_PERMISSIONS = {
  client: [],
  editor: ['panel:access', 'products:manage', 'inventory:manage', 'stats:view'],
  admin: [
    'panel:access',
    'products:manage',
    'inventory:manage',
    'orders:manage',
    'promotions:manage',
    'stats:view',
  ],
  super_admin: [
    'panel:access',
    'products:manage',
    'inventory:manage',
    'orders:manage',
    'promotions:manage',
    'users:manage',
    'stats:view',
  ],
};

export function normalizeRole(value) {
  if (value === 'editor' || value === 'admin' || value === 'super_admin' || value === 'client') {
    return value;
  }
  return 'client';
}

export function isStaffRole(role) {
  return STAFF_ROLES.includes(normalizeRole(role));
}

export function hasPermission(role, permission) {
  const r = normalizeRole(role);
  return (ROLE_PERMISSIONS[r] || []).includes(permission);
}

export function roleLabel(role) {
  switch (normalizeRole(role)) {
    case 'super_admin':
      return 'Super administrador';
    case 'admin':
      return 'Administrador';
    case 'editor':
      return 'Editor';
    default:
      return 'Cliente';
  }
}

export const ASSIGNABLE_ROLES = [
  { value: 'client', label: 'Cliente' },
  { value: 'editor', label: 'Editor' },
  { value: 'admin', label: 'Administrador' },
  { value: 'super_admin', label: 'Super administrador' },
];
