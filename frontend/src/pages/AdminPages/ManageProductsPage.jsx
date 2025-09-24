import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { productStore } from "../../store/productStore.js";
import { useAuthStore } from "../../store/authStore.js";
import { PlusCircle, Edit3, Eye, Package, Upload, Loader, Trash2, Star, ScanLine, ChevronUp, ChevronDown, History, Minus } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import AdminLayout from "../../components/AdminLayout.jsx";
import toast from "react-hot-toast";
import axios from "axios";

const FIXED_CATEGORIES = ["pork", "beef", "chicken", "sliced", "processed", "ground"]; // align with backend

const STOCK_OUT_REASONS = [
	{ value: "defective", label: "Defective" },
	{ value: "returned", label: "Returned" },
	{ value: "expired", label: "Expired" },
	{ value: "damaged", label: "Damaged" },
	{ value: "theft", label: "Theft" },
	{ value: "waste", label: "Waste" },
	{ value: "other", label: "Other" }
];

const ManageProductsPage = () => {
	const { isAuthenticated, isCheckingAuth } = useAuthStore();
	const {
		products,
		loading,
		createProduct,
		fetchAllProducts,
		updateProduct,
		updateProductQuantity,
		addProductQuantity,
		removeProductQuantity,
		deleteProduct,
	} = productStore();

	const [activeTab, setActiveTab] = useState("monitor"); // create | update | monitor

	// Create product state
	const [newProduct, setNewProduct] = useState({
		name: "",
		description: "",
		price: "",
		category: "",
		quantity: "",
		images: [], // base64 strings
		barcode: "",
	});

	// Update product state
	const [selectedProductId, setSelectedProductId] = useState("");
	const selectedProduct = useMemo(() => products.find(p => p._id === selectedProductId), [products, selectedProductId]);
	const [editFields, setEditFields] = useState({ price: "", description: "", status: "available", isFeatured: false });
	const [newImages, setNewImages] = useState([]); // base64
	const [removeImageUrls, setRemoveImageUrls] = useState([]);
	const [mainImageUrl, setMainImageUrl] = useState("");
	const [qtyAction, setQtyAction] = useState("add"); // add only
	const [qtyValue, setQtyValue] = useState("");
    const [scanAccum, setScanAccum] = useState(0);
    const [scanActive, setScanActive] = useState(false);
    
    // Stock removal state
    const [stockOutQuantity, setStockOutQuantity] = useState("");
    const [stockOutReason, setStockOutReason] = useState("");
    const [showStockOutConfirm, setShowStockOutConfirm] = useState(false);

    // Barcode modes and scan feedback
    const [createBarcodeMode, setCreateBarcodeMode] = useState("manual"); // manual | usb | camera
    const [updateSearchMode, setUpdateSearchMode] = useState("manual"); // manual | usb | camera
    const [qtyScanMode, setQtyScanMode] = useState("usb"); // usb | camera
    const [monitorSearchMode, setMonitorSearchMode] = useState("manual"); // manual | usb | camera

    const [lastScannedCreate, setLastScannedCreate] = useState("");
    const [lastScannedSearch, setLastScannedSearch] = useState("");
    const [lastScannedMonitor, setLastScannedMonitor] = useState("");
    const [lastScannedQty, setLastScannedQty] = useState("");
    const [invalidQtyScan, setInvalidQtyScan] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	// Monitor filters
	const [filterText, setFilterText] = useState("");
	const [filterCategory, setFilterCategory] = useState("");
	const [filterStatus, setFilterStatus] = useState("");
	const [sortKey, setSortKey] = useState("nameAsc");
	
	// Update tab filters and sort
	const [updateFilterText, setUpdateFilterText] = useState("");
	const [updateFilterCategory, setUpdateFilterCategory] = useState("");
	const [updateFilterStatus, setUpdateFilterStatus] = useState("");
	const [updateSortKey, setUpdateSortKey] = useState("nameAsc");
	
	// Activity log state
	const [activityLogs, setActivityLogs] = useState([]);
	const [activityLoading, setActivityLoading] = useState(false);
	const [activityFilter, setActivityFilter] = useState(""); // filter by product name
	const [activityTypeFilter, setActivityTypeFilter] = useState(""); // filter by activity type
	const [activitySortKey, setActivitySortKey] = useState("dateDesc"); // sort by date

	useEffect(() => {
		if (isAuthenticated && !isCheckingAuth) {
			fetchAllProducts();
		}
	}, [isAuthenticated, isCheckingAuth, fetchAllProducts]);

	useEffect(() => {
		if (activeTab === 'activity' && isAuthenticated && !isCheckingAuth) {
			fetchActivityLogs();
		}
	}, [activeTab, isAuthenticated, isCheckingAuth]);

	useEffect(() => {
		if (selectedProduct) {
			setEditFields({
				price: String(selectedProduct.price ?? ""),
				description: selectedProduct.description || "",
				status: selectedProduct.status || "available",
				isFeatured: !!selectedProduct.isFeatured,
			});
			setMainImageUrl(selectedProduct.mainImageUrl || selectedProduct.image || "");
			setRemoveImageUrls([]);
			setNewImages([]);
			setQtyValue("");
		}
	}, [selectedProduct]);

	const handleCreateImageChange = (e) => {
		const files = Array.from(e.target.files || []);
		files.forEach((file) => {
			const reader = new FileReader();
			reader.onloadend = () => {
				setNewProduct((prev) => ({ ...prev, images: [...prev.images, reader.result] }));
			};
			reader.readAsDataURL(file);
		});
	};

	const handleRemoveCreateImage = (indexToRemove) => {
		setNewProduct((prev) => ({
			...prev,
			images: prev.images.filter((_, index) => index !== indexToRemove)
		}));
	};

	const handleUpdateImageChange = (e) => {
		const files = Array.from(e.target.files || []);
		files.forEach((file) => {
			const reader = new FileReader();
			reader.onloadend = () => setNewImages((prev) => [...prev, reader.result]);
			reader.readAsDataURL(file);
		});
	};

	const onCreate = async (e) => {
		e.preventDefault();
		await createProduct({
			name: newProduct.name,
			description: newProduct.description,
			price: Number(newProduct.price),
			category: newProduct.category,
			quantity: Number(newProduct.quantity),
			images: newProduct.images,
			barcode: newProduct.barcode?.trim() || undefined,
		});
		setNewProduct({ name: "", description: "", price: "", category: "", quantity: "", images: [], barcode: "" });
	};

	const onUpdate = async (e) => {
		e.preventDefault();
		if (!selectedProduct) return;
		const payload = {
			price: Number(editFields.price),
			description: editFields.description,
			status: editFields.status,
			isFeatured: !!editFields.isFeatured,
			addImages: newImages,
			removeImageUrls,
			mainImageUrl: mainImageUrl || undefined,
		};
		await updateProduct(selectedProduct._id, payload);
	};

	const onUpdateQuantity = async (e) => {
		e.preventDefault();
		if (!selectedProduct) return;
		
		// Use accumulated scan count if available, otherwise use manual input value
		const valueToUse = scanAccum !== 0 ? scanAccum : parseInt(qtyValue, 10);
		if (Number.isNaN(valueToUse) || valueToUse < 0) {
			toast.error("Please enter a valid quantity (whole numbers only, 0 or above)");
			return;
		}
		
		// Check if the input contains decimals
		if (qtyValue && qtyValue.includes('.')) {
			toast.error("Please enter whole numbers only (no decimals)");
			return;
		}
		
		// Only add quantity (stock in)
		await addProductQuantity(selectedProduct._id, valueToUse);
		
		// Reset both values after successful update
		setQtyValue("");
		setScanAccum(0);
	};

	const handleDeleteProduct = async () => {
		if (!selectedProduct) return;
		await deleteProduct(selectedProduct._id);
		setSelectedProductId(null);
		setShowDeleteConfirm(false);
	};

	const handleStockOut = async () => {
		if (!selectedProduct || !stockOutQuantity || !stockOutReason) {
			toast.error("Please enter quantity and select a reason for stock removal");
			return;
		}

		// Check if the input contains decimals
		if (stockOutQuantity && stockOutQuantity.includes('.')) {
			toast.error("Please enter whole numbers only (no decimals)");
			return;
		}

		const quantity = parseInt(stockOutQuantity, 10);
		if (Number.isNaN(quantity) || quantity < 0) {
			toast.error("Please enter a valid quantity (whole numbers only, 0 or above)");
			return;
		}

		if (quantity > selectedProduct.quantity) {
			toast.error("Cannot remove more stock than available");
			return;
		}

		setShowStockOutConfirm(true);
	};

	const confirmStockOut = async () => {
		if (!selectedProduct) return;
		
		const quantity = parseInt(stockOutQuantity, 10);
		await removeProductQuantity(selectedProduct._id, quantity, stockOutReason);
		
		// Reset form
		setStockOutQuantity("");
		setStockOutReason("");
		setShowStockOutConfirm(false);
	};

	const handleSort = (field, direction) => {
		const sortKey = direction === 'asc' ? `${field}Asc` : `${field}Desc`;
		setSortKey(sortKey);
	};

	const handleUpdateSort = (field, direction) => {
		const sortKey = direction === 'asc' ? `${field}Asc` : `${field}Desc`;
		setUpdateSortKey(sortKey);
	};

	const handleActivitySort = (field, direction) => {
		const sortKey = direction === 'asc' ? `${field}Asc` : `${field}Desc`;
		setActivitySortKey(sortKey);
	};

	const fetchActivityLogs = async () => {
		setActivityLoading(true);
		try {
			const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
			const response = await axios.get(`${API_URL}/activity-logs`, {
				params: {
					page: 1,
					limit: 100,
					sort: 'createdAt',
					order: 'desc'
				}
			});
			
			console.log('Activity logs response:', response.data);
			
			// Check if response.data.logs exists and is an array
			const logs = response.data.logs || response.data || [];
			
			if (!Array.isArray(logs)) {
				console.error('Invalid response format - logs is not an array:', logs);
				setActivityLogs([]);
				return;
			}
			
			// If no logs found, show empty array (this is normal for new installations)
			if (logs.length === 0) {
				console.log('No activity logs found - this is normal for new installations');
				setActivityLogs([]);
				return;
			}
			
			// Transform the response data to match the expected format
			const transformedLogs = logs.map(log => ({
				id: log._id,
				productId: log.productId,
				productName: log.productName,
				action: log.action,
				details: log.details,
				adminName: log.adminName,
				timestamp: new Date(log.createdAt),
				changes: log.changes || {},
				quantityChange: log.quantityChange,
				oldQuantity: log.oldQuantity,
				newQuantity: log.newQuantity,
				reason: log.reason
			}));
			
			setActivityLogs(transformedLogs);
		} catch (error) {
			console.error('Error fetching activity logs:', error);
			toast.error('Failed to fetch activity logs');
			setActivityLogs([]);
		} finally {
			setActivityLoading(false);
		}
	};

	const filteredProducts = useMemo(() => {
		return (products || [])
			.filter(p => !filterText || 
				p.name.toLowerCase().includes(filterText.toLowerCase()) ||
				p.barcode?.toLowerCase().includes(filterText.toLowerCase())
			)
			.filter(p => !filterCategory || p.category === filterCategory)
			.filter(p => !filterStatus || p.status === filterStatus)
			.slice()
			.sort((a,b)=>{
				switch(sortKey){
					case 'nameAsc': return a.name.localeCompare(b.name);
					case 'nameDesc': return b.name.localeCompare(a.name);
					case 'catAsc': return (a.category||'').localeCompare(b.category||'');
					case 'catDesc': return (b.category||'').localeCompare(a.category||'');
					case 'qtyAsc': return (a.quantity||0)-(b.quantity||0);
					case 'qtyDesc': return (b.quantity||0)-(a.quantity||0);
					case 'priceAsc': return (a.price||0)-(b.price||0);
					case 'priceDesc': return (b.price||0)-(a.price||0);
					case 'barcodeAsc': return (a.barcode||'').localeCompare(b.barcode||'');
					case 'barcodeDesc': return (b.barcode||'').localeCompare(a.barcode||'');
					case 'statusAsc': return (a.status||'').localeCompare(b.status||'');
					case 'statusDesc': return (b.status||'').localeCompare(a.status||'');
					case 'featuredAsc': return (a.isFeatured ? 1 : 0) - (b.isFeatured ? 1 : 0);
					case 'featuredDesc': return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
					case 'valueAsc': return ((a.price||0)*(a.quantity||0))-((b.price||0)*(b.quantity||0));
					case 'valueDesc': return ((b.price||0)*(b.quantity||0))-((a.price||0)*(a.quantity||0));
					default: return a.name.localeCompare(b.name);
				}
			});
	}, [products, filterText, filterCategory, filterStatus, sortKey]);

	const filteredUpdateProducts = useMemo(() => {
		return (products || [])
			.filter(p => !updateFilterText || 
				p.name.toLowerCase().includes(updateFilterText.toLowerCase()) ||
				p.barcode?.toLowerCase().includes(updateFilterText.toLowerCase())
			)
			.filter(p => !updateFilterCategory || p.category === updateFilterCategory)
			.filter(p => !updateFilterStatus || p.status === updateFilterStatus)
			.slice()
			.sort((a,b)=>{
				switch(updateSortKey){
					case 'nameAsc': return a.name.localeCompare(b.name);
					case 'nameDesc': return b.name.localeCompare(a.name);
					case 'catAsc': return (a.category||'').localeCompare(b.category||'');
					case 'catDesc': return (b.category||'').localeCompare(a.category||'');
					case 'qtyAsc': return (a.quantity||0)-(b.quantity||0);
					case 'qtyDesc': return (b.quantity||0)-(a.quantity||0);
					case 'priceAsc': return (a.price||0)-(b.price||0);
					case 'priceDesc': return (b.price||0)-(a.price||0);
					case 'barcodeAsc': return (a.barcode||'').localeCompare(b.barcode||'');
					case 'barcodeDesc': return (b.barcode||'').localeCompare(a.barcode||'');
					case 'statusAsc': return (a.status||'').localeCompare(b.status||'');
					case 'statusDesc': return (b.status||'').localeCompare(a.status||'');
					case 'featuredAsc': return (a.isFeatured ? 1 : 0) - (b.isFeatured ? 1 : 0);
					case 'featuredDesc': return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
					case 'valueAsc': return ((a.price||0)*(a.quantity||0))-((b.price||0)*(b.quantity||0));
					case 'valueDesc': return ((b.price||0)*(b.quantity||0))-((a.price||0)*(a.quantity||0));
					default: return a.name.localeCompare(b.name);
				}
			});
	}, [products, updateFilterText, updateFilterCategory, updateFilterStatus, updateSortKey]);

	const filteredActivityLogs = useMemo(() => {
		return activityLogs
			.filter(log => !activityFilter || 
				log.productName.toLowerCase().includes(activityFilter.toLowerCase()) ||
				log.adminName.toLowerCase().includes(activityFilter.toLowerCase())
			)
			.filter(log => !activityTypeFilter || log.action === activityTypeFilter)
			.slice()
			.sort((a, b) => {
				switch(activitySortKey) {
					case 'dateAsc': return new Date(a.timestamp) - new Date(b.timestamp);
					case 'dateDesc': return new Date(b.timestamp) - new Date(a.timestamp);
					case 'productAsc': return a.productName.localeCompare(b.productName);
					case 'productDesc': return b.productName.localeCompare(a.productName);
					case 'actionAsc': return a.action.localeCompare(b.action);
					case 'actionDesc': return b.action.localeCompare(a.action);
					case 'adminAsc': return a.adminName.localeCompare(b.adminName);
					case 'adminDesc': return b.adminName.localeCompare(a.adminName);
					default: return new Date(b.timestamp) - new Date(a.timestamp);
				}
			});
	}, [activityLogs, activityFilter, activityTypeFilter, activitySortKey]);

	// Debounced USB (keyboard wedge) handlers per mode
	useEffect(() => {
		const activeUsb = createBarcodeMode === 'usb' || updateSearchMode === 'usb' || qtyScanMode === 'usb' || monitorSearchMode === 'usb';
		if (!activeUsb) return;
		let buffer = '';
		let lastTs = 0;
		const onKey = async (e) => {
			const now = Date.now();
			if (now - lastTs > 50) buffer = '';
			if (e.key === 'Enter') {
				const code = buffer;
				buffer = '';
				if (!code) { lastTs = now; return; }
				// route scan by active mode precedence: quantity > update search > create > monitor
				if (qtyScanMode === 'usb' && selectedProduct) {
					console.log('USB Scanner - Quantity Update Mode:');
					console.log('Raw scanned code:', code);
					console.log('Code length:', code.length);
					console.log('Code type:', typeof code);
					
					// Format the scanned code to match expected barcode format (JKLjkl3456 -> JKL-jkl-3456)
					let formattedCode = code;
					if (code.length >= 9 && /^[A-Za-z0-9]+$/.test(code)) {
						// Insert hyphens at positions 3 and 6 (0-indexed: after 3rd and 6th characters)
						formattedCode = code.slice(0, 3) + '-' + code.slice(3, 6) + '-' + code.slice(6);
					}
					
					console.log('Formatted code:', formattedCode);
					console.log('Selected product barcode:', selectedProduct.barcode);
					console.log('Selected product barcode type:', typeof selectedProduct.barcode);
					console.log('Barcode comparison (formattedCode === selectedProduct.barcode):', formattedCode === selectedProduct.barcode);
					console.log('Barcode comparison (formattedCode == selectedProduct.barcode):', formattedCode == selectedProduct.barcode);
					
					setLastScannedQty(formattedCode);
					if (selectedProduct.barcode && formattedCode === selectedProduct.barcode) {
						console.log('Barcode match - adding to stock');
						setInvalidQtyScan('');
						setScanAccum((prev)=> prev + 1);
					} else {
						console.log('Barcode mismatch - showing invalid barcode error');
						setInvalidQtyScan('invalid barcode');
					}
				} else if (updateSearchMode === 'usb') {
					// Format the scanned code to match expected barcode format (ABCabc1234 -> ABC-abc-1234)
					let formattedCode = code;
					if (code.length >= 9 && /^[A-Za-z0-9]+$/.test(code)) {
						// Insert hyphens at positions 3 and 6 (0-indexed: after 3rd and 6th characters)
						formattedCode = code.slice(0, 3) + '-' + code.slice(3, 6) + '-' + code.slice(6);
					}
					setLastScannedSearch(formattedCode);
					const p = await productStore.getState().fetchProductByBarcode(formattedCode);
					if (p) {
						// Set filter text to show the product in the list, then select it
						setFilterText(p.name);
						setSelectedProductId(p._id);
					}
				} else if (createBarcodeMode === 'usb') {
					// Format the scanned code to match expected barcode format (ABCabc1234 -> ABC-abc-1234)
					let formattedCode = code;
					if (code.length >= 9 && /^[A-Za-z0-9]+$/.test(code)) {
						// Insert hyphens at positions 3 and 6 (0-indexed: after 3rd and 6th characters)
						formattedCode = code.slice(0, 3) + '-' + code.slice(3, 6) + '-' + code.slice(6);
					}
					setLastScannedCreate(formattedCode);
					setNewProduct((prev)=> ({ ...prev, barcode: formattedCode }));
				} else if (monitorSearchMode === 'usb') {
					// Format the scanned code to match expected barcode format (ABCabc1234 -> ABC-abc-1234)
					let formattedCode = code;
					if (code.length >= 9 && /^[A-Za-z0-9]+$/.test(code)) {
						// Insert hyphens at positions 3 and 6 (0-indexed: after 3rd and 6th characters)
						formattedCode = code.slice(0, 3) + '-' + code.slice(3, 6) + '-' + code.slice(6);
					}
					setLastScannedMonitor(formattedCode);
					setFilterText(formattedCode);
				}
				lastTs = now;
				return;
			}
			if (/^[0-9A-Za-z]$/.test(e.key)) buffer += e.key;
			lastTs = now;
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [createBarcodeMode, updateSearchMode, qtyScanMode, monitorSearchMode, selectedProduct, qtyAction]);

	if (isCheckingAuth) {
		return (
			<AdminLayout>
				<div className='py-8'>
					<div className='flex justify-center items-center min-h-[400px]'>
						<div className='text-[#82695b] text-lg'>Checking authentication...</div>
					</div>
				</div>
			</AdminLayout>
		);
	}

	if (!isAuthenticated) {
		return (
			<AdminLayout>
				<div className='py-8'>
					<div className='flex justify-center items-center min-h-[400px]'>
						<div className='text-[#82695b] text-lg'>Please log in to manage products</div>
					</div>
				</div>
			</AdminLayout>
		);
	}

	return (
		<AdminLayout>
			<div className='py-8 px-4 bg-[#f8f3ed] min-h-screen'>
				<div className='max-w-7xl mx-auto'>
				{/* Page Title */}
				<div className='mb-6'>
					<h1 className='text-3xl font-bold text-[#860809] font-libre mb-2'>Product Management</h1>
					<p className='text-[#a31f17] font-alice'>Manage your product inventory, create new products, and track product activity</p>
				</div>
				
				<div className='mb-6 flex items-center gap-2'>
					<button onClick={()=>setActiveTab('monitor')} className={`px-3 py-2 rounded font-alice ${activeTab==='monitor' ? 'bg-[#860809] text-white' : 'bg-[#a31f17] text-white'}`}><Eye className='inline mr-2' />Monitor</button>
					<button onClick={()=>setActiveTab('create')} className={`px-3 py-2 rounded font-alice ${activeTab==='create' ? 'bg-[#860809] text-white' : 'bg-[#a31f17] text-white'}`}><PlusCircle className='inline mr-2' />Create</button>
					<button onClick={()=>setActiveTab('update')} className={`px-3 py-2 rounded font-alice ${activeTab==='update' ? 'bg-[#860809] text-white' : 'bg-[#a31f17] text-white'}`}><Edit3 className='inline mr-2' />Update</button>
					<button onClick={()=>setActiveTab('activity')} className={`px-3 py-2 rounded font-alice ${activeTab==='activity' ? 'bg-[#860809] text-white' : 'bg-[#a31f17] text-white'}`}><History className='inline mr-2' />Activity Log</button>
				</div>

				{/* Create Tab */}
				{activeTab === 'create' && (
					<motion.div className='bg-[#fffefc] shadow-lg rounded-lg p-6 border border-gray-300' initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
						<form onSubmit={onCreate} className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div>
									<label className='block text-sm text-[#a31f17] mb-1 font-medium font-alice'>Product Name</label>
									<input value={newProduct.name} onChange={(e)=>setNewProduct({...newProduct, name: e.target.value})} className='w-full bg-[#fffefc] border border-gray-300 rounded px-3 py-2 text-[#030105] focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice' required />
							</div>
							<div>
									<label className='block text-sm text-[#a31f17] mb-1 font-medium font-alice'>Category</label>
									<select value={newProduct.category} onChange={(e)=>setNewProduct({...newProduct, category: e.target.value})} className='w-full bg-[#fffefc] border border-gray-300 rounded px-3 py-2 text-[#030105] focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice' required>
									<option value=''>Select</option>
									{FIXED_CATEGORIES.map(c=> <option key={c} value={c}>{c}</option>)}
								</select>
							</div>
							<div>
									<label className='block text-sm text-[#a31f17] mb-1 font-medium font-alice'>Price</label>
									<input type='number' step='0.01' value={newProduct.price} onChange={(e)=>setNewProduct({...newProduct, price: e.target.value})} className='w-full bg-[#fffefc] border border-gray-300 rounded px-3 py-2 text-[#030105] focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice' required />
							</div>
							<div>
									<label className='block text-sm text-[#a31f17] mb-1 font-medium font-alice'>Stocks (quantity)</label>
									<input type='number' min='0' value={newProduct.quantity} onChange={(e)=>setNewProduct({...newProduct, quantity: e.target.value})} className='w-full bg-[#fffefc] border border-gray-300 rounded px-3 py-2 text-[#030105] focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice' required />
							</div>
							<div>
								<label className='block text-sm text-[#82695b] mb-1 font-medium'>Barcode</label>
								<div className='flex items-center gap-2 mb-2'>
											<select value={createBarcodeMode} onChange={(e)=>setCreateBarcodeMode(e.target.value)} className='bg-[#fffefc] border border-gray-300 rounded px-2 py-2 text-[#030105] focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice'>
										<option value='manual'>Manual</option>
										<option value='usb'>USB Scanner</option>
										<option value='camera'>Camera</option>
									</select>
								</div>
									{createBarcodeMode !== 'camera' && (
											<input value={newProduct.barcode} onChange={(e)=>setNewProduct({...newProduct, barcode: e.target.value})} placeholder='Scan or enter barcode' className='w-full bg-[#fffefc] border border-gray-300 rounded px-3 py-2 text-[#030105] focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice' />
									)}
									{createBarcodeMode === 'camera' && (
											<div className='bg-[#fffefc] border border-gray-300 rounded p-3'>
											<div className='flex items-center gap-2 mb-2'>
													<button type='button' onClick={async()=>{ try{ const reader = new BrowserMultiFormatReader(); const controls = await reader.decodeFromVideoDevice(null, document.getElementById('create-scan-video'), (result)=>{ if(result){ const code = result.getText(); setLastScannedCreate(code); setNewProduct((prev)=>({ ...prev, barcode: code })); } }); window.__createScanControls = controls; }catch{}}} className='px-3 py-2 bg-[#860809] border border-[#860809] rounded text-white hover:bg-[#7a0f0f] flex items-center gap-2 font-alice'><ScanLine className='h-4 w-4'/> Start Camera</button>
													<button type='button' onClick={()=>{ try{ window.__createScanControls?.stop?.(); }catch{} }} className='px-3 py-2 bg-[#a31f17] border border-[#a31f17] rounded text-white hover:bg-[#8a1a14] font-alice'>Stop</button>
											</div>
											<video id='create-scan-video' style={{ width: 240, height: 160 }} muted playsInline />
												<div className='text-xs text-[#a31f17] mt-2 font-alice'>Last scanned: {lastScannedCreate || '—'}</div>
										</div>
									)}
							</div>
							<div className='md:col-span-2'>
									<label className='block text-sm text-[#a31f17] mb-1 font-medium font-alice'>Description</label>
									<textarea rows='3' value={newProduct.description} onChange={(e)=>setNewProduct({...newProduct, description: e.target.value})} className='w-full bg-[#fffefc] border border-gray-300 rounded px-3 py-2 text-[#030105] focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice' required />
							</div>
							<div className='md:col-span-2'>
									<label className='block text-sm text-[#a31f17] mb-2 font-medium font-alice'>Images</label>
								<input type='file' accept='image/*' multiple onChange={handleCreateImageChange} className='hidden' id='create-images' />
										<label htmlFor='create-images' className='inline-flex items-center gap-2 px-3 py-2 bg-[#a31f17] border border-[#a31f17] rounded text-white cursor-pointer hover:bg-[#8a1a14] transition-colors font-alice'><Upload className='h-4 w-4' /> Upload Images</label>
								<div className='mt-2 flex flex-wrap gap-2'>
									{newProduct.images.map((img, idx)=> (
										<div key={idx} className='relative group'>
											<img src={img} alt='preview' className='w-16 h-16 object-cover rounded border border-gray-300' />
											<button
												type='button'
												onClick={() => handleRemoveCreateImage(idx)}
												className='absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200'
												title='Remove image'
											>
												<Minus className='h-3 w-3' />
											</button>
										</div>
									))}
								</div>
							</div>
							<div className='md:col-span-2'>
									<button type='submit' disabled={loading} className='w-full bg-[#860809] hover:bg-[#7a0f0f] text-white font-semibold py-2 rounded flex items-center justify-center transition-colors disabled:opacity-50 font-alice'>
									{loading ? (<><Loader className='h-5 w-5 mr-2 animate-spin' />Creating...</>) : (<><PlusCircle className='h-5 w-5 mr-2' />Create Product</>)}
								</button>
							</div>
						</form>
					</motion.div>
				)}

				{/* Update Tab */}
				{activeTab === 'update' && (
					<motion.div className='bg-[#fffefc] shadow-lg rounded-lg p-6 border border-gray-300' initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
						<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
							{/* Product selector */}
							<div className='lg:col-span-1'>
									<h3 className='text-lg font-semibold text-[#860809] mb-3 font-libre'>Select Product</h3>
								
								{/* Filter Controls */}
								<div className='mb-3 space-y-2'>
								<input
										placeholder='Search by name or barcode'
										value={updateFilterText}
										onChange={(e)=>setUpdateFilterText(e.target.value)}
										onKeyDown={async (e)=>{ if(e.key==='Enter' && updateFilterText.trim()){ const p = await productStore.getState().fetchProductByBarcode(updateFilterText.trim()); if(p){ setSelectedProductId(p._id); } } }}
												className='w-full bg-[#fffefc] border border-gray-300 rounded px-3 py-2 text-[#030105] focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice'
									/>
									<div className='grid grid-cols-2 gap-2'>
										<select 
											value={updateFilterCategory} 
											onChange={(e)=>setUpdateFilterCategory(e.target.value)} 
														className='bg-[#fffefc] border border-gray-300 rounded px-2 py-2 text-[#030105] focus:ring-2 focus:ring-[#860809] focus:border-transparent text-sm font-alice'
										>
											<option value=''>All Categories</option>
											{FIXED_CATEGORIES.map(c=> <option key={c} value={c}>{c}</option>)}
										</select>
										<select 
											value={updateFilterStatus} 
											onChange={(e)=>setUpdateFilterStatus(e.target.value)} 
														className='bg-[#fffefc] border border-gray-300 rounded px-2 py-2 text-[#030105] focus:ring-2 focus:ring-[#860809] focus:border-transparent text-sm font-alice'
										>
											<option value=''>All Status</option>
											<option value='available'>Available</option>
											<option value='unavailable'>Unavailable</option>
										</select>
									</div>
								</div>
								<div className='flex items-center gap-2 mb-2'>
												<label className='text-xs text-[#a31f17] font-alice'>Search mode</label>
												<select value={updateSearchMode} onChange={(e)=>setUpdateSearchMode(e.target.value)} className='bg-[#fffefc] border border-gray-300 rounded px-2 py-1 text-[#030105] focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice'>
										<option value='manual'>Manual</option>
										<option value='usb'>USB Scanner</option>
										<option value='camera'>Camera</option>
									</select>
								</div>
								{updateSearchMode === 'camera' && (
												<div className='bg-[#fffefc] border border-gray-300 rounded p-3 mb-2'>
										<div className='flex items-center gap-2 mb-2'>
														<button type='button' onClick={async()=>{ try{ const reader = new BrowserMultiFormatReader(); const controls = await reader.decodeFromVideoDevice(null, document.getElementById('search-scan-video'), async (result)=>{ if(result){ const code = result.getText(); setLastScannedSearch(code); const p = await productStore.getState().fetchProductByBarcode(code); if(p){ setSelectedProductId(p._id); } } }); window.__searchScanControls = controls; }catch{}}} className='px-3 py-2 bg-[#860809] border border-[#860809] rounded text-white hover:bg-[#7a0f0f] flex items-center gap-2 font-alice'><ScanLine className='h-4 w-4'/> Start Camera</button>
														<button type='button' onClick={()=>{ try{ window.__searchScanControls?.stop?.(); }catch{} }} className='px-3 py-2 bg-[#a31f17] border border-[#a31f17] rounded text-white hover:bg-[#8a1a14] font-alice'>Stop</button>
										</div>
										<video id='search-scan-video' style={{ width: 240, height: 160 }} muted playsInline />
													<div className='text-xs text-[#a31f17] mt-2 font-alice'>Last scanned: {lastScannedSearch || '—'}</div>
									</div>
								)}
								{/* Sort Controls */}
								<div className='mb-2 flex items-center justify-between'>
												<span className='text-xs text-[#a31f17] font-alice'>Sort by:</span>
									<div className='flex gap-1'>
										<button 
											onClick={() => handleUpdateSort('name', updateSortKey === 'nameAsc' ? 'desc' : 'asc')}
														className={`px-2 py-1 text-xs rounded transition-colors font-alice ${
												updateSortKey === 'nameAsc' || updateSortKey === 'nameDesc' 
																? 'bg-[#860809] text-white' 
																: 'bg-[#f8f3ed] text-[#030105] hover:bg-[#860809] hover:text-white'
											}`}
										>
											Name {updateSortKey === 'nameAsc' ? '↑' : updateSortKey === 'nameDesc' ? '↓' : '↕'}
										</button>
										<button 
											onClick={() => handleUpdateSort('price', updateSortKey === 'priceAsc' ? 'desc' : 'asc')}
															className={`px-2 py-1 text-xs rounded transition-colors font-alice ${
												updateSortKey === 'priceAsc' || updateSortKey === 'priceDesc' 
																	? 'bg-[#860809] text-white' 
																	: 'bg-[#f8f3ed] text-[#030105] hover:bg-[#860809] hover:text-white'
											}`}
										>
											Price {updateSortKey === 'priceAsc' ? '↑' : updateSortKey === 'priceDesc' ? '↓' : '↕'}
										</button>
										<button 
											onClick={() => handleUpdateSort('qty', updateSortKey === 'qtyAsc' ? 'desc' : 'asc')}
															className={`px-2 py-1 text-xs rounded transition-colors font-alice ${
												updateSortKey === 'qtyAsc' || updateSortKey === 'qtyDesc' 
																	? 'bg-[#860809] text-white' 
																	: 'bg-[#f8f3ed] text-[#030105] hover:bg-[#860809] hover:text-white'
											}`}
										>
											Stock {updateSortKey === 'qtyAsc' ? '↑' : updateSortKey === 'qtyDesc' ? '↓' : '↕'}
										</button>
									</div>
								</div>
								
								<div className='max-h-[420px] overflow-y-auto space-y-2'>
									{filteredUpdateProducts.map((p)=> (
													<button key={p._id} className={`w-full text-left p-3 rounded border font-alice ${selectedProductId===p._id ? 'border-[#860809] bg-[#f8f3ed]' : 'border-gray-300 bg-[#fffefc] hover:bg-[#f8f3ed]'}`} onClick={()=>setSelectedProductId(p._id)}>
											<div className='flex items-center gap-3'>
												<img src={p.image} alt={p.name} className='w-12 h-12 object-cover rounded' />
												<div className='flex-1'>
																<div className='text-[#030105] text-sm font-medium font-alice'>{p.name}</div>
																<div className='text-xs text-[#a31f17] font-libre'>{p.category} • ₱{p.price} • {p.quantity} in stock</div>
												</div>
											</div>
										</button>
									))}
								</div>
							</div>

							{/* Editors */}
							<div className='lg:col-span-2 space-y-6'>
								{selectedProduct ? (
									<>
										{/* Immutable fields */}
										<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
											<div>
												<label className='block text-sm text-[#82695b] mb-1 font-medium'>Product Name</label>
												<input value={selectedProduct.name} readOnly className='w-full bg-[#f8f3ed] border border-[#82695b] rounded px-3 py-2 text-[#82695b] opacity-70' />
											</div>
											<div>
												<label className='block text-sm text-[#82695b] mb-1 font-medium'>Category</label>
												<input value={selectedProduct.category} readOnly className='w-full bg-[#f8f3ed] border border-[#82695b] rounded px-3 py-2 text-[#82695b] opacity-70' />
											</div>
											<div>
												<label className='block text-sm text-[#a31f17] mb-1 font-medium font-alice'>Barcode</label>
												<input value={selectedProduct.barcode || ''} readOnly className='w-full bg-[#f8f3ed] border border-[#82695b] rounded px-3 py-2 text-[#82695b] opacity-70' />
											</div>
										</div>

										{/* Price/Description/Status/Featured */}
										<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
											<div>
												<label className='block text-sm text-[#82695b] mb-1 font-medium'>Price</label>
												<input type='number' step='0.01' value={editFields.price} onChange={(e)=>setEditFields({...editFields, price: e.target.value})} className='w-full bg-[#f8f3ed] border border-[#82695b] rounded px-3 py-2 text-[#82695b] focus:ring-2 focus:ring-[#901414] focus:border-transparent' />
											</div>
											<div>
												<label className='block text-sm text-[#82695b] mb-1 font-medium'>Status</label>
												<select value={editFields.status} onChange={(e)=>setEditFields({...editFields, status: e.target.value})} className='w-full bg-[#f8f3ed] border border-[#82695b] rounded px-3 py-2 text-[#82695b] focus:ring-2 focus:ring-[#901414] focus:border-transparent'>
													<option value='available'>Available</option>
													<option value='unavailable'>Unavailable</option>
												</select>
											</div>
											<div>
												<label className='block text-sm text-[#82695b] mb-1 font-medium'>Featured</label>
												<div className='flex items-center gap-2'>
													<input type='checkbox' checked={!!editFields.isFeatured} onChange={(e)=>setEditFields({...editFields, isFeatured: e.target.checked})} className='w-4 h-4' />
													<Star className='h-4 w-4 text-[#82695b]' />
												</div>
											</div>
											<div className='md:col-span-2'>
												<label className='block text-sm text-[#82695b] mb-1 font-medium'>Description</label>
												<textarea rows='3' value={editFields.description} onChange={(e)=>setEditFields({...editFields, description: e.target.value})} className='w-full bg-[#f8f3ed] border border-[#82695b] rounded px-3 py-2 text-[#82695b] focus:ring-2 focus:ring-[#901414] focus:border-transparent' />
											</div>
										</div>

										{/* Quantity ops */}
										<form onSubmit={onUpdateQuantity} className='grid grid-cols-1 md:grid-cols-2 gap-2 items-end'>
											<div>
												<label className='block text-sm text-[#82695b] mb-1 font-medium'>Stock In</label>
												<input type='number' min='0' step='1' value={qtyValue} onChange={(e)=>setQtyValue(e.target.value)} placeholder='Enter quantity to add' className='w-full bg-[#f8f3ed] border border-[#82695b] rounded px-3 py-2 text-[#82695b] focus:ring-2 focus:ring-[#901414] focus:border-transparent' />
											</div>
											<button type='submit' disabled={loading} className='bg-[#901414] hover:bg-[#7a0f0f] text-[#feffff] font-semibold py-2 rounded flex items-center justify-center transition-colors disabled:opacity-50'>
												{loading ? (<><Loader className='h-5 w-5 mr-2 animate-spin' />Adding Stock...</>) : (<><Package className='h-5 w-5 mr-2' />Stock In</>)}
											</button>
										</form>

										{/* Scan Mode Section - Only for Stock In */}
										<div className='grid grid-cols-1 md:grid-cols-4 gap-2 items-end mt-2'>
											<div>
												<label className='block text-sm text-[#82695b] mb-1 font-medium'>Scan mode (Stock In)</label>
												<select value={qtyScanMode} onChange={(e)=>setQtyScanMode(e.target.value)} className='w-full bg-[#f8f3ed] border border-[#82695b] rounded px-3 py-2 text-[#82695b] focus:ring-2 focus:ring-[#901414] focus:border-transparent'>
													<option value='usb'>USB Scanner</option>
													<option value='camera'>Camera</option>
												</select>
											</div>
											<div>
												<label className='block text-sm text-[#82695b] mb-1 font-medium'>Accumulated</label>
												<input value={scanAccum} readOnly className='w-full bg-[#f8f3ed] border border-[#82695b] rounded px-3 py-2 text-[#82695b]' />
											</div>
											<div>
												<button 
													type='button' 
													onClick={() => setScanAccum(0)} 
													className='w-full bg-[#82695b] hover:bg-[#6b5649] text-[#feffff] font-medium py-2 rounded transition-colors'
												>
													Reset
												</button>
											</div>
											<div className='text-sm text-[#901414]'>{invalidQtyScan}</div>
										</div>

										{/* Stock Out Section */}
										<div className='border-t border-[#f7e9b8] pt-4'>
											<h4 className='text-sm font-semibold text-[#82695b] mb-3 flex items-center gap-2'>
												<Minus className='h-4 w-4' />
												Stock Out
											</h4>
											<div className='grid grid-cols-1 md:grid-cols-3 gap-2 items-end'>
												<div>
													<label className='block text-sm text-[#82695b] mb-1 font-medium'>Quantity to Remove</label>
													<input 
														type='number' 
														min='0'
														step='1'
														value={stockOutQuantity} 
														onChange={(e)=>setStockOutQuantity(e.target.value)} 
														placeholder='Enter quantity to remove' 
														className='w-full bg-[#f8f3ed] border border-[#82695b] rounded px-3 py-2 text-[#82695b] focus:ring-2 focus:ring-[#901414] focus:border-transparent' 
													/>
												</div>
												<div>
													<label className='block text-sm text-[#82695b] mb-1 font-medium'>Reason *</label>
													<select 
														value={stockOutReason} 
														onChange={(e)=>setStockOutReason(e.target.value)} 
														className='w-full bg-[#f8f3ed] border border-[#82695b] rounded px-3 py-2 text-[#82695b] focus:ring-2 focus:ring-[#901414] focus:border-transparent'
														required
													>
														<option value=''>Select reason</option>
														{STOCK_OUT_REASONS.map(reason => (
															<option key={reason.value} value={reason.value}>{reason.label}</option>
														))}
													</select>
												</div>
												<button 
													type='button'
													onClick={handleStockOut}
													disabled={loading || !stockOutQuantity || !stockOutReason}
													className='bg-[#dc2626] hover:bg-[#b91c1c] text-[#feffff] font-semibold py-2 rounded flex items-center justify-center transition-colors disabled:opacity-50'
												>
													{loading ? (<><Loader className='h-5 w-5 mr-2 animate-spin' />Removing...</>) : (<><Minus className='h-5 w-5 mr-2' />Stock Out</>)}
												</button>
											</div>
										</div>

										{qtyScanMode === 'camera' && (
											<div className='mt-3 bg-[#f8f3ed] border border-[#82695b] rounded p-3'>
												<div className='flex items-center justify-between mb-2'>
													<div className='text-[#82695b] text-sm flex items-center gap-2'><ScanLine className='h-4 w-4'/>Scan with camera</div>
													<div className='text-[#901414] text-sm'>Accumulated: {scanAccum}</div>
												</div>
												<div className='flex items-center gap-2'>
													<button type='button' onClick={async()=>{ try{ const reader = new BrowserMultiFormatReader(); const controls = await reader.decodeFromVideoDevice(null, document.getElementById('qty-scan-video'), (result)=>{ if(result){ const code = result.getText(); setLastScannedQty(code); if(selectedProduct?.barcode && code === selectedProduct.barcode){ setInvalidQtyScan(''); setScanAccum((prev)=> prev + 1); } else { setInvalidQtyScan('invalid barcode'); } } }); window.__qtyScanControls = controls; }catch{}}} className='px-3 py-2 bg-[#901414] border border-[#901414] rounded text-[#feffff] hover:bg-[#7a0f0f] flex items-center gap-2'><ScanLine className='h-4 w-4'/> Start Camera</button>
													<button type='button' onClick={()=>{ try{ window.__qtyScanControls?.stop?.(); }catch{} }} className='px-3 py-2 bg-[#82695b] border border-[#82695b] rounded text-[#feffff] hover:bg-[#6b5649]'>Stop</button>
													<video id='qty-scan-video' style={{ width: 240, height: 160 }} muted playsInline />
												</div>
												<div className='text-xs text-[#82695b] mt-2'>Last scanned: {lastScannedQty || '—'}</div>
											</div>
										)}

										{/* Images editor */}
										<div>
											<h4 className='text-sm font-semibold text-[#82695b] mb-2'>Images</h4>
											<input type='file' accept='image/*' multiple onChange={handleUpdateImageChange} className='hidden' id='update-images' />
											<label htmlFor='update-images' className='inline-flex items-center gap-2 px-3 py-2 bg-[#82695b] border border-[#82695b] rounded text-[#feffff] cursor-pointer hover:bg-[#6b5649] transition-colors'><Upload className='h-4 w-4' /> Add Images</label>
											<div className='mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2'>
												{[...(selectedProduct.images||[]), ...(newImages||[])].map((url, idx)=> (
													<div key={idx} className={`relative rounded overflow-hidden border ${ (mainImageUrl && url===mainImageUrl) ? 'border-[#901414]' : 'border-[#82695b]' }`}>
														<img src={url} alt='img' className='w-full h-24 object-cover' onClick={()=>setMainImageUrl(url)} />
														<button type='button' className='absolute top-1 right-1 bg-[#901414]/70 p-1 rounded' onClick={()=>setRemoveImageUrls((prev)=>[...prev, url])}><Trash2 className='h-4 w-4 text-[#feffff]' /></button>
													</div>
												))}
											</div>
										</div>

										<div className='flex gap-2'>
											<button onClick={onUpdate} disabled={loading} className='bg-[#901414] hover:bg-[#7a0f0f] text-[#feffff] font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50'>{loading ? 'Saving...' : 'Save Changes'}</button>
											<button 
												onClick={() => setShowDeleteConfirm(true)} 
												disabled={loading}
												className='bg-[#901414] hover:bg-[#7a0f0f] text-[#feffff] font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50 flex items-center gap-2'
											>
												<Trash2 className='h-4 w-4' />
												Delete Product
											</button>
										</div>
									</>
								) : (
									<div className='text-[#82695b]'>Select a product to edit</div>
								)}
							</div>
						</div>
					</motion.div>
				)}

				{/* Monitor Tab */}
                {activeTab === 'monitor' && (
					<motion.div className='bg-[#feffff] shadow-lg rounded-lg p-6 border border-[#82695b]' initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-3 mb-4'>
							<input placeholder='Search product or scan barcode then press Enter' value={filterText} onChange={(e)=>setFilterText(e.target.value)} className='bg-[#f8f3ed] border border-[#82695b] rounded px-3 py-2 text-[#82695b] focus:ring-2 focus:ring-[#901414] focus:border-transparent' />
							<select value={filterCategory} onChange={(e)=>setFilterCategory(e.target.value)} className='bg-[#f8f3ed] border border-[#82695b] rounded px-3 py-2 text-[#82695b] focus:ring-2 focus:ring-[#901414] focus:border-transparent'>
								<option value=''>All categories</option>
								{FIXED_CATEGORIES.map(c=> <option key={c} value={c}>{c}</option>)}
							</select>
							<select value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)} className='bg-[#f8f3ed] border border-[#82695b] rounded px-3 py-2 text-[#82695b] focus:ring-2 focus:ring-[#901414] focus:border-transparent'>
								<option value=''>All status</option>
								<option value='available'>Available</option>
								<option value='unavailable'>Unavailable</option>
								<option value='trashed'>Trashed</option>
							</select>
						</div>
                        <div className='mb-4'>
                            <button
                                type='button'
                                onClick={() => {
                                    try {
                                        const csvEscape = (v) => {
                                            const s = String(v ?? '');
                                            const needsQuotes = /[",\n\r]/.test(s);
                                            const escaped = s.replace(/"/g, '""');
                                            return needsQuotes ? `"${escaped}"` : escaped;
                                        };
                                        const header = ['ProductName','ProductCategory','Price','Stocks','Barcode','InventoryValue'];
                                        const lines = [header.join(',')];
                                        (filteredProducts || []).forEach((p)=>{
                                            const name = csvEscape(p?.name);
                                            const cat = csvEscape(p?.category);
                                            const price = csvEscape(Number(p?.price||0).toFixed(2));
                                            const qty = csvEscape(p?.quantity ?? 0);
                                            const barcode = csvEscape(p?.barcode || '');
                                            const inv = csvEscape(((p?.price||0)*(p?.quantity||0)).toFixed(2));
                                            lines.push([name, cat, price, qty, barcode, inv].join(','));
                                        });
                                        const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        const ts = new Date();
                                        const pad = (n) => String(n).padStart(2,'0');
                                        a.setAttribute('download', `inventory_report_${ts.getFullYear()}${pad(ts.getMonth()+1)}${pad(ts.getDate())}_${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}.csv`);
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        window.URL.revokeObjectURL(url);
                                    } catch (e) {
                                        console.error('Failed to generate inventory CSV:', e);
                                    }
                                }}
                                className='px-3 py-2 bg-[#901414] border border-[#901414] rounded text-[#feffff] hover:bg-[#7a0f0f]'>
                                Generate Inventory Report
                            </button>
                        </div>
						<div className='mb-4 flex items-center gap-3'>
							<label className='text-xs text-[#82695b]'>Search mode</label>
							<select value={monitorSearchMode} onChange={(e)=>setMonitorSearchMode(e.target.value)} className='bg-[#f8f3ed] border border-[#82695b] rounded px-2 py-1 text-[#82695b] focus:ring-2 focus:ring-[#901414] focus:border-transparent'>
								<option value='manual'>Manual</option>
								<option value='usb'>USB Scanner</option>
								<option value='camera'>Camera</option>
							</select>
							{monitorSearchMode === 'camera' && (
								<>
									<button type='button' onClick={async()=>{ try{ const reader = new BrowserMultiFormatReader(); const controls = await reader.decodeFromVideoDevice(null, document.getElementById('monitor-scan-video'), (result)=>{ if(result){ const code = result.getText(); setLastScannedMonitor(code); setFilterText(code); } }); window.__monitorScanControls = controls; }catch{}}} className='px-3 py-2 bg-[#901414] border border-[#901414] rounded text-[#feffff] hover:bg-[#7a0f0f] flex items-center gap-2'><ScanLine className='h-4 w-4'/> Start Camera</button>
									<button type='button' onClick={()=>{ try{ window.__monitorScanControls?.stop?.(); }catch{} }} className='px-3 py-2 bg-[#82695b] border border-[#82695b] rounded text-[#feffff] hover:bg-[#6b5649]'>Stop</button>
									<video id='monitor-scan-video' style={{ width: 240, height: 160 }} muted playsInline />
									<span className='text-xs text-[#82695b]'>Last scanned: {lastScannedMonitor || '—'}</span>
								</>
							)}
						</div>

						<div className='overflow-x-auto'>
							<table className='min-w-full divide-y divide-[#82695b]'>
								<thead className='bg-[#82695b]'>
									<tr>
										<th className='px-4 py-3 text-left text-xs font-medium text-[#feffff] uppercase tracking-wider'>
											<div className='flex items-center justify-between'>
												<span>Product</span>
												<div className='flex flex-col ml-2'>
													<button onClick={() => handleSort('name', 'asc')} className='hover:text-[#ffd901] transition-colors'>
														<ChevronUp className='h-3 w-3' />
													</button>
													<button onClick={() => handleSort('name', 'desc')} className='hover:text-[#ffd901] transition-colors'>
														<ChevronDown className='h-3 w-3' />
													</button>
												</div>
											</div>
										</th>
										<th className='px-4 py-3 text-left text-xs font-medium text-[#feffff] uppercase tracking-wider'>
											<div className='flex items-center justify-between'>
												<span>Category</span>
												<div className='flex flex-col ml-2'>
													<button onClick={() => handleSort('cat', 'asc')} className='hover:text-[#ffd901] transition-colors'>
														<ChevronUp className='h-3 w-3' />
													</button>
													<button onClick={() => handleSort('cat', 'desc')} className='hover:text-[#ffd901] transition-colors'>
														<ChevronDown className='h-3 w-3' />
													</button>
												</div>
											</div>
										</th>
										<th className='px-4 py-3 text-left text-xs font-medium text-[#feffff] uppercase tracking-wider'>
											<div className='flex items-center justify-between'>
												<span>Price</span>
												<div className='flex flex-col ml-2'>
													<button onClick={() => handleSort('price', 'asc')} className='hover:text-[#ffd901] transition-colors'>
														<ChevronUp className='h-3 w-3' />
													</button>
													<button onClick={() => handleSort('price', 'desc')} className='hover:text-[#ffd901] transition-colors'>
														<ChevronDown className='h-3 w-3' />
													</button>
												</div>
											</div>
										</th>
										<th className='px-4 py-3 text-left text-xs font-medium text-[#feffff] uppercase tracking-wider'>
											<div className='flex items-center justify-between'>
												<span>Stocks</span>
												<div className='flex flex-col ml-2'>
													<button onClick={() => handleSort('qty', 'asc')} className='hover:text-[#ffd901] transition-colors'>
														<ChevronUp className='h-3 w-3' />
													</button>
													<button onClick={() => handleSort('qty', 'desc')} className='hover:text-[#ffd901] transition-colors'>
														<ChevronDown className='h-3 w-3' />
													</button>
												</div>
											</div>
										</th>
										<th className='px-4 py-3 text-left text-xs font-medium text-[#feffff] uppercase tracking-wider'>
											<div className='flex items-center justify-between'>
												<span>Barcode</span>
												<div className='flex flex-col ml-2'>
													<button onClick={() => handleSort('barcode', 'asc')} className='hover:text-[#ffd901] transition-colors'>
														<ChevronUp className='h-3 w-3' />
													</button>
													<button onClick={() => handleSort('barcode', 'desc')} className='hover:text-[#ffd901] transition-colors'>
														<ChevronDown className='h-3 w-3' />
													</button>
												</div>
											</div>
										</th>
										<th className='px-4 py-3 text-left text-xs font-medium text-[#feffff] uppercase tracking-wider'>
											<div className='flex items-center justify-between'>
												<span>Status</span>
												<div className='flex flex-col ml-2'>
													<button onClick={() => handleSort('status', 'asc')} className='hover:text-[#ffd901] transition-colors'>
														<ChevronUp className='h-3 w-3' />
													</button>
													<button onClick={() => handleSort('status', 'desc')} className='hover:text-[#ffd901] transition-colors'>
														<ChevronDown className='h-3 w-3' />
													</button>
												</div>
											</div>
										</th>
										<th className='px-4 py-3 text-left text-xs font-medium text-[#feffff] uppercase tracking-wider'>
											<div className='flex items-center justify-between'>
												<span>Featured</span>
												<div className='flex flex-col ml-2'>
													<button onClick={() => handleSort('featured', 'asc')} className='hover:text-[#ffd901] transition-colors'>
														<ChevronUp className='h-3 w-3' />
													</button>
													<button onClick={() => handleSort('featured', 'desc')} className='hover:text-[#ffd901] transition-colors'>
														<ChevronDown className='h-3 w-3' />
													</button>
												</div>
											</div>
										</th>
										<th className='px-4 py-3 text-left text-xs font-medium text-[#feffff] uppercase tracking-wider'>
											<div className='flex items-center justify-between'>
												<span>Inventory Value</span>
												<div className='flex flex-col ml-2'>
													<button onClick={() => handleSort('value', 'asc')} className='hover:text-[#ffd901] transition-colors'>
														<ChevronUp className='h-3 w-3' />
													</button>
													<button onClick={() => handleSort('value', 'desc')} className='hover:text-[#ffd901] transition-colors'>
														<ChevronDown className='h-3 w-3' />
													</button>
												</div>
											</div>
										</th>
									</tr>
								</thead>
								<tbody className='bg-[#feffff] divide-y divide-[#82695b]'>
									{filteredProducts.map((p) => (
										<tr key={p._id} className='hover:bg-[#f8f3ed] transition-colors'>
											<td className='px-4 py-3'>
												<div className='flex items-center gap-3'>
													<img src={p.image} alt={p.name} className='w-10 h-10 object-cover rounded' />
													<div className='text-[#82695b] text-sm font-medium'>{p.name}</div>
												</div>
											</td>
											<td className='px-4 py-3 text-[#82695b] text-sm'>{p.category}</td>
											<td className='px-4 py-3 text-[#82695b] text-sm'>₱{Number(p.price||0).toFixed(2)}</td>
											<td className='px-4 py-3 text-[#82695b] text-sm'>{p.quantity ?? 0}</td>
											<td className='px-4 py-3 text-[#82695b] text-sm break-all'>{p.barcode || '-'}</td>
											<td className='px-4 py-3 text-[#82695b] text-sm capitalize'>{p.status || 'available'}</td>
											<td className='px-4 py-3 text-[#82695b] text-sm'>{p.isFeatured ? 'Yes' : 'No'}</td>
											<td className='px-4 py-3 text-[#82695b] text-sm'>₱{((p.price||0)*(p.quantity||0)).toFixed(2)}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</motion.div>
				)}

				{/* Activity Log Tab */}
				{activeTab === 'activity' && (
					<motion.div className='bg-[#feffff] shadow-lg rounded-lg p-6 border border-[#82695b]' initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
						<div className='mb-6'>
							<h2 className='text-2xl font-bold text-[#901414] mb-2'>Product Activity Log</h2>
							<p className='text-[#82695b]'>Track all product creation and update activities</p>
						</div>

						{/* Filter Controls */}
						<div className='grid grid-cols-1 md:grid-cols-3 gap-3 mb-4'>
							<input 
								placeholder='Search by product name or admin' 
								value={activityFilter} 
								onChange={(e)=>setActivityFilter(e.target.value)} 
								className='bg-[#f8f3ed] border border-[#82695b] rounded px-3 py-2 text-[#82695b] focus:ring-2 focus:ring-[#901414] focus:border-transparent' 
							/>
							<select 
								value={activityTypeFilter} 
								onChange={(e)=>setActivityTypeFilter(e.target.value)} 
								className='bg-[#f8f3ed] border border-[#82695b] rounded px-3 py-2 text-[#82695b] focus:ring-2 focus:ring-[#901414] focus:border-transparent'
							>
								<option value=''>All Activity Types</option>
								<option value='created'>Product Created</option>
								<option value='updated'>Product Updated</option>
								<option value='stock_in'>Stock In</option>
								<option value='stock_out'>Stock Out</option>
								<option value='deleted'>Product Deleted</option>
							</select>
							<button 
								onClick={fetchActivityLogs}
								disabled={activityLoading}
								className='bg-[#901414] hover:bg-[#7a0f0f] text-[#feffff] font-medium py-2 px-4 rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2'
							>
								{activityLoading ? <Loader className='h-4 w-4 animate-spin' /> : <History className='h-4 w-4' />}
								Refresh
							</button>
						</div>

						{/* Activity Log Table */}
						<div className='overflow-x-auto'>
							<table className='min-w-full divide-y divide-[#82695b]'>
								<thead className='bg-[#82695b]'>
									<tr>
										<th className='px-4 py-3 text-left text-xs font-medium text-[#feffff] uppercase tracking-wider'>
											<button 
												onClick={() => handleActivitySort('date', activitySortKey === 'dateAsc' ? 'desc' : 'asc')}
												className='flex items-center gap-1 hover:text-[#ffd901] transition-colors'
											>
												Date & Time
												{activitySortKey === 'dateAsc' ? <ChevronUp className='h-3 w-3' /> : activitySortKey === 'dateDesc' ? <ChevronDown className='h-3 w-3' /> : <ChevronUp className='h-3 w-3 opacity-50' />}
											</button>
										</th>
										<th className='px-4 py-3 text-left text-xs font-medium text-[#feffff] uppercase tracking-wider'>
											<button 
												onClick={() => handleActivitySort('product', activitySortKey === 'productAsc' ? 'desc' : 'asc')}
												className='flex items-center gap-1 hover:text-[#ffd901] transition-colors'
											>
												Product
												{activitySortKey === 'productAsc' ? <ChevronUp className='h-3 w-3' /> : activitySortKey === 'productDesc' ? <ChevronDown className='h-3 w-3' /> : <ChevronUp className='h-3 w-3 opacity-50' />}
											</button>
										</th>
										<th className='px-4 py-3 text-left text-xs font-medium text-[#feffff] uppercase tracking-wider'>
											<button 
												onClick={() => handleActivitySort('action', activitySortKey === 'actionAsc' ? 'desc' : 'asc')}
												className='flex items-center gap-1 hover:text-[#ffd901] transition-colors'
											>
												Action
												{activitySortKey === 'actionAsc' ? <ChevronUp className='h-3 w-3' /> : activitySortKey === 'actionDesc' ? <ChevronDown className='h-3 w-3' /> : <ChevronUp className='h-3 w-3 opacity-50' />}
											</button>
										</th>
										<th className='px-4 py-3 text-left text-xs font-medium text-[#feffff] uppercase tracking-wider'>Details</th>
										<th className='px-4 py-3 text-left text-xs font-medium text-[#feffff] uppercase tracking-wider'>
											<button 
												onClick={() => handleActivitySort('admin', activitySortKey === 'adminAsc' ? 'desc' : 'asc')}
												className='flex items-center gap-1 hover:text-[#ffd901] transition-colors'
											>
												Admin
												{activitySortKey === 'adminAsc' ? <ChevronUp className='h-3 w-3' /> : activitySortKey === 'adminDesc' ? <ChevronDown className='h-3 w-3' /> : <ChevronUp className='h-3 w-3 opacity-50' />}
											</button>
										</th>
									</tr>
								</thead>
								<tbody className='bg-[#feffff] divide-y divide-[#82695b]'>
									{activityLoading ? (
										<tr>
											<td colSpan="5" className='px-4 py-8 text-center'>
												<div className='flex items-center justify-center gap-2'>
													<Loader className='h-5 w-5 animate-spin text-[#901414]' />
													<span className='text-[#82695b]'>Loading activity logs...</span>
												</div>
											</td>
										</tr>
									) : filteredActivityLogs.length === 0 ? (
										<tr>
											<td colSpan="5" className='px-4 py-8 text-center text-[#82695b]'>
												{activityLoading ? (
													<div className="flex items-center justify-center gap-2">
														<Loader className="h-4 w-4 animate-spin" />
														Loading activity logs...
													</div>
												) : (
													<div className="text-center">
														<History className="h-8 w-8 mx-auto mb-2 text-[#82695b] opacity-50" />
														<p className="text-sm">No activity logs found</p>
														<p className="text-xs text-[#82695b] opacity-70 mt-1">
															Activity logs will appear here when products are created, updated, or stock is modified
														</p>
													</div>
												)}
											</td>
										</tr>
									) : (
										filteredActivityLogs.map((log) => (
											<tr key={log.id} className='hover:bg-[#f8f3ed] transition-colors'>
												<td className='px-4 py-3 text-[#82695b] text-sm'>
													<div>
														<div className='font-medium'>{log.timestamp.toLocaleDateString()}</div>
														<div className='text-xs text-[#82695b] opacity-70'>{log.timestamp.toLocaleTimeString()}</div>
													</div>
												</td>
												<td className='px-4 py-3 text-[#82695b] text-sm font-medium'>{log.productName}</td>
												<td className='px-4 py-3'>
													<span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
														log.action === 'created' ? 'bg-green-100 text-green-800' :
														log.action === 'updated' ? 'bg-blue-100 text-blue-800' :
														log.action === 'stock_in' ? 'bg-yellow-100 text-yellow-800' :
														log.action === 'stock_out' ? 'bg-orange-100 text-orange-800' :
														log.action === 'deleted' ? 'bg-red-100 text-red-800' :
														'bg-gray-100 text-gray-800'
													}`}>
														{log.action === 'created' ? 'Created' :
														 log.action === 'updated' ? 'Updated' :
														 log.action === 'stock_in' ? 'Stock In' :
														 log.action === 'stock_out' ? 'Stock Out' :
														 log.action === 'deleted' ? 'Deleted' :
														 log.action}
													</span>
												</td>
												<td className='px-4 py-3 text-[#82695b] text-sm'>{log.details}</td>
												<td className='px-4 py-3 text-[#82695b] text-sm'>{log.adminName}</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					</motion.div>
				)}

				</div>
			</div>

			{/* Stock Out Confirmation Dialog */}
			{showStockOutConfirm && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-[#feffff] rounded-lg p-6 max-w-md w-full mx-4 border border-[#82695b]">
						<div className="flex items-center gap-3 mb-4">
							<Minus className="h-6 w-6 text-[#dc2626]" />
							<h3 className="text-lg font-semibold text-[#82695b]">Confirm Stock Removal</h3>
						</div>
						<div className="space-y-3 mb-6">
							<p className="text-[#82695b]">
								<strong>Product:</strong> {selectedProduct?.name}
							</p>
							<p className="text-[#82695b]">
								<strong>Current Stock:</strong> {selectedProduct?.quantity} units
							</p>
							<p className="text-[#82695b]">
								<strong>Quantity to Remove:</strong> {stockOutQuantity} units
							</p>
							<p className="text-[#82695b]">
								<strong>Reason:</strong> {STOCK_OUT_REASONS.find(r => r.value === stockOutReason)?.label}
							</p>
							<p className="text-[#82695b]">
								<strong>Remaining Stock:</strong> {selectedProduct?.quantity - parseInt(stockOutQuantity)} units
							</p>
						</div>
						<div className="flex gap-3 justify-end">
							<button
								onClick={() => setShowStockOutConfirm(false)}
								className="px-4 py-2 bg-[#82695b] hover:bg-[#6b5649] text-[#feffff] rounded transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={confirmStockOut}
								disabled={loading}
								className="px-4 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-[#feffff] rounded transition-colors disabled:opacity-50"
							>
								{loading ? 'Removing...' : 'Confirm Removal'}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Delete Confirmation Dialog */}
			{showDeleteConfirm && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-[#feffff] rounded-lg p-6 max-w-md w-full mx-4 border border-[#82695b]">
						<div className="flex items-center gap-3 mb-4">
							<Trash2 className="h-6 w-6 text-[#901414]" />
							<h3 className="text-lg font-semibold text-[#82695b]">Delete Product</h3>
						</div>
						<p className="text-[#82695b] mb-6">
							Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be undone.
						</p>
						<div className="flex gap-3 justify-end">
							<button
								onClick={() => setShowDeleteConfirm(false)}
								className="px-4 py-2 bg-[#82695b] hover:bg-[#6b5649] text-[#feffff] rounded transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleDeleteProduct}
								disabled={loading}
								className="px-4 py-2 bg-[#901414] hover:bg-[#7a0f0f] text-[#feffff] rounded transition-colors disabled:opacity-50"
							>
								{loading ? 'Deleting...' : 'Delete'}
							</button>
						</div>
					</div>
				</div>
			)}
		</AdminLayout>
	);
};

export default ManageProductsPage;


