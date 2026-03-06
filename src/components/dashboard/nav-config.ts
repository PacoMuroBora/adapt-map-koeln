import {
  BookOpenText,
  LayoutDashboard,
  Map,
  Settings2,
} from 'lucide-react'

export type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export const primaryNav: NavItem[] = [
  {
    label: 'Submissions',
    href: '/dashboard/submissions',
    icon: LayoutDashboard,
  },
  {
    label: 'Map',
    href: '/dashboard/map',
    icon: Map,
  },
  {
    label: 'Knowledge Base',
    href: '/dashboard/knowledge-base',
    icon: BookOpenText,
  },
  {
    label: 'Site settings',
    href: '/dashboard/site-settings',
    icon: Settings2,
  },
]
