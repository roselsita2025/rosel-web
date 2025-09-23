import { useSidebar } from "../contexts/SidebarContext.jsx";

const MainContent = ({ children, isAdmin, isAdminPage }) => {
  const { isSidebarCollapsed } = useSidebar();
  
  const getMarginClass = () => {
    if (!isAdmin || !isAdminPage) return '';
    return isSidebarCollapsed ;
  };

  return (
    <div className={`${getMarginClass()} transition-all duration-300`}>
      {children}
    </div>
  );
};

export default MainContent;
