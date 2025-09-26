import { ShoppingCart, UserPlus, LogIn, LogOut, User, Menu, X, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";
import { cartStore } from "../store/cartStore.js";
import { useEffect, useRef, useState } from "react";
import NotificationBell from "./NotificationBell.jsx";
import { useSidebar } from "../contexts/SidebarContext.jsx";


import { PlusCircle, ShoppingBasket, LayoutDashboard, Package, RefreshCw, MessageCircle, Ticket, CreditCard, ClipboardList } from "lucide-react";
import { productStore } from "../store/productStore.js";
import { useAdminOrderStore } from "../store/adminOrderStore.js";
import { useReplacementRequestStore } from "../store/replacementRequestStore.js";
import { useChatStore } from "../store/chatStore.js";

const Navbar = () => {

	const { user, logout } = useAuthStore();
	const isAdmin = user?.role === "admin";
	const { cart } = cartStore();
	const navigate = useNavigate();
	const location = useLocation();
	const { isSidebarCollapsed, toggleSidebar } = useSidebar();
	const { fetchPendingOrdersCount } = useAdminOrderStore();
	const { fetchPendingRequestsCount } = useReplacementRequestStore();
	const { fetchPendingChatsCount } = useChatStore();

	// Search state (non-admin)
	const { fetchSuggestions } = productStore();
	const [query, setQuery] = useState("");
	const [suggestions, setSuggestions] = useState([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const suggestionsRef = useRef(null);

	const [isMenuOpen, setIsMenuOpen] = useState(true); // Start with sidebar open on desktop
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
	const profileMenuRef = useRef(null);

	// Scroll detection for navbar hide/show
	const [isNavbarVisible, setIsNavbarVisible] = useState(true);
	const [lastScrollY, setLastScrollY] = useState(0);
	
	// Scroll detection for navbar transparency
	const [isAtTop, setIsAtTop] = useState(true);
	
	// Search bar visibility
	const [isSearchVisible, setIsSearchVisible] = useState(false);
	
	// Pending orders count for admin
	const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
	
	// Pending replacement requests count for admin
	const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
	
	// Pending chats count for admin
	const [pendingChatsCount, setPendingChatsCount] = useState(0);

	useEffect(() => {
		function handleClickOutside(event) {
			if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
				setIsProfileMenuOpen(false);
			}
			if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
				setShowSuggestions(false);
				setIsSearchVisible(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Scroll detection effect
	useEffect(() => {
		// Pages where scroll-based styling should be disabled
		const excludedPages = [
			'/track-orders',
			'/profile', 
			'/account-settings',
			'/my-replacement-request',
			'/replacement-request',
			'/cart',
			'/information',
			'/shipping',
			'/payment',
			'/ratings'
		];
		
		const isExcludedPage = excludedPages.some(page => location.pathname.includes(page));
		
		const handleScroll = () => {
			const currentScrollY = window.scrollY;
			
			// Check if at the very top of the page (only apply scroll styling if not on excluded pages)
			// On excluded pages, always use normal navbar styling (isAtTop = false)
			setIsAtTop(isExcludedPage ? false : currentScrollY === 0);
			
			// Show navbar when at top or scrolling up
			if (currentScrollY < 10) {
				setIsNavbarVisible(true);
			} else if (currentScrollY < lastScrollY) {
				// Scrolling up - show navbar
				setIsNavbarVisible(true);
			} else if (currentScrollY > lastScrollY && currentScrollY > 100) {
				// Scrolling down and past 100px - hide navbar
				setIsNavbarVisible(false);
			}
			
			setLastScrollY(currentScrollY);
		};

		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	}, [lastScrollY, location.pathname]);

	// Fetch pending orders count for admin
	useEffect(() => {
		const fetchPendingCount = async () => {
			if (isAdmin && user) {
				try {
					const count = await fetchPendingOrdersCount();
					setPendingOrdersCount(count);
				} catch (error) {
					console.error('Error fetching pending orders count:', error);
					setPendingOrdersCount(0);
				}
			}
		};

		fetchPendingCount();
		
		// Set up interval to refresh count every 30 seconds
		const interval = setInterval(fetchPendingCount, 30000);
		
		return () => clearInterval(interval);
	}, [isAdmin, user, fetchPendingOrdersCount]);

	// Fetch pending replacement requests count for admin
	useEffect(() => {
		const fetchPendingRequestsCountData = async () => {
			if (isAdmin && user) {
				try {
					const count = await fetchPendingRequestsCount();
					setPendingRequestsCount(count);
				} catch (error) {
					console.error('Error fetching pending replacement requests count:', error);
					setPendingRequestsCount(0);
				}
			}
		};

		fetchPendingRequestsCountData();
		
		// Set up interval to refresh count every 30 seconds
		const interval = setInterval(fetchPendingRequestsCountData, 30000);
		
		return () => clearInterval(interval);
	}, [isAdmin, user, fetchPendingRequestsCount]);

	// Fetch pending chats count for admin
	useEffect(() => {
		const fetchPendingChatsCountData = async () => {
			if (isAdmin && user) {
				try {
					const count = await fetchPendingChatsCount();
					setPendingChatsCount(count);
				} catch (error) {
					console.error('Error fetching pending chats count:', error);
					setPendingChatsCount(0);
				}
			}
		};

		fetchPendingChatsCountData();
		
		// Set up interval to refresh count every 30 seconds
		const interval = setInterval(fetchPendingChatsCountData, 30000);
		
		return () => clearInterval(interval);
	}, [isAdmin, user, fetchPendingChatsCount]);

	const handleSearchSubmit = (e) => {
		e?.preventDefault?.();
		if (!query.trim()) return;
		setShowSuggestions(false);
		navigate(`/search?q=${encodeURIComponent(query.trim())}`);
	};

	const handleQueryChange = async (value) => {
		setQuery(value);
		if (value.trim().length === 0) {
			setSuggestions([]);
			return;
		}
		const data = await fetchSuggestions(value, 7);
		setSuggestions(data);
		setShowSuggestions(true);
	};

	return (
		isAdmin ? (
			
			<header className={`fixed top-0 left-0 w-full bg-transparent backdrop-blur-3xl shadow-lg z-50 transition-all duration-300 border-white ${isNavbarVisible ? 'translate-y-0' : '-translate-y-full'}`}>
				{/* Sidebar for admin - collapsible on desktop, toggleable on mobile */}
				<aside
					className={`fixed top-0 left-0 h-screen bg-[#f8f3ed] z-50 transition-all duration-300 ${
						isMenuOpen ? 'translate-x-0' : '-translate-x-64 lg:translate-x-0'
					} ${
						isSidebarCollapsed ? 'w-16' : 'w-64'
					} flex flex-col`}
					style={{ 
						boxShadow: '2px 0 16px rgba(3,1,5,0.04)',
						backgroundColor: '#f8f3ed',
						background: '#f8f3ed',
						height: '100vh'
					}}
				>
					<div className="flex items-center justify-between px-4 py-4 bg-[#f8f3ed]">
						{!isSidebarCollapsed && (
							<span className="text-lg font-bold text-[#860809] font-libre">Admin Menu</span>
						)}
						<div className="flex items-center gap-2">
							{/* Desktop collapse/expand button */}
							<button
								onClick={toggleSidebar}
								className="hidden lg:block p-2 rounded hover:bg-[#fffefc] transition"
								aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
							>
								<Menu className="text-[#860809] h-5 w-5" />
							</button>
							{/* Mobile close button */}
							<button
								onClick={() => setIsMenuOpen(false)}
								className="lg:hidden p-2 rounded hover:bg-[#fffefc] transition"
								aria-label="Close sidebar"
							>
								<X className="text-[#860809]" />
							</button>
						</div>
					</div>
					<nav className="flex-1 flex flex-col px-2 py-4 gap-1 bg-[#f8f3ed]">
						<Link
							to="/dashboard"
							className={`flex items-center rounded-md font-medium transition-colors duration-200 bg-transparent text-[#030105] hover:bg-[#860809] hover:text-white font-alice ${
								isSidebarCollapsed ? 'px-2 py-3 justify-center' : 'px-4 py-2'
							}`}
							title={isSidebarCollapsed ? "Dashboard" : ""}
						>
							<LayoutDashboard className={`h-5 w-5 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
							{!isSidebarCollapsed && "Dashboard"}
						</Link>
						<Link
							to="/manage-products"
							className={`flex items-center rounded-md font-medium transition-colors duration-200 bg-transparent text-[#030105] hover:bg-[#860809] hover:text-white font-alice ${
								isSidebarCollapsed ? 'px-2 py-3 justify-center' : 'px-4 py-2'
							}`}
							title={isSidebarCollapsed ? "Manage Products" : ""}
						>
							<Package className={`h-5 w-5 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
							{!isSidebarCollapsed && "Manage Products"}
						</Link>
						<Link
							to="/pos"
							className={`flex items-center rounded-md font-medium transition-colors duration-200 bg-transparent text-[#030105] hover:bg-[#860809] hover:text-white font-alice ${
								isSidebarCollapsed ? 'px-2 py-3 justify-center' : 'px-4 py-2'
							}`}
							title={isSidebarCollapsed ? "Point of Sale" : ""}
						>
							<CreditCard className={`h-5 w-5 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
							{!isSidebarCollapsed && "Point of Sale"}
						</Link>
						<Link
							to="/coupons"
							className={`flex items-center rounded-md font-medium transition-colors duration-200 bg-transparent text-[#030105] hover:bg-[#860809] hover:text-white font-alice ${
								isSidebarCollapsed ? 'px-2 py-3 justify-center' : 'px-4 py-2'
							}`}
							title={isSidebarCollapsed ? "Manage Coupons" : ""}
						>
							<Ticket className={`h-5 w-5 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
							{!isSidebarCollapsed && "Manage Coupons"}
						</Link>
						<Link
							to="/order-management"
							className={`flex items-center rounded-md font-medium transition-colors duration-200 bg-transparent text-[#030105] hover:bg-[#860809] hover:text-white font-alice ${
								isSidebarCollapsed ? 'px-2 py-3 justify-center' : 'px-4 py-2'
							}`}
							title={isSidebarCollapsed ? "Order Management" : ""}
						>
							{isSidebarCollapsed ? (
								// When sidebar is collapsed, show badge beside icon
								<div className="relative">
									<ClipboardList className="h-5 w-5" />
									{pendingOrdersCount > 0 && (
										<span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
											{pendingOrdersCount > 99 ? '99+' : pendingOrdersCount}
										</span>
									)}
								</div>
							) : (
								// When sidebar is open, show badge beside text only
								<>
									<ClipboardList className="h-5 w-5 mr-3" />
									<div className="flex items-center justify-between w-full">
										<span>Order Management</span>
										{pendingOrdersCount > 0 && (
											<span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
												{pendingOrdersCount > 99 ? '99+' : pendingOrdersCount}
											</span>
										)}
									</div>
								</>
							)}
						</Link>
						<Link
							to="/admin/replacement-requests"
							className={`flex items-center rounded-md font-medium transition-colors duration-200 bg-transparent text-[#030105] hover:bg-[#860809] hover:text-white font-alice ${
								isSidebarCollapsed ? 'px-2 py-3 justify-center' : 'px-4 py-2'
							}`}
							title={isSidebarCollapsed ? "Replacement Requests" : ""}
						>
							{isSidebarCollapsed ? (
								// When sidebar is collapsed, show badge beside icon
								<div className="relative">
									<RefreshCw className="h-5 w-5" />
									{pendingRequestsCount > 0 && (
										<span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
											{pendingRequestsCount > 99 ? '99+' : pendingRequestsCount}
										</span>
									)}
								</div>
							) : (
								// When sidebar is open, show badge beside text only
								<>
									<RefreshCw className="h-5 w-5 mr-3" />
									<div className="flex items-center justify-between w-full">
										<span>Replacement Requests</span>
										{pendingRequestsCount > 0 && (
											<span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
												{pendingRequestsCount > 99 ? '99+' : pendingRequestsCount}
											</span>
										)}
									</div>
								</>
							)}
						</Link>
						<Link
							to="/admin/chat-management"
							className={`flex items-center rounded-md font-medium transition-colors duration-200 bg-transparent text-[#030105] hover:bg-[#860809] hover:text-white font-alice ${
								isSidebarCollapsed ? 'px-2 py-3 justify-center' : 'px-4 py-2'
							}`}
							title={isSidebarCollapsed ? "Chat Management" : ""}
						>
							{isSidebarCollapsed ? (
								// When sidebar is collapsed, show badge beside icon
								<div className="relative">
									<MessageCircle className="h-5 w-5" />
									{pendingChatsCount > 0 && (
										<span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
											{pendingChatsCount > 99 ? '99+' : pendingChatsCount}
										</span>
									)}
								</div>
							) : (
								// When sidebar is open, show badge beside text only
								<>
									<MessageCircle className="h-5 w-5 mr-3" />
									<div className="flex items-center justify-between w-full">
										<span>Chat Management</span>
										{pendingChatsCount > 0 && (
											<span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
												{pendingChatsCount > 99 ? '99+' : pendingChatsCount}
											</span>
										)}
									</div>
								</>
							)}
						</Link>
					</nav>
				</aside>

				{/* Topbar for admin */}
				<header
					className={`fixed top-0 left-0 w-full h-16 bg-[#fffefc] border-b border-gray-300 z-40 flex items-center transition-all duration-300 ${isNavbarVisible ? 'translate-y-0' : '-translate-y-full'}`}
					style={{ boxShadow: '0 2px 16px rgba(3,1,5,0.04), 0 1px 3px rgba(0,0,0,0.1)', marginLeft: '0' }}
				>
					<div className={`flex items-center justify-between w-full px-4 transition-all duration-300 ${
						isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
					}`}>
										<div className="flex items-center gap-3">
						{/* Sidebar open button for mobile only */}
						<button
							onClick={() => setIsMenuOpen(true)}
								className="lg:hidden p-2 rounded hover:bg-[#f8f3ed] transition"
							aria-label="Open sidebar"
						>
							<Menu className="text-[#860809]" />
						</button>
										<Link
											to="/dashboard"
											className="text-lg sm:text-xl lg:text-2xl font-bold text-[#860809] flex items-center space-x-2 font-nexa"
											style={{ letterSpacing: '0.01em' }}
										>
											<img src="/rosellogo.png" alt="Rosel Logo" className="h-8 w-12 sm:h-10 sm:w-16" />
											Rosel Frozen Meats
										</Link>
						</div>
						<div className="flex items-center gap-4">
							<NotificationBell />
							<div className="relative" ref={profileMenuRef}>
								<button
									onClick={() => setIsProfileMenuOpen((prev) => !prev)}
									className="flex items-center justify-center w-10 h-10 rounded-full bg-[#f8f3ed] hover:bg-[#fffefc] border border-gray-300 overflow-hidden"
									aria-haspopup="menu"
									aria-expanded={isProfileMenuOpen}
								>
									{(user?.profileImageUrl || user?.avatarUrl || user?.profileImage || user?.photoURL || user?.photo) ? (
										<img src={user.profileImageUrl || user.avatarUrl || user.profileImage || user.photoURL || user.photo} alt="Profile" className="w-full h-full object-cover" />
									) : (
										<User className="text-[#860809]" size={20} />
									)}
								</button>

								{isProfileMenuOpen && (
									<div className="absolute right-0 mt-2 w-64 bg-[#fffefc] rounded-md shadow-lg ring-1 ring-gray-300 ring-opacity-5 z-50">
									<div className="px-4 py-3">
											<p className="text-sm font-medium text-[#030105] font-alice">{user?.name || "User"}</p>
											<p className="text-xs text-[#a31f17] truncate font-libre">{user?.email || ""}</p>
									</div>
									<div className="py-1">
											<Link to="/profile" className="block px-4 py-2 text-sm text-[#030105] hover:bg-[#f8f3ed] font-alice" onClick={() => setIsProfileMenuOpen(false)}>My Profile</Link>
											<Link to="/account-settings" className="block px-4 py-2 text-sm text-[#030105] hover:bg-[#f8f3ed] font-alice" onClick={() => setIsProfileMenuOpen(false)}>Account Settings</Link>
											<div className="my-1 border-t border-gray-300" />
											<button className="w-full text-left block px-4 py-2 text-sm text-[#860809] hover:bg-[#f8f3ed] flex items-center font-alice" onClick={() => { setIsProfileMenuOpen(false); logout(); }}>
											<LogOut size={16} className="mr-2" /> Logout
										</button>
									</div>
								</div>
								)}
							</div>
						</div>
					</div>
				</header>

			</header>
			) : (
				<>
					{/* Mobile Sidebar */}
					<div className={`fixed inset-0 z-30 lg:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
						{/* Backdrop */}
						<div 
							className="fixed inset-0 bg-black bg-opacity-50"
							onClick={() => setIsMobileMenuOpen(false)}
						></div>
						
						{/* Sidebar */}
						<div className={`fixed top-0 left-0 h-full w-64 bg-[#f8f3ed] shadow-lg transform transition-transform duration-300 ${
							isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
						}`}> 
								<div className="flex items-center justify-between px-4 py-4 border-b border-[#860809]">
									<span className="text-lg font-bold text-[#860809] font-libre">ROSEL FROZEN MEATS</span>
								<button
									onClick={() => setIsMobileMenuOpen(false)}
										className="p-2 rounded hover:bg-[#fffefc] transition"
									aria-label="Close menu"
								>
										<X className="text-[#860809]" />
								</button>
							</div>
							<nav className="flex flex-col px-4 py-4 space-y-2">
								{!isAdmin && (
									<div className='mb-2' ref={suggestionsRef}>
										<form onSubmit={(e)=>{ handleSearchSubmit(e); setIsMobileMenuOpen(false); }}>
											<input
												type='text'
												value={query}
												onChange={(e)=> handleQueryChange(e.target.value)}
												placeholder='Search products...'
												className='w-full border border-[#f7e9b8] rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#a31f17]'
											/>
										</form>
										{showSuggestions && suggestions?.length > 0 && (
											<div className='mt-2 w-full bg-white border border-[#f7e9b8] rounded-md shadow max-h-64 overflow-auto'>
												{suggestions.map((s) => (
													<button
														key={s._id}
														onClick={() => { setShowSuggestions(false); setIsMobileMenuOpen(false); setQuery(""); navigate(`/product/${s._id}`); }}
														className='w-full text-left px-3 py-2 hover:bg-[#f7e9b8] flex items-center gap-2'
													>
														<img src={s.image} alt={s.name} className='w-8 h-8 object-cover rounded' />
														<span className='text-sm text-[#030105]'>{s.name}</span>
														<span className='ml-auto text-xs text-[#860809]'>₱{s.price}</span>
													</button>
												))}
												<button onClick={(e)=>{ handleSearchSubmit(e); setIsMobileMenuOpen(false); }} className='w-full text-center px-3 py-2 text-[#860809] font-medium border-t border-[#f7e9b8]'>See all results</button>
											</div>
										)}
									</div>
								)}
								<Link
											to={"/welcome"}
											className='text-[#901414] font-semibold hover:text-[#810e0e] transition duration-300 ease-in-out py-2 px-3 rounded hover:bg-[#f7e9b8] font-alice'
											onClick={() => setIsMobileMenuOpen(false)}
										>
											Home
										</Link>
								<Link
											to={"/products"}
											className='text-[#901414] font-semibold hover:text-[#810e0e] transition duration-300 ease-in-out py-2 px-3 rounded hover:bg-[#f7e9b8] font-alice'
											onClick={() => setIsMobileMenuOpen(false)}
										>
											Products
										</Link>
								<Link
											to={"/about"}
											className='text-[#901414] font-semibold hover:text-[#810e0e] transition duration-300 ease-in-out py-2 px-3 rounded hover:bg-[#f7e9b8] font-alice'
											onClick={() => setIsMobileMenuOpen(false)}
										>
											About
										</Link>
								<Link
											to={"/contactus"}
											className='text-[#901414] font-semibold hover:text-[#810e0e] transition duration-300 ease-in-out py-2 px-3 rounded hover:bg-[#f7e9b8] font-alice'
											onClick={() => setIsMobileMenuOpen(false)}
										>
											Contact
										</Link>
								{user && !isAdmin && (
									<Link
										to={"/replacement-requests"}
										className='text-[#901414] font-semibold hover:text-[#810e0e] transition duration-300 ease-in-out py-2 px-3 rounded hover:bg-[#f7e9b8]'
										onClick={() => setIsMobileMenuOpen(false)}
									>
										Replacement Requests
									</Link>
								)}
							</nav>
						</div>
					</div>

					<header className={`fixed top-0 left-0 w-full ${isAtTop ? 'bg-transparent' : 'bg-[#f8f3ed]'} z-20 transition-all duration-300 ${isNavbarVisible ? 'translate-y-0' : '-translate-y-full'}`} style={{ boxShadow: isAtTop ? 'none' : '0 1px 3px rgba(0,0,0,0.1)' }}>
						<div className='container mx-auto px-4 sm:px-8 lg:px-12 py-3 sm:py-4 lg:py-6'>
							<div className='flex flex-wrap justify-between items-center '>
								{/* Mobile menu button and logo */}
								<div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
									<button
										onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
										className={`lg:hidden p-1 sm:p-2 rounded transition ${isAtTop ? 'hover:bg-white/20' : 'hover:bg-[#f7e9b8]'}`}
										aria-label="Toggle menu"
									>
										{isMobileMenuOpen ? <X className={isAtTop ? "text-white" : "text-[#901414]"} size={isAtTop ? 24 : 20} /> : <Menu className={isAtTop ? "text-white" : "text-[#901414]"} size={isAtTop ? 24 : 20} />}
									</button>
									{/* Show logo and brand text only on desktop for customer/guest users */}
									<Link to='/welcome' className={`hidden lg:flex ${isAtTop ? 'text-xl sm:text-2xl lg:text-3xl' : 'text-lg sm:text-xl lg:text-2xl'} font-bold ${isAtTop ? 'text-white' : 'text-[#901414]'} items-center space-x-2 font-nexa`}>
										<img src="/rosellogo.png" alt="Rosel Logo" className={isAtTop ? "h-10 w-15 sm:h-12 sm:w-19" : "h-8 w-12 sm:h-10 sm:w-16"} />
										Rosel Frozen Meats
									</Link>
								</div>

								{/* Desktop Navigation */}
								<nav className='hidden lg:flex flex-wrap items-center [&>*]:mx-5 gap-4 justify-center flex-grow '>
									<Link
												to={"/welcome"}
												className={`${isAtTop ? 'text-lg' : 'text-base'} ${isAtTop ? 'text-white hover:text-white/80' : 'text-[#901414] hover:text-[#810e0e]'} font-semibold transition duration-300 ease-in-out hover:underline hover:underline-offset-8 ${isAtTop ? 'hover:decoration-white/80' : 'hover:decoration-[#810e0e]'} font-alice`}
											>
												Home
											</Link>

									<Link
												to={"/products"} //Add Shop page later
												className={`${isAtTop ? 'text-lg' : 'text-base'} ${isAtTop ? 'text-white hover:text-white/80' : 'text-[#901414] hover:text-[#810e0e]'} font-semibold transition duration-300 ease-in-out hover:underline hover:underline-offset-8 ${isAtTop ? 'hover:decoration-white/80' : 'hover:decoration-[#810e0e]'} font-alice`}
											>
												Products
											</Link>

									<Link
												to={"/about"} //Add About page later
												className={`${isAtTop ? 'text-lg' : 'text-base'} ${isAtTop ? 'text-white hover:text-white/80' : 'text-[#901414] hover:text-[#810e0e]'} font-semibold transition duration-300 ease-in-out hover:underline hover:underline-offset-8 ${isAtTop ? 'hover:decoration-white/80' : 'hover:decoration-[#810e0e]'} font-alice`}
											>
												About
											</Link>
									
									<Link
												to={"/contactus"} //Add Contact page later
												className={`${isAtTop ? 'text-lg' : 'text-base'} ${isAtTop ? 'text-white hover:text-white/80' : 'text-[#901414] hover:text-[#810e0e]'} font-semibold transition duration-300 ease-in-out hover:underline hover:underline-offset-8 ${isAtTop ? 'hover:decoration-white/80' : 'hover:decoration-[#810e0e]'} font-alice`}
											>
												Contact
											</Link>
								</nav>

								<div className='flex items-center gap-1 sm:gap-2 lg:gap-6'>
									{!isAdmin && (
										<div className='hidden lg:block relative' ref={suggestionsRef}>
											{!isSearchVisible ? (
												<button
													onClick={() => setIsSearchVisible(true)}
													className={`p-2 rounded transition ${isAtTop ? 'hover:bg-white/20 text-white' : 'hover:bg-[#f7e9b8] text-[#901414]'}`}
													aria-label="Search"
												>
													<Search size={isAtTop ? 24 : 20} />
												</button>
											) : (
												<div className='w-72'>
											<form onSubmit={handleSearchSubmit}>
												<input
													type='text'
													value={query}
													onChange={(e)=> handleQueryChange(e.target.value)}
													placeholder='Search products...'
															className='w-full border border-[#f7e9b8] bg-white rounded-full px-4 py-2 text-[#901414] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a31f17]'
															autoFocus
												/>
											</form>
											{showSuggestions && suggestions?.length > 0 && (
												<div className='absolute mt-2 w-full bg-white border border-[#f7e9b8] rounded-md shadow-lg z-50 max-h-64 overflow-auto'>
													{suggestions.map((s) => (
														<button
															key={s._id}
																	onClick={() => { setShowSuggestions(false); setQuery(""); setIsSearchVisible(false); navigate(`/product/${s._id}`); }}
															className='w-full text-left px-3 py-2 hover:bg-[#f7e9b8] flex items-center gap-2'
														>
															<img src={s.image} alt={s.name} className='w-8 h-8 object-cover rounded' />
															<span className='text-sm text-[#030105]'>{s.name}</span>
															<span className='ml-auto text-xs text-[#860809]'>₱{s.price}</span>
														</button>
													))}
													<button onClick={handleSearchSubmit} className='w-full text-center px-3 py-2 text-[#860809] font-medium border-t border-[#f7e9b8]'>See all results</button>
														</div>
													)}
												</div>
											)}
										</div>
									)}
									<NotificationBell isAtTop={isAtTop} />
									{/* {user && ( */}
									<Link
										to={"/carts"}
										className={`relative group transition duration-300 ease-in-out p-2 rounded ${isAtTop ? 'text-white hover:text-white/80 hover:bg-white/20' : 'text-[#901414] hover:text-[#810e0e] hover:bg-[#f7e9b8]'}`}
									>
										<ShoppingCart className={`${isAtTop ? 'group-hover:text-white/80' : 'group-hover:text-[#810e0e]'}`} size={isAtTop ? 24 : 20} />
										<span className='hidden sm:inline'>
											{/* Cart */}
										</span>
										{cart.length > 0 && (
											<span
												className={`absolute -top-2 -left-2 ${isAtTop ? 'bg-white text-[#901414] group-hover:bg-white/90' : 'bg-[#901414] text-white group-hover:bg-[#a31f17]'} rounded-full px-2 py-0.5 text-xs transition duration-300 ease-in-out`}
											>
												{cart.length}
											</span>
										)}
									</Link>
								{/* )} */}
								{isAdmin && (
									<Link
										className='bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1 rounded-md font-medium
										 transition duration-300 ease-in-out flex items-center'
										to={"/dashboard"}
									>
										<Lock className='inline-block mr-1' size={18} />
										<span className='hidden sm:inline'>Dashboard</span>
									</Link>
								)}

								{user ? (
									<div className='relative' ref={profileMenuRef}>
										<button
											onClick={() => setIsProfileMenuOpen((prev) => !prev)}
											className={`p-2 rounded transition-colors duration-200 ${isAtTop ? 'hover:bg-white/20 text-white hover:text-white/80' : 'hover:bg-[#f7e9b8] text-[#901414] hover:text-[#810e0e]'}`}
											aria-haspopup='menu'
											aria-expanded={isProfileMenuOpen}
										>
											{user && (user.profileImageUrl || user.avatarUrl || user.profileImage || user.photoURL || user.photo) ? (
												<img src={user.profileImageUrl || user.avatarUrl || user.profileImage || user.photoURL || user.photo} alt='Profile' className={`${isAtTop ? 'w-6 h-6 sm:w-7 sm:h-7' : 'w-5 h-5 sm:w-6 sm:h-6'} object-cover rounded-full`} />
											) : (
												<User size={isAtTop ? 24 : 20} />
											)}
										</button>

										{isProfileMenuOpen && (
											<div className='absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50'>
												{user ? (
													<>
														<div className='px-4 py-3'>
															<p className='text-sm font-medium text-gray-900'>{user?.name || 'User'}</p>
															<p className='text-xs text-gray-500 truncate'>{user?.email || ''}</p>
														</div>
														<div className='py-1'>
															<Link to='/profile' className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100' onClick={() => setIsProfileMenuOpen(false)}>My Profile</Link>
															<Link to='/account-settings' className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100' onClick={() => setIsProfileMenuOpen(false)}>Account Settings</Link>
															<Link to='/track-orders' className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100' onClick={() => setIsProfileMenuOpen(false)}>Track Orders</Link>
															<Link to='/replacement-requests' className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100' onClick={() => setIsProfileMenuOpen(false)}>Replacement Requests</Link>
															<div className='my-1 border-t border-gray-200' />
															<button className='w-full text-left block px-4 py-2 text-sm text-[#901414] hover:bg-gray-100 flex items-center' onClick={() => { setIsProfileMenuOpen(false); logout(); }}>
																<LogOut size={16} className='mr-2' /> Log Out
															</button>
														</div>
													</>
												) : (
													<div className='py-1'>
														<Link to='/login' className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100' onClick={() => setIsProfileMenuOpen(false)}>Login</Link>
														<Link to='/signup' className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100' onClick={() => setIsProfileMenuOpen(false)}>Sign Up</Link>
													</div>
												)}
											</div>
										)}
									</div>
								) : (
									<div className='relative' ref={profileMenuRef}>
										<button
											onClick={() => setIsProfileMenuOpen((prev) => !prev)}
											className={`p-2 rounded transition-colors duration-200 ${isAtTop ? 'hover:bg-white/20 text-white hover:text-white/80' : 'hover:bg-[#f7e9b8] text-[#901414] hover:text-[#810e0e]'}`}
											aria-haspopup='menu'
											aria-expanded={isProfileMenuOpen}
										>
											<User size={isAtTop ? 24 : 20} />
										</button>

										{isProfileMenuOpen && (
											<div className='absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50'>
												<div className='py-1'>
													<Link to='/login' className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100' onClick={() => setIsProfileMenuOpen(false)}>Login</Link>
													<Link to='/signup' className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100' onClick={() => setIsProfileMenuOpen(false)}>Sign Up</Link>
												</div>
											</div>
										)}
									</div>
								)
							}



							</div>
							</div>
							</div>
						</header>
				</>
			)
		);
};
export default Navbar;