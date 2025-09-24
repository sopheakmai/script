type TMenuFormat = {
  // id menu
  parent_id?: string;
  // id item
  id: string;
  ordering?: number;  
  label: string;
  // header 0=0> 
  type: 'header' | 'category' | 'item';
  // id parent menu
  main_id?: string;
  module_id?: string;
  icon?: string;
  url?: string;
  badgeContent?: string;
  badgeColor?: string;
  children?: TMenuFormat[];
}

export const menuList: TMenuFormat[] = [
  {
    id: '1',
    label: 'Dashboard',
    type: 'item',
    icon: 'home',
    module_id: 'dashboard',
  }
]

export const setupMenu: TMenuFormat[] = [
  {
    ordering: 1,
    id: 'dashboard',
    label: 'Dashboard',
    type: 'header',
    icon: 'dashboard',
    url: '/dashboard',
    main_id: '',
    parent_id: '2',
    module_id: 'dashboard',
    badgeContent: "",
    badgeColor: "",
    children: [],
  },
  {
    ordering: 2,
    id: 'user_management',
    label: 'User Management',
    type: 'category',
    icon: 'users',
    url: '',
    main_id: '',
    parent_id: '2',
    module_id: 'user_management',
    children: [
      {
        ordering: 1,
        id: 'users',
        label: 'Users',
        type: 'item',
        icon: 'user',
        url: '/users',
        main_id: 'user_management',
        parent_id: '2',
        module_id: 'users',
      },
      {
        ordering: 2,
        id: 'permissions',
        label: 'Permissions',
        type: 'category',
        icon: 'lock',
        module_id: 'permissions',
        url: '',
        main_id: 'user_management',
        parent_id: '2',
        children: [
          {
            ordering: 1,
            id: 'roles',
            label: 'Roles',
            type: 'item',
            icon: 'shield',
            url: '/roles',
            main_id: 'permissions',
            module_id: 'roles',
            parent_id: '2',
          },
          {
            ordering: 2,
            id: 'access_rights',
            label: 'Access Rights',
            type: 'item',
            icon: 'key',
            url: '/access-rights',
            main_id: 'permissions',
            module_id: 'access_rights',
            parent_id: '2',
          }
        ]
      }
    ]
  }
]
