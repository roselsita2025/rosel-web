import { useAuthStore } from '../store/authStore.js';
import { useSidebar } from '../contexts/SidebarContext.jsx';

const AdminLayout = ({ children }) => {
    const { user } = useAuthStore();
    const { isSidebarCollapsed } = useSidebar();

    if (!user || !user.isVerified || user.role !== 'admin') {
        return null;
    }

    return (
        <div className={`pt-16 transition-all duration-300 ${
            isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}>
            <div className="min-h-screen bg-[#f8f3ed]">
                {children}
            </div>
        </div>
    );
};

export default AdminLayout;
