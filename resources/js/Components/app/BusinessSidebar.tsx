import {
    CalendarDays,
    Image as ImageIcon,
    LayoutDashboard,
    MonitorPlay,
    PieChart,
    Settings,
    Sparkles,
    Type,
    Zap,
} from 'lucide-react';
import { SidebarShell, type SidebarNavItem } from '@/Components/app/SidebarShell';
import { usePermissions } from '@/Hooks/usePermissions';

interface BusinessItem extends SidebarNavItem {
    permissions?: string[];
}

const items: BusinessItem[] = [
    { label: 'Inicio', href: '/business/dashboard', icon: LayoutDashboard, exact: true, permissions: ['business.dashboard.view'] },
    { label: 'Contenido', href: '/business/content', icon: Type, permissions: ['business.media.view'] },
    { label: 'Biblioteca', href: '/business/library', icon: ImageIcon, permissions: ['business.media.view'] },
    { label: 'Reproducción inmediata', href: '/business/quick-play', icon: Zap, permissions: ['business.devices.view'] },
    { label: 'Pantallas', href: '/business/screens', icon: MonitorPlay, permissions: ['business.devices.view'] },
    { label: 'Programación', href: '/business/schedule', icon: CalendarDays, permissions: ['business.schedules.view'] },
    { label: 'Vista previa', href: '/business/preview', icon: Sparkles, permissions: ['business.devices.view'] },
    { label: 'Reportes', href: '/business/reports', icon: PieChart, permissions: ['business.reports.view'] },
    { label: 'Configuración', href: '/business/settings', icon: Settings, permissions: ['business.settings.view'] },
];

export function BusinessSidebar({ collapsed, className }: { collapsed: boolean; className?: string }) {
    const { canAny } = usePermissions();

    const visible = items.filter((item) => !item.permissions || canAny(...item.permissions));

    return (
        <SidebarShell
            brand={{ title: 'Signage TV', subtitle: 'Panel del negocio', href: '/business/dashboard' }}
            sections={[{ label: 'Mi negocio', items: visible }]}
            collapsed={collapsed}
            className={className}
            footer={
                <p className="text-[10px] font-semibold uppercase leading-relaxed tracking-[0.18em] text-faint">
                    Tu negocio,
                    <br />
                    en grandes
                    <br />
                    momentos
                </p>
            }
        />
    );
}
