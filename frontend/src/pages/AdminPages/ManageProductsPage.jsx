import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { productStore } from "../../store/productStore.js";
import { useAuthStore } from "../../store/authStore.js";
import { PlusCircle, Edit3, Eye, Package, Upload, Loader, Trash2, Star, ScanLine, ChevronUp, ChevronDown, History, Minus, Plus, Printer } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import AdminLayout from "../../components/AdminLayout.jsx";
import BarcodePrintModal from "../../components/BarcodePrintModal.jsx";
import toast from "react-hot-toast";
import axios from "axios";

const FIXED_CATEGORIES = ["pork", "beef", "chicken", "sliced", "processed", "seafood"]; // align with backend

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
		checkWeightOptionBarcodeExists,
		updateProduct,
		updateProductQuantity,
		addProductQuantity,
		removeProductQuantity,
		deleteProduct,
        addWeightOption,
        updateWeightOptionStock,
        updateBasePricePerKg,
        checkNameExists,
        checkBarcodeExists,
	} = productStore();

	const [activeTab, setActiveTab] = useState("monitor"); // create | update | monitor
	const [updateSubTab, setUpdateSubTab] = useState("select"); // select | price | stocks

	// Create product state
	const [newProduct, setNewProduct] = useState({
		name: "",
		description: "",
		price: "",
		category: "",
		quantity: "",
		weightKg: "",
		images: [], // base64 strings
		barcode: "",
		weightBarcode: "",
		supplier: "",
	});

	// Update product state
	const [selectedProductId, setSelectedProductId] = useState("");
	const selectedProduct = useMemo(() => products.find(p => p._id === selectedProductId), [products, selectedProductId]);
	const [editFields, setEditFields] = useState({ name: "", category: "", barcode: "", description: "", status: "available", isFeatured: false, supplier: "", basePricePerKg: "" });
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

    // Barcode print modal state
    const [showBarcodeModal, setShowBarcodeModal] = useState(false);
    const [selectedBarcode, setSelectedBarcode] = useState('');
    const [selectedProductName, setSelectedProductName] = useState('');
    const [selectedWeightKg, setSelectedWeightKg] = useState(null);

	// Update tab filters and sort (moved here before useMemo hooks)
	const [updateFilterText, setUpdateFilterText] = useState("");
	const [updateFilterCategory, setUpdateFilterCategory] = useState("");
	const [updateFilterStatus, setUpdateFilterStatus] = useState("");
	const [updateSortKey, setUpdateSortKey] = useState("nameAsc");

    // Stocks Updates UI state
    const [showAddWeight, setShowAddWeight] = useState(false);
    const [weightFilterCategory, setWeightFilterCategory] = useState("");
    const [weightFilterText, setWeightFilterText] = useState("");
    const [weightSortKey, setWeightSortKey] = useState("nameAsc");
    const [addByKey, setAddByKey] = useState({}); // { [rowKey]: qty }

    // Price Updates local state
    const [priceFilterCategory, setPriceFilterCategory] = useState("");
    const [priceFilterText, setPriceFilterText] = useState("");
    const [priceSortKey, setPriceSortKey] = useState("nameAsc");
    const [editingRowId, setEditingRowId] = useState(null);
    const [draftPriceById, setDraftPriceById] = useState({});
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [priceCurrentPage, setPriceCurrentPage] = useState(1);
    const [weightCurrentPage, setWeightCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Header renderer for sorting
    const renderWeightHeader = (label, field) => (
        <th className='px-4 py-3 text-left text-xs font-medium text-[#feffff] uppercase tracking-wider'>
            <div className='flex items-center justify-between'>
                <span>{label}</span>
                <div className='flex flex-col ml-2'>
                    <button onClick={() => setWeightSortKey(`${field}Asc`)} className='hover:text-[#ffd901] transition-colors'>
                        <ChevronUp className='h-3 w-3' />
                    </button>
                    <button onClick={() => setWeightSortKey(`${field}Desc`)} className='hover:text-[#ffd901] transition-colors'>
                        <ChevronDown className='h-3 w-3' />
                    </button>
                </div>
            </div>
        </th>
    );

    // Flatten rows from products
    const allWeightRows = useMemo(() => (products || [])
        .filter(p => !updateFilterCategory || p.category === updateFilterCategory)
        .filter(p => {
            if (!updateFilterText) return true;
            const searchLower = updateFilterText.toLowerCase();
            // Check product name
            if (p.name.toLowerCase().includes(searchLower)) return true;
            // Check product-level barcode
            if (p.barcode?.toLowerCase().includes(searchLower)) return true;
            // Check weight option barcodes
            if (p.weightOptions?.some(opt => opt.barcode?.toLowerCase().includes(searchLower))) return true;
            return false;
        })
        .flatMap(p => {
            const hasOpts = Array.isArray(p.weightOptions) && p.weightOptions.length > 0;
            if (!hasOpts) {
                // Show legacy products but disable add
                return [{
                    key: `${p._id}-legacy`,
                    productId: p._id,
                    name: p.name,
                    category: p.category,
                    weightLabel: '—',
                    weightOptionId: null,
                    stocks: p.quantity ?? 0,
                    barcode: p.barcode || '',
                }];
            }
            return p.weightOptions.map(opt => ({
                key: `${p._id}-${opt._id}`,
                productId: p._id,
                name: p.name,
                category: p.category,
                weightLabel: typeof opt.weightKg === 'number' ? opt.weightKg.toFixed(2) : String(opt.weightKg),
                weightOptionId: opt._id,
                stocks: opt.stockUnits ?? 0,
                barcode: opt.barcode || '',
            }));
        })
        .sort((a,b)=>{
            switch(weightSortKey){
                case 'nameAsc': return a.name.localeCompare(b.name);
                case 'nameDesc': return b.name.localeCompare(a.name);
                case 'categoryAsc': return a.category.localeCompare(b.category);
                case 'categoryDesc': return b.category.localeCompare(a.category);
                case 'weightAsc': return (parseFloat(a.weightLabel)||0) - (parseFloat(b.weightLabel)||0);
                case 'weightDesc': return (parseFloat(b.weightLabel)||0) - (parseFloat(a.weightLabel)||0);
                case 'stocksAsc': return (a.stocks||0) - (b.stocks||0);
                case 'stocksDesc': return (b.stocks||0) - (a.stocks||0);
                default: return a.name.localeCompare(b.name);
            }
        }), [products, updateFilterCategory, updateFilterText, weightSortKey]);

    const weightTotalPages = Math.ceil(allWeightRows.length / ITEMS_PER_PAGE);
    const weightRows = allWeightRows.slice(
        (weightCurrentPage - 1) * ITEMS_PER_PAGE,
        weightCurrentPage * ITEMS_PER_PAGE
    );

    // Helpers for Price Updates
    const renderPriceHeader = (label, field) => (
        <th className='px-4 py-3 text-left text-xs font-medium text-[#feffff] uppercase tracking-wider'>
            <div className='flex items-center justify-between'>
                <span>{label}</span>
                <div className='flex flex-col ml-2'>
                    <button onClick={() => setPriceSortKey(`${field}Asc`)} className='hover:text-[#ffd901] transition-colors'>
                        <ChevronUp className='h-3 w-3' />
                    </button>
                    <button onClick={() => setPriceSortKey(`${field}Desc`)} className='hover:text-[#ffd901] transition-colors'>
                        <ChevronDown className='h-3 w-3' />
                    </button>
                </div>
            </div>
        </th>
    );

    const allPriceRows = useMemo(() => (products || [])
        .filter(p => !updateFilterCategory || p.category === updateFilterCategory)
        .filter(p => {
            if (!updateFilterText) return true;
            const searchLower = updateFilterText.toLowerCase();
            // Check product name
            if (p.name.toLowerCase().includes(searchLower)) return true;
            // Check product-level barcode
            if (p.barcode?.toLowerCase().includes(searchLower)) return true;
            // Check weight option barcodes
            if (p.weightOptions?.some(opt => opt.barcode?.toLowerCase().includes(searchLower))) return true;
            return false;
        })
        .map((p) => ({
            productId: p._id,
            name: p.name,
            category: p.category,
            basePrice: Number(p.basePricePerKg ?? 1000),
        }))
        .sort((a,b)=>{
            switch(priceSortKey){
                case 'nameAsc': return a.name.localeCompare(b.name);
                case 'nameDesc': return b.name.localeCompare(a.name);
                case 'categoryAsc': return a.category.localeCompare(b.category);
                case 'categoryDesc': return b.category.localeCompare(a.category);
                case 'priceAsc': return (a.basePrice||0) - (b.basePrice||0);
                case 'priceDesc': return (b.basePrice||0) - (a.basePrice||0);
                default: return a.name.localeCompare(b.name);
            }
        }), [products, updateFilterCategory, updateFilterText, priceSortKey]);

    const priceTotalPages = Math.ceil(allPriceRows.length / ITEMS_PER_PAGE);
    const priceRows = allPriceRows.slice(
        (priceCurrentPage - 1) * ITEMS_PER_PAGE,
        priceCurrentPage * ITEMS_PER_PAGE
    );

	// Monitor filters
	const [filterText, setFilterText] = useState("");
	const [filterCategory, setFilterCategory] = useState("");
	const [filterStatus, setFilterStatus] = useState("");
	const [sortKey, setSortKey] = useState("qtyAsc"); // Default: lowest stock first
	const [monitorCurrentPage, setMonitorCurrentPage] = useState(1);
	
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

	// Reset price pagination when filters change
	useEffect(() => {
		setPriceCurrentPage(1);
	}, [updateFilterCategory, updateFilterText, priceSortKey]);

	// Reset weight pagination when filters change
	useEffect(() => {
		setWeightCurrentPage(1);
	}, [updateFilterCategory, updateFilterText, weightSortKey]);

	// Reset monitor pagination when filters change
	useEffect(() => {
		setMonitorCurrentPage(1);
	}, [filterText, filterCategory, filterStatus, sortKey]);

	useEffect(() => {
		if (activeTab === 'activity' && isAuthenticated && !isCheckingAuth) {
			fetchActivityLogs();
		}
	}, [activeTab, isAuthenticated, isCheckingAuth]);

	useEffect(() => {
		if (selectedProduct) {
			setEditFields({
				name: selectedProduct.name || "",
				category: selectedProduct.category || "",
				barcode: selectedProduct.barcode || "",
				description: selectedProduct.description || "",
				status: selectedProduct.status || "available",
				isFeatured: !!selectedProduct.isFeatured,
				supplier: selectedProduct.supplier || "",
				basePricePerKg: selectedProduct.basePricePerKg || "",
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
		
		// Validate product name
		if (checkNameExists(newProduct.name)) {
			toast.error("A product with this name already exists. Please use a different name.");
			return;
		}
		
		// Validate product barcode (required)
		if (!newProduct.barcode?.trim()) {
			toast.error("Product barcode is required.");
			return;
		}
		
		// Validate product barcode uniqueness
		if (checkBarcodeExists(newProduct.barcode)) {
			toast.error("This product barcode is already in use. Please use a different barcode.");
			return;
		}
		
		// Validate weight barcode (required)
		if (!newProduct.weightBarcode?.trim()) {
			toast.error("Weight barcode is required.");
			return;
		}
		
		// Validate weight barcode uniqueness
		if (checkWeightOptionBarcodeExists(newProduct.weightBarcode.trim())) {
			toast.error("This weight barcode is already in use. Please use a different barcode.");
			return;
		}
		
		const result = await createProduct({
			name: newProduct.name,
			description: newProduct.description,
			basePricePerKg: Number(newProduct.price), // base price per kg
			category: newProduct.category,
			quantity: Number(newProduct.quantity),
			weightKg: Number(newProduct.weightKg),
			weightBarcode: newProduct.weightBarcode.trim(), // weight-specific barcode
			images: newProduct.images,
			barcode: newProduct.barcode?.trim() || undefined, // product-level barcode (optional)
			supplier: newProduct.supplier?.trim() || "",
		});
		
		if (result?.success) {
			setNewProduct({ name: "", description: "", price: "", category: "", quantity: "", weightKg: "", images: [], barcode: "", supplier: "", weightBarcode: "" });
		}
	};

	const onUpdate = async (e) => {
		e.preventDefault();
		if (!selectedProduct) return;
		
		const newName = editFields.name || selectedProduct.name;
		const newBarcode = editFields.barcode || selectedProduct.barcode;
		
		// Validate product name (exclude current product from check)
		if (newName !== selectedProduct.name && checkNameExists(newName, selectedProduct._id)) {
			toast.error("A product with this name already exists. Please use a different name.");
			return;
		}
		
		// Validate barcode if changed (exclude current product from check)
		if (newBarcode && newBarcode !== selectedProduct.barcode && checkBarcodeExists(newBarcode, selectedProduct._id)) {
			toast.error("This barcode is already in use. Please use a different barcode.");
			return;
		}
		
		const payload = {
			name: newName,
			category: editFields.category || selectedProduct.category,
			barcode: newBarcode,
			description: editFields.description,
			status: editFields.status,
			isFeatured: !!editFields.isFeatured,
			supplier: editFields.supplier || selectedProduct.supplier,
			basePricePerKg: editFields.basePricePerKg ? Number(editFields.basePricePerKg) : selectedProduct.basePricePerKg,
			addImages: newImages,
			removeImageUrls,
			mainImageUrl: mainImageUrl || undefined,
		};
		
		const result = await updateProduct(selectedProduct._id, payload);
		
		if (result?.success) {
			// Clear the removal list and new images after successful update
			setRemoveImageUrls([]);
			setNewImages([]);
			setMainImageUrl("");
		}
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
			
			
			// Check if response.data.logs exists and is an array
			const logs = response.data.logs || response.data || [];
			
			if (!Array.isArray(logs)) {
				setActivityLogs([]);
				return;
			}
			
			// If no logs found, show empty array (this is normal for new installations)
			if (logs.length === 0) {
				setActivityLogs([]);
				return;
			}
			
		// Transform the response data to match the expected format
		// Filter out write_off and stock_out actions
		const transformedLogs = logs
			.filter(log => log.action !== 'write_off' && log.action !== 'stock_out')
			.map(log => ({
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
			toast.error('Failed to fetch activity logs');
			setActivityLogs([]);
		} finally {
			setActivityLoading(false);
		}
	};

    const getTotalStocks = (p) => {
        if (typeof p?.totalStockUnits === 'number') return p.totalStockUnits;
        if (Array.isArray(p?.weightOptions) && p.weightOptions.length > 0) {
            return p.weightOptions.reduce((sum, o) => sum + (o?.stockUnits || 0), 0);
        }
        return p?.quantity || 0;
    };

    // Get stock status based on quantity
    const getStockStatus = (product) => {
        const totalStocks = getTotalStocks(product);
        if (totalStocks === 0) return 'out of stock';
        if (totalStocks <= 10) return 'low stock'; // Low stock threshold: 10 or fewer
        return 'in stock';
    };

const allFilteredProducts = useMemo(() => {
		return (products || [])
			.filter(p => !filterText || 
				p.name.toLowerCase().includes(filterText.toLowerCase()) ||
				p.barcode?.toLowerCase().includes(filterText.toLowerCase())
			)
			.filter(p => !filterCategory || p.category === filterCategory)
			.filter(p => !filterStatus || getStockStatus(p) === filterStatus)
			.slice()
			.sort((a,b)=>{
				switch(sortKey){
					case 'nameAsc': return a.name.localeCompare(b.name);
					case 'nameDesc': return b.name.localeCompare(a.name);
					case 'catAsc': return (a.category||'').localeCompare(b.category||'');
					case 'catDesc': return (b.category||'').localeCompare(a.category||'');
					case 'supplierAsc': return (a.supplier||'').localeCompare(b.supplier||'');
					case 'supplierDesc': return (b.supplier||'').localeCompare(a.supplier||'');
                    case 'qtyAsc': return (getTotalStocks(a))-(getTotalStocks(b));
                    case 'qtyDesc': return (getTotalStocks(b))-(getTotalStocks(a));
					case 'priceAsc': return (a.price||0)-(b.price||0);
					case 'priceDesc': return (b.price||0)-(a.price||0);
					case 'barcodeAsc': return (a.barcode||'').localeCompare(b.barcode||'');
					case 'barcodeDesc': return (b.barcode||'').localeCompare(a.barcode||'');
					case 'statusAsc': return getStockStatus(a).localeCompare(getStockStatus(b));
					case 'statusDesc': return getStockStatus(b).localeCompare(getStockStatus(a));
					case 'featuredAsc': return (a.isFeatured ? 1 : 0) - (b.isFeatured ? 1 : 0);
					case 'featuredDesc': return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
                    case 'valueAsc': return ((a.price||0)*getTotalStocks(a))-((b.price||0)*getTotalStocks(b));
                    case 'valueDesc': return ((b.price||0)*getTotalStocks(b))-((a.price||0)*getTotalStocks(a));
					default: return a.name.localeCompare(b.name);
				}
			});
	}, [products, filterText, filterCategory, filterStatus, sortKey]);

	const monitorTotalPages = Math.ceil(allFilteredProducts.length / ITEMS_PER_PAGE);
	const filteredProducts = allFilteredProducts.slice(
		(monitorCurrentPage - 1) * ITEMS_PER_PAGE,
		monitorCurrentPage * ITEMS_PER_PAGE
	);

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
                    case 'qtyAsc': return (getTotalStocks(a))-(getTotalStocks(b));
                    case 'qtyDesc': return (getTotalStocks(b))-(getTotalStocks(a));
					case 'priceAsc': return (a.price||0)-(b.price||0);
					case 'priceDesc': return (b.price||0)-(a.price||0);
					case 'barcodeAsc': return (a.barcode||'').localeCompare(b.barcode||'');
					case 'barcodeDesc': return (b.barcode||'').localeCompare(a.barcode||'');
					case 'statusAsc': return (a.status||'').localeCompare(b.status||'');
					case 'statusDesc': return (b.status||'').localeCompare(a.status||'');
					case 'featuredAsc': return (a.isFeatured ? 1 : 0) - (b.isFeatured ? 1 : 0);
					case 'featuredDesc': return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
                    case 'valueAsc': return ((a.price||0)*getTotalStocks(a))-((b.price||0)*getTotalStocks(b));
                    case 'valueDesc': return ((b.price||0)*getTotalStocks(b))-((a.price||0)*getTotalStocks(a));
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
		// Don't activate main scanner if Add Weight modal is open
		if (showAddWeight) return;
		
		// Always enable USB scanning in Monitor and Update tabs, or when explicitly enabled in other modes
		const activeUsb = createBarcodeMode === 'usb' || updateSearchMode === 'usb' || qtyScanMode === 'usb' || monitorSearchMode === 'usb' || activeTab === 'monitor' || activeTab === 'update';
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
				// route scan by active mode precedence: monitor/update (when active) > quantity > update search > create
				if (activeTab === 'monitor') {
					// Use raw code without formatting
					setLastScannedMonitor(code);
					setFilterText(code);
			} else if (activeTab === 'update') {
				// Use raw code without formatting for Update tab
				setUpdateFilterText(code);
				// Also try to select the product if found by barcode (product-level or weight-level)
				const result = await productStore.getState().fetchProductByBarcode(code);
				if (result) {
					const { product } = result;
					setSelectedProductId(product._id);
					setUpdateSubTab('select'); // Switch to Update Details tab
				}
			} else if (qtyScanMode === 'usb' && selectedProduct) {
					// Format the scanned code to match expected barcode format (JKLjkl3456 -> JKL-jkl-3456)
					let formattedCode = code;
					if (code.length >= 9 && /^[A-Za-z0-9]+$/.test(code)) {
						// Insert hyphens at positions 3 and 6 (0-indexed: after 3rd and 6th characters)
						formattedCode = code.slice(0, 3) + '-' + code.slice(3, 6) + '-' + code.slice(6);
					}
					
					setLastScannedQty(formattedCode);
					if (selectedProduct.barcode && formattedCode === selectedProduct.barcode) {
						setInvalidQtyScan('');
						setScanAccum((prev)=> prev + 1);
					} else {
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
				}
				lastTs = now;
				return;
			}
			if (/^[0-9A-Za-z]$/.test(e.key)) buffer += e.key;
			lastTs = now;
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [createBarcodeMode, updateSearchMode, qtyScanMode, monitorSearchMode, selectedProduct, qtyAction, activeTab, showAddWeight]);

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
			<div className='py-4 sm:py-6 md:py-8 px-3 sm:px-4 bg-[#f8f3ed] min-h-screen'>
				<div className='max-w-7xl mx-auto'>
				{/* Page Title */}
				<div className='mb-4 sm:mb-6'>
					<h1 className='text-xl sm:text-2xl md:text-3xl font-bold text-[#860809] font-libre mb-2'>Product Management</h1>
					<p className='text-[#a31f17] font-alice text-sm sm:text-base'>Manage your product inventory, create new products, and track product activity</p>
				</div>
				
				<div className='mb-4 sm:mb-6 flex flex-wrap items-center gap-2'>
					<button onClick={()=>setActiveTab('monitor')} className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded font-alice text-xs sm:text-sm active:scale-95 transition-all ${activeTab==='monitor' ? 'bg-[#860809] text-white' : 'bg-[#a31f17] text-white'}`}><Eye className='inline mr-1.5 sm:mr-2 w-3.5 h-3.5 sm:w-4 sm:h-4' /><span className='whitespace-nowrap'>Monitor</span></button>
					<button onClick={()=>setActiveTab('create')} className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded font-alice text-xs sm:text-sm active:scale-95 transition-all ${activeTab==='create' ? 'bg-[#860809] text-white' : 'bg-[#a31f17] text-white'}`}><PlusCircle className='inline mr-1.5 sm:mr-2 w-3.5 h-3.5 sm:w-4 sm:h-4' /><span className='whitespace-nowrap'>Create</span></button>
					<button onClick={()=>setActiveTab('update')} className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded font-alice text-xs sm:text-sm active:scale-95 transition-all ${activeTab==='update' ? 'bg-[#860809] text-white' : 'bg-[#a31f17] text-white'}`}><Edit3 className='inline mr-1.5 sm:mr-2 w-3.5 h-3.5 sm:w-4 sm:h-4' /><span className='whitespace-nowrap'>Update</span></button>
					<button onClick={()=>setActiveTab('activity')} className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded font-alice text-xs sm:text-sm active:scale-95 transition-all ${activeTab==='activity' ? 'bg-[#860809] text-white' : 'bg-[#a31f17] text-white'}`}><History className='inline mr-1.5 sm:mr-2 w-3.5 h-3.5 sm:w-4 sm:h-4' /><span className='whitespace-nowrap'>Activity Log</span></button>
				</div>

				{/* Create Tab */}
				{activeTab === 'create' && (
					<motion.div className='bg-[#fffefc] shadow-lg rounded-lg p-3 sm:p-4 md:p-6 border border-gray-300' initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
						<form onSubmit={onCreate} className='grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4'>
							{/* Row 1: Product Barcode | Product Name */}
							<div>
								<label className='block text-sm text-[#a31f17] mb-1 font-medium font-alice'>
									Product Barcode <span className='text-red-500'>*</span>
								</label>
								<div className='flex items-center gap-2 mb-2'>
									<select value={createBarcodeMode} onChange={(e)=>setCreateBarcodeMode(e.target.value)} className='bg-[#fffefc] border border-gray-300 rounded px-2 py-2 text-[#030105] focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice'>
										<option value='manual'>Manual</option>
										<option value='usb'>USB Scanner</option>
										<option value='camera'>Camera</option>
									</select>
								</div>
								{createBarcodeMode !== 'camera' && (
									<input 
										value={newProduct.barcode} 
										onChange={(e)=>setNewProduct({...newProduct, barcode: e.target.value})} 
										placeholder='Scan or enter product barcode' 
										className='w-full bg-[#fffefc] border border-gray-300 rounded px-3 py-2 text-[#030105] focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice'
										required
									/>
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
								<p className='text-xs text-[#82695b] mt-1'>Required: Product-level barcode</p>
							</div>
							<div>
								<label className='block text-sm text-[#a31f17] mb-1 font-medium font-alice'>Product Name</label>
								<input value={newProduct.name} onChange={(e)=>setNewProduct({...newProduct, name: e.target.value})} className='w-full bg-[#fffefc] border border-gray-300 rounded px-3 py-2 text-[#030105] focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice' required />
							</div>

							{/* Row 2: Category | Supplier */}
							<div>
								<label className='block text-sm text-[#a31f17] mb-1 font-medium font-alice'>Category</label>
								<select value={newProduct.category} onChange={(e)=>setNewProduct({...newProduct, category: e.target.value})} className='w-full bg-[#fffefc] border border-gray-300 rounded px-3 py-2 text-[#030105] focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice' required>
									<option value=''>Select</option>
									{FIXED_CATEGORIES.map(c=> <option key={c} value={c}>{c}</option>)}
								</select>
							</div>
							<div>
								<label className='block text-sm text-[#a31f17] mb-1 font-medium font-alice'>Supplier</label>
								<input value={newProduct.supplier} onChange={(e)=>setNewProduct({...newProduct, supplier: e.target.value})} placeholder='Enter supplier name' className='w-full bg-[#fffefc] border border-gray-300 rounded px-3 py-2 text-[#030105] focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice' />
							</div>

							{/* Row 3: Weight Barcode | Weight (kg) */}
							<div>
								<label className='block text-sm text-[#a31f17] mb-1 font-medium font-alice'>
									Weight Barcode <span className='text-red-500'>*</span>
								</label>
								<input 
									type='text'
									value={newProduct.weightBarcode || ''} 
									onChange={(e)=>setNewProduct({...newProduct, weightBarcode: e.target.value})} 
									placeholder='Scan or enter weight-specific barcode' 
									className='w-full bg-[#fffefc] border border-gray-300 rounded px-3 py-2 text-[#030105] focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice' 
									required
								/>
								<p className='text-xs text-[#82695b] mt-1'>Required: Unique barcode for this weight</p>
							</div>
							<div>
								<label className='block text-sm text-[#a31f17] mb-1 font-medium font-alice'>Weight (kg)</label>
								<input type='number' min='0.01' step='0.01' value={newProduct.weightKg} onChange={(e)=>setNewProduct({...newProduct, weightKg: e.target.value})} placeholder='Enter weight in kilograms' className='w-full bg-[#fffefc] border border-gray-300 rounded px-3 py-2 text-[#030105] focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice' required />
							</div>

							{/* Row 4: Base Price per Kilogram | Stocks */}
							<div>
								<label className='block text-sm text-[#a31f17] mb-1 font-medium font-alice'>Base Price per Kilogram</label>
								<input type='number' step='0.01' value={newProduct.price} onChange={(e)=>setNewProduct({...newProduct, price: e.target.value})} className='w-full bg-[#fffefc] border border-gray-300 rounded px-3 py-2 text-[#030105] focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice' required />
							</div>
							<div>
								<label className='block text-sm text-[#a31f17] mb-1 font-medium font-alice'>Stocks (quantity)</label>
								<input type='number' min='0' value={newProduct.quantity} onChange={(e)=>setNewProduct({...newProduct, quantity: e.target.value})} className='w-full bg-[#fffefc] border border-gray-300 rounded px-3 py-2 text-[#030105] focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice' required />
							</div>

							{/* Row 5: Description (full width) */}
							<div className='md:col-span-2'>
								<label className='block text-sm text-[#a31f17] mb-1 font-medium font-alice'>Description</label>
								<textarea rows='3' value={newProduct.description} onChange={(e)=>setNewProduct({...newProduct, description: e.target.value})} className='w-full bg-[#fffefc] border border-gray-300 rounded px-3 py-2 text-[#030105] focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice' required />
							</div>

							{/* Row 6: Images (full width) */}
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

							{/* Submit Button */}
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
					<>
					{/* Global Filters for Update Tab */}
					<div className='mb-4 bg-[#fffefc] shadow-lg rounded-lg p-3 sm:p-4 border border-gray-300'>
						<div className='grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3'>
							<input
								placeholder='Search by name or barcode'
								value={updateFilterText}
								onChange={(e)=>setUpdateFilterText(e.target.value)}
								onKeyDown={async (e)=>{ if(e.key==='Enter' && updateFilterText.trim()){ const p = await productStore.getState().fetchProductByBarcode(updateFilterText.trim()); if(p){ setSelectedProductId(p._id); setUpdateSubTab('select'); } } }}
								className='w-full bg-[#f8f3ed] border border-gray-300 rounded px-2 sm:px-3 py-2 text-xs sm:text-sm text-[#030105] focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice'
							/>
							<select 
								value={updateFilterCategory} 
								onChange={(e)=>setUpdateFilterCategory(e.target.value)} 
								className='bg-[#f8f3ed] border border-gray-300 rounded px-2 sm:px-3 py-2 text-xs sm:text-sm text-[#030105] focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice'
							>
								<option value=''>All Categories</option>
								{FIXED_CATEGORIES.map(c=> <option key={c} value={c}>{c}</option>)}
							</select>
						</div>
					</div>

					{/* Sub-tabs for Update */}
					<div className='mb-4 sm:mb-6 flex flex-wrap items-center gap-2'>
						<button 
							onClick={()=>setUpdateSubTab('select')} 
							className={`px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded font-alice transition-colors text-xs sm:text-sm active:scale-95 ${updateSubTab==='select' ? 'bg-[#860809] text-white' : 'bg-[#a31f17] text-white hover:bg-[#860809]'}`}
						>
							<span className='whitespace-nowrap'>Update Details</span>
						</button>
						<button 
							onClick={()=>setUpdateSubTab('price')} 
							className={`px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded font-alice transition-colors text-xs sm:text-sm active:scale-95 ${updateSubTab==='price' ? 'bg-[#860809] text-white' : 'bg-[#a31f17] text-white hover:bg-[#860809]'}`}
						>
							<span className='whitespace-nowrap'>Update Price</span>
						</button>
						<button 
							onClick={()=>setUpdateSubTab('stocks')} 
							className={`px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded font-alice transition-colors text-xs sm:text-sm active:scale-95 ${updateSubTab==='stocks' ? 'bg-[#860809] text-white' : 'bg-[#a31f17] text-white hover:bg-[#860809]'}`}
						>
							<span className='whitespace-nowrap'>Update Stocks</span>
						</button>
					</div>

						{/* Select Product Sub-Tab */}
						{updateSubTab === 'select' && (
							<motion.div className='bg-[#fffefc] shadow-lg rounded-lg p-6 border border-gray-300' initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
								<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
						
									{/* Product selector */}
									<div className='lg:col-span-1'>
											<h3 className='text-lg font-semibold text-[#860809] mb-3 font-libre'>Update Details</h3>
								
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
                                                                <div className='text-xs text-[#a31f17] font-libre'>{p.category}</div>
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
										{/* Editable fields */}
										<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
											<div>
												<label className='block text-sm text-[#82695b] mb-1 font-medium'>Product Name</label>
												<input 
													value={editFields.name || selectedProduct.name} 
													onChange={(e)=>setEditFields({...editFields, name: e.target.value})} 
													className='w-full bg-[#f8f3ed] border border-[#82695b] rounded px-3 py-2 text-[#82695b] focus:ring-2 focus:ring-[#901414] focus:border-transparent' 
												/>
											</div>
											<div>
												<label className='block text-sm text-[#82695b] mb-1 font-medium'>Category</label>
												<select 
													value={editFields.category || selectedProduct.category} 
													onChange={(e)=>setEditFields({...editFields, category: e.target.value})} 
													className='w-full bg-[#f8f3ed] border border-[#82695b] rounded px-3 py-2 text-[#82695b] focus:ring-2 focus:ring-[#901414] focus:border-transparent'
												>
													<option value=''>Select Category</option>
													{FIXED_CATEGORIES.map(c=> <option key={c} value={c}>{c}</option>)}
												</select>
											</div>
											<div>
												<label className='block text-sm text-[#a31f17] mb-1 font-medium font-alice'>Barcode</label>
												<input 
													value={editFields.barcode || selectedProduct.barcode || ''} 
													readOnly
													className='w-full bg-gray-100 border border-[#82695b] rounded px-3 py-2 text-[#82695b] cursor-not-allowed opacity-75' 
													title='Barcode cannot be edited'
												/>
											</div>
										</div>

										{/* Description/Status/Featured */}
										<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
											<div>
												<label className='block text-sm text-[#82695b] mb-1 font-medium'>Supplier</label>
												<input 
													value={editFields.supplier || selectedProduct.supplier || ''} 
													onChange={(e)=>setEditFields({...editFields, supplier: e.target.value})} 
													placeholder='Enter supplier name'
													className='w-full bg-[#f8f3ed] border border-[#82695b] rounded px-3 py-2 text-[#82695b] focus:ring-2 focus:ring-[#901414] focus:border-transparent' 
												/>
											</div>
											<div>
												<label className='block text-sm text-[#a31f17] mb-1 font-medium font-alice'>Base Price per Kilogram</label>
												<input 
													type='number' 
													step='0.01' 
													value={editFields.basePricePerKg || selectedProduct.basePricePerKg || ''} 
													onChange={(e)=>setEditFields({...editFields, basePricePerKg: e.target.value})} 
													className='w-full bg-[#f8f3ed] border border-[#82695b] rounded px-3 py-2 text-[#82695b] focus:ring-2 focus:ring-[#901414] focus:border-transparent' 
												/>
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



										{/* Images editor */}
										<div>
											<div className='flex items-center justify-between mb-2'>
												<h4 className='text-sm font-semibold text-[#82695b]'>Images</h4>
												{removeImageUrls.length > 0 && (
													<span className='text-xs text-red-600 font-medium'>
														{removeImageUrls.length} image{removeImageUrls.length > 1 ? 's' : ''} marked for removal
													</span>
												)}
											</div>
											<input type='file' accept='image/*' multiple onChange={handleUpdateImageChange} className='hidden' id='update-images' />
											<label htmlFor='update-images' className='inline-flex items-center gap-2 px-3 py-2 bg-[#82695b] border border-[#82695b] rounded text-[#feffff] cursor-pointer hover:bg-[#6b5649] transition-colors'><Upload className='h-4 w-4' /> Add Images</label>
											<div className='mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2'>
												{[...(selectedProduct.images||[]), ...(newImages||[])].map((url, idx)=> {
													const isMarkedForRemoval = removeImageUrls.includes(url);
													return (
														<div key={idx} className={`relative rounded overflow-hidden border transition-all duration-200 ${
															isMarkedForRemoval 
																? 'border-red-500 opacity-50' 
																: (mainImageUrl && url===mainImageUrl) 
																	? 'border-[#901414]' 
																	: 'border-[#82695b]'
														}`}>
															<img 
																src={url} 
																alt='img' 
																className={`w-full h-24 object-cover transition-all duration-200 ${
																	isMarkedForRemoval ? 'grayscale' : 'cursor-pointer'
																}`} 
																onClick={() => !isMarkedForRemoval && setMainImageUrl(url)} 
															/>
															<button 
																type='button' 
																className={`absolute top-1 right-1 p-1 rounded transition-all duration-200 ${
																	isMarkedForRemoval 
																		? 'bg-red-500 hover:bg-red-600' 
																		: 'bg-[#901414]/70 hover:bg-[#901414]'
																}`}
																onClick={() => {
																	if (isMarkedForRemoval) {
																		// Remove from removal list (undo)
																		setRemoveImageUrls(prev => prev.filter(imgUrl => imgUrl !== url));
																	} else {
																		// Add to removal list
																		setRemoveImageUrls(prev => [...prev, url]);
																	}
																}}
																title={isMarkedForRemoval ? 'Click to undo removal' : 'Click to remove image'}
															>
																<Trash2 className='h-4 w-4 text-[#feffff]' />
															</button>
															{isMarkedForRemoval && (
																<div className='absolute inset-0 bg-red-500/20 flex items-center justify-center'>
																	<span className='text-red-600 font-semibold text-sm'>Will be removed</span>
													</div>
															)}
														</div>
													);
												})}
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

			{/* Price Updates Sub-Tab */}
			{updateSubTab === 'price' && (
				<motion.div className='bg-[#fffefc] shadow-lg rounded-lg p-6 border border-gray-300' initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
					<div className='flex items-center justify-between mb-4'>
						<h3 className='text-lg font-semibold text-[#860809] font-libre'>Update Price</h3>
					</div>

                        <div className='overflow-x-auto'>
                            <table className='min-w-full divide-y divide-[#82695b]'>
                                <thead className='bg-[#82695b]'>
                                    <tr>
                                        {renderPriceHeader('Product Name','name')}
                                        {renderPriceHeader('Product Category','category')}
                                        {renderPriceHeader('Base Price Per Kilo','price')}
                                        <th className='px-4 py-3 text-left text-xs font-medium text-[#feffff] uppercase tracking-wider'>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className='bg-[#feffff] divide-y divide-[#82695b]'>
                                    {priceRows.map((row)=> (
                                        <tr key={row.productId} className='hover:bg-[#f8f3ed] transition-colors'>
                                            <td className='px-4 py-3 text-[#82695b] text-sm'>{row.name}</td>
                                            <td className='px-4 py-3 text-[#82695b] text-sm capitalize'>{row.category}</td>
                                            <td className='px-4 py-3 text-[#82695b] text-sm'>
                                                {editingRowId === row.productId ? (
                                                    <input
                                                        type='number'
                                                        min='0'
                                                        step='0.01'
                                                        value={draftPriceById[row.productId] ?? row.basePrice}
                                                        onChange={(e)=> setDraftPriceById(prev=> ({ ...prev, [row.productId]: e.target.value }))}
                                                        className='w-40 bg-[#f8f3ed] border border-[#82695b] rounded px-2 py-1 text-[#82695b]'
                                                    />
                                                ) : (
                                                    <span>₱{Number(row.basePrice).toFixed(2)}</span>
                                                )}
                                            </td>
                                            <td className='px-4 py-3 text-[#82695b] text-sm'>
                                                {editingRowId === row.productId ? (
                                                    <div className='flex gap-2'>
                                                        <button
                                                            type='button'
                                                            disabled={loading}
                                                            onClick={async()=>{
                                                                const raw = draftPriceById[row.productId] ?? row.basePrice;
                                                                const val = Math.round(Number(raw) * 100) / 100;
                                                                if (!Number.isFinite(val) || val < 0) return;
                                                                await updateBasePricePerKg(row.productId, val);
                                                                setEditingRowId(null);
                                                            }}
                                                            className='px-3 py-1.5 bg-[#901414] text-white rounded hover:bg-[#7a0f0f] disabled:opacity-50'
                                                        >Update</button>
                                                        <button
                                                            type='button'
                                                            onClick={()=> setEditingRowId(null)}
                                                            className='px-3 py-1.5 bg-[#82695b] text-white rounded hover:bg-[#6b5649]'
                                                        >Cancel</button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type='button'
                                                        onClick={()=>{ setEditingRowId(row.productId); setDraftPriceById(prev=> ({ ...prev, [row.productId]: Number(row.basePrice).toFixed(2) })); }}
                                                        className='px-3 py-1.5 bg-[#901414] text-white rounded hover:bg-[#7a0f0f]'
                                                    >Edit</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {priceRows.length === 0 && (
                                        <tr><td colSpan='4' className='px-4 py-6 text-center text-[#82695b]'>No products found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {priceTotalPages > 1 && (
                            <div className='flex flex-col sm:flex-row items-center justify-between gap-3 mt-4'>
                                <div className='text-xs sm:text-sm text-[#82695b] text-center sm:text-left'>
                                    Showing {((priceCurrentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(priceCurrentPage * ITEMS_PER_PAGE, allPriceRows.length)} of {allPriceRows.length} products
                                </div>
                                <div className='flex flex-wrap items-center justify-center gap-1.5 sm:gap-2'>
                                    <button
                                        onClick={() => setPriceCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={priceCurrentPage === 1}
                                        className='px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm bg-[#82695b] text-white rounded hover:bg-[#6b5649] active:bg-[#6b5649] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all'
                                    >
                                        Previous
                                    </button>
                                    <div className='flex items-center gap-1'>
                                        {Array.from({ length: Math.min(5, priceTotalPages) }, (_, i) => {
                                            const start = Math.max(1, Math.min(priceCurrentPage - 2, priceTotalPages - 4));
                                            return start + i;
                                        }).map(page => (
                                            <button
                                                key={page}
                                                onClick={() => setPriceCurrentPage(page)}
                                                className={`min-w-[32px] px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded active:scale-95 transition-all ${
                                                    priceCurrentPage === page
                                                        ? 'bg-[#901414] text-white'
                                                        : 'bg-[#f8f3ed] text-[#82695b] hover:bg-[#82695b] hover:text-white'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setPriceCurrentPage(prev => Math.min(priceTotalPages, prev + 1))}
                                        disabled={priceCurrentPage === priceTotalPages}
                                        className='px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm bg-[#82695b] text-white rounded hover:bg-[#6b5649] active:bg-[#6b5649] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all'
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

			{/* Stocks Updates Sub-Tab */}
			{updateSubTab === 'stocks' && (
				<motion.div className='bg-[#fffefc] shadow-lg rounded-lg p-6 border border-gray-300' initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
					<div className='flex items-center justify-between mb-4'>
						<h3 className='text-lg font-semibold text-[#860809] font-libre'>Update Stocks</h3>
						<button onClick={()=>setShowAddWeight(true)} className='px-3 py-2 bg-[#901414] text-white rounded hover:bg-[#7a0f0f] font-alice'>Add New Weight</button>
					</div>

                        {/* Table */}
                        <div className='overflow-x-auto'>
                            <table className='min-w-full divide-y divide-[#82695b]'>
                                <thead className='bg-[#82695b]'>
                                    <tr>
                                        {renderWeightHeader('Product Name','name')}
                                        {renderWeightHeader('Product Category','category')}
                                        {renderWeightHeader('Weight (kg)','weight')}
                                        {renderWeightHeader('Stocks','stocks')}
                                        <th className='px-4 py-3 text-left text-xs font-medium text-[#feffff] uppercase tracking-wider'>Barcode</th>
                                        <th className='px-4 py-3 text-left text-xs font-medium text-[#feffff] uppercase tracking-wider'>Add Stock</th>
                                        <th className='px-4 py-3 text-left text-xs font-medium text-[#feffff] uppercase tracking-wider'>Action</th>
                                    </tr>
                                </thead>
                                <tbody className='bg-[#feffff] divide-y divide-[#82695b]'>
                                    {weightRows.map((row)=> (
                                        <tr key={row.key} className='hover:bg-[#f8f3ed] transition-colors'>
                                            <td className='px-4 py-3 text-[#82695b] text-sm'>{row.name}</td>
                                            <td className='px-4 py-3 text-[#82695b] text-sm capitalize'>{row.category}</td>
                                            <td className='px-4 py-3 text-[#82695b] text-sm'>{row.weightLabel}</td>
                                            <td className='px-4 py-3 text-[#82695b] text-sm'>{row.stocks}</td>
                                            <td className='px-4 py-3 text-[#82695b] text-sm'>
                                                {row.barcode ? (
                                                    <span className='font-mono'>{row.barcode}</span>
                                                ) : (
                                                    <span className='text-gray-400 text-xs'>—</span>
                                                )}
                                            </td>
                                            <td className='px-4 py-3 text-[#82695b] text-sm'>
                                                <input type='number' min='1' step='1' value={addByKey[row.key] || ''} onChange={(e)=> setAddByKey(prev=>({ ...prev, [row.key]: e.target.value }))} className='w-28 bg-[#f8f3ed] border border-[#82695b] rounded px-2 py-1 text-[#82695b]' placeholder='Qty' />
                                            </td>
                                            <td className='px-4 py-3 text-[#82695b] text-sm'>
                                                <div className='flex gap-2'>
                                                    <button
                                                        type='button'
                                                        disabled={loading || !addByKey[row.key] || Number(addByKey[row.key]) <= 0}
                                                        onClick={async()=>{
                                                            const delta = parseInt(addByKey[row.key], 10);
                                                            if (!Number.isInteger(delta) || delta <= 0) return;
                                                            if (row.weightOptionId) {
                                                                const newTotal = Number(row.stocks) + delta;
                                                                await updateWeightOptionStock(row.productId, row.weightOptionId, newTotal);
                                                            } else {
                                                                await addProductQuantity(row.productId, delta);
                                                            }
                                                            setAddByKey(prev=> ({ ...prev, [row.key]: '' }));
                                                        }}
                                                        className='px-3 py-2 bg-[#901414] text-white rounded hover:bg-[#7a0f0f] disabled:opacity-50'
                                                    >Add</button>
                                                    {row.barcode && row.weightOptionId && (
                                                        <button
                                                            type='button'
                                                            onClick={() => {
                                                                setSelectedBarcode(row.barcode);
                                                                setSelectedProductName(row.name);
                                                                setSelectedWeightKg(parseFloat(row.weightLabel));
                                                                setShowBarcodeModal(true);
                                                            }}
                                                            className='px-3 py-2 bg-[#82695b] text-white rounded hover:bg-[#6b5649] flex items-center gap-1'
                                                            title='Print barcode'
                                                        >
                                                            <Printer className='h-4 w-4' />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {weightRows.length === 0 && (
                                        <tr><td colSpan='7' className='px-4 py-6 text-center text-[#82695b]'>No products found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {weightTotalPages > 1 && (
                            <div className='flex flex-col sm:flex-row items-center justify-between gap-3 mt-4'>
                                <div className='text-xs sm:text-sm text-[#82695b] text-center sm:text-left'>
                                    Showing {((weightCurrentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(weightCurrentPage * ITEMS_PER_PAGE, allWeightRows.length)} of {allWeightRows.length} products
                                </div>
                                <div className='flex flex-wrap items-center justify-center gap-1.5 sm:gap-2'>
                                    <button
                                        onClick={() => setWeightCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={weightCurrentPage === 1}
                                        className='px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm bg-[#82695b] text-white rounded hover:bg-[#6b5649] active:bg-[#6b5649] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all'
                                    >
                                        Previous
                                    </button>
                                    <div className='flex items-center gap-1'>
                                        {Array.from({ length: Math.min(5, weightTotalPages) }, (_, i) => {
                                            const start = Math.max(1, Math.min(weightCurrentPage - 2, weightTotalPages - 4));
                                            return start + i;
                                        }).map(page => (
                                            <button
                                                key={page}
                                                onClick={() => setWeightCurrentPage(page)}
                                                className={`min-w-[32px] px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded active:scale-95 transition-all ${
                                                    weightCurrentPage === page
                                                        ? 'bg-[#901414] text-white'
                                                        : 'bg-[#f8f3ed] text-[#82695b] hover:bg-[#82695b] hover:text-white'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setWeightCurrentPage(prev => Math.min(weightTotalPages, prev + 1))}
                                        disabled={weightCurrentPage === weightTotalPages}
                                        className='px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm bg-[#82695b] text-white rounded hover:bg-[#6b5649] active:bg-[#6b5649] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all'
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
		</>
	)}

				{/* Monitor Tab */}
                {activeTab === 'monitor' && (
					<motion.div className='bg-[#feffff] shadow-lg rounded-lg p-3 sm:p-4 md:p-6 border border-[#82695b]' initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
						<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4'>
							<input placeholder='Search or scan barcode' value={filterText} onChange={(e)=>setFilterText(e.target.value)} className='bg-[#f8f3ed] border border-[#82695b] rounded px-2 sm:px-3 py-2 text-xs sm:text-sm text-[#82695b] focus:ring-2 focus:ring-[#901414] focus:border-transparent' />
							<select value={filterCategory} onChange={(e)=>setFilterCategory(e.target.value)} className='bg-[#f8f3ed] border border-[#82695b] rounded px-2 sm:px-3 py-2 text-xs sm:text-sm text-[#82695b] focus:ring-2 focus:ring-[#901414] focus:border-transparent'>
								<option value=''>All categories</option>
								{FIXED_CATEGORIES.map(c=> <option key={c} value={c}>{c}</option>)}
							</select>
							<select value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)} className='bg-[#f8f3ed] border border-[#82695b] rounded px-2 sm:px-3 py-2 text-xs sm:text-sm text-[#82695b] focus:ring-2 focus:ring-[#901414] focus:border-transparent'>
								<option value=''>All Stock Status</option>
								<option value='in stock'>In Stock</option>
								<option value='low stock'>Low Stock</option>
								<option value='out of stock'>Out of Stock</option>
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
                                        const header = ['ProductName','ProductCategory','Stocks','Barcode'];
                                        const lines = [header.join(',')];
                                        (allFilteredProducts || []).forEach((p)=>{
                                            const name = csvEscape(p?.name);
                                            const cat = csvEscape(p?.category);
                                        const qty = csvEscape(getTotalStocks(p));
                                            const barcode = csvEscape(p?.barcode || '');
                                            lines.push([name, cat, qty, barcode].join(','));
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
                                        // CSV generation failed silently
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
												<span>Supplier</span>
												<div className='flex flex-col ml-2'>
													<button onClick={() => handleSort('supplier', 'asc')} className='hover:text-[#ffd901] transition-colors'>
														<ChevronUp className='h-3 w-3' />
													</button>
													<button onClick={() => handleSort('supplier', 'desc')} className='hover:text-[#ffd901] transition-colors'>
														<ChevronDown className='h-3 w-3' />
													</button>
												</div>
											</div>
										</th>
										<th className='px-4 py-3 text-left text-xs font-medium text-[#feffff] uppercase tracking-wider'>
											<div className='flex items-center justify-between'>
												<span>Total Stocks</span>
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
												<span>Stock Status</span>
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
									</tr>
								</thead>
								<tbody className='bg-[#feffff] divide-y divide-[#82695b]'>
									{filteredProducts.map((p) => (
										<>
											<tr key={p._id} className='hover:bg-[#f8f3ed] transition-colors'>
												<td className='px-4 py-3'>
													<div className='flex items-center gap-3'>
														<img src={p.image} alt={p.name} className='w-10 h-10 object-cover rounded' />
														<div className='text-[#82695b] text-sm font-medium'>{p.name}</div>
													</div>
												</td>
												<td className='px-4 py-3 text-[#82695b] text-sm'>{p.category}</td>
												<td className='px-4 py-3 text-[#82695b] text-sm'>{p.supplier || '-'}</td>
												<td className='px-4 py-3 text-[#82695b] text-sm'>
													<div className='flex items-center gap-2'>
														<span>{getTotalStocks(p)}</span>
														{p.hasWeightOptions && p.weightOptions && p.weightOptions.length > 0 && (
															<button
																onClick={() => {
																	const newExpanded = new Set(expandedRows);
																	if (newExpanded.has(p._id)) {
																		newExpanded.delete(p._id);
																	} else {
																		newExpanded.add(p._id);
																	}
																	setExpandedRows(newExpanded);
																}}
																className='p-1 hover:bg-gray-200 rounded transition-colors'
															>
																<Plus className={`h-4 w-4 text-[#82695b] transition-transform ${expandedRows.has(p._id) ? 'rotate-45' : ''}`} />
															</button>
														)}
													</div>
												</td>
												<td className='px-4 py-3 text-[#82695b] text-sm break-all'>
													<div className="flex items-center gap-2">
														<span>{p.barcode || '-'}</span>
														{p.barcode && (
															<button
																onClick={() => {
																	setSelectedBarcode(p.barcode);
																	setSelectedProductName(p.name);
																	setShowBarcodeModal(true);
																}}
																className="p-1 text-[#860809] hover:text-[#a31f17] hover:bg-gray-100 rounded transition-colors"
																title="Print Barcode"
															>
																<Printer className="h-4 w-4" />
															</button>
														)}
													</div>
												</td>
												<td className='px-4 py-3'>
													{(() => {
														const status = getStockStatus(p);
														const badgeClasses = status === 'in stock' 
															? 'bg-green-100 text-green-800' 
															: status === 'low stock' 
															? 'bg-yellow-100 text-yellow-800' 
															: 'bg-red-100 text-red-800';
														return (
															<span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${badgeClasses}`}>
																{status}
															</span>
														);
													})()}
												</td>
											</tr>
											{expandedRows.has(p._id) && p.hasWeightOptions && p.weightOptions && p.weightOptions.length > 0 && (
												<tr key={`${p._id}-details`} className='bg-[#f8f3ed]'>
													<td colSpan={5} className='px-4 py-3'>
														<div className='ml-6'>
															<div className='text-sm font-medium text-[#82695b] mb-3'>Weight Options:</div>
															<div className='overflow-x-auto'>
																<table className='min-w-full divide-y divide-gray-200 border border-gray-300 rounded-lg'>
																	<thead className='bg-gray-50'>
																		<tr>
																			<th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Weights</th>
																			<th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Stocks/Units</th>
																			<th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Price per unit</th>
																			<th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Total price</th>
																			<th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Weight Barcode</th>
																		</tr>
																	</thead>
																	<tbody className='bg-white divide-y divide-gray-200'>
																		{p.weightOptions.map((option, idx) => {
																			const pricePerUnit = option.price || 0;
																			const totalPrice = pricePerUnit * option.stockUnits;
																			return (
																				<tr key={idx} className='hover:bg-gray-50'>
																					<td className='px-4 py-2 text-sm text-gray-900 font-medium'>{option.weightKg} kg</td>
																					<td className='px-4 py-2 text-sm text-gray-900'>{option.stockUnits} units</td>
																					<td className='px-4 py-2 text-sm text-gray-900'>₱{pricePerUnit.toFixed(2)}</td>
																					<td className='px-4 py-2 text-sm text-gray-900 font-semibold'>₱{totalPrice.toFixed(2)}</td>
																					<td className='px-4 py-2 text-sm text-gray-900'>
																						{option.barcode ? (
																							<div className='flex items-center gap-2'>
																								<span className='font-mono'>{option.barcode}</span>
																								<button
																									onClick={() => {
																										setSelectedBarcode(option.barcode);
																										setSelectedProductName(p.name);
																										setSelectedWeightKg(option.weightKg);
																										setShowBarcodeModal(true);
																									}}
																									className='text-[#860809] hover:text-[#a31f17]'
																									title='Print barcode'
																								>
																									<Printer className='h-4 w-4' />
																								</button>
																							</div>
																						) : (
																							<span className='text-gray-400 text-xs'>No barcode</span>
																						)}
																					</td>
																				</tr>
																			);
																		})}
																	</tbody>
																</table>
															</div>
														</div>
													</td>
												</tr>
											)}
										</>
									))}
								</tbody>
							</table>
						</div>

						{/* Pagination Controls */}
						{monitorTotalPages > 1 && (
							<div className='flex items-center justify-between mt-4'>
								<div className='text-sm text-[#82695b]'>
									Showing {((monitorCurrentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(monitorCurrentPage * ITEMS_PER_PAGE, allFilteredProducts.length)} of {allFilteredProducts.length} products
								</div>
								<div className='flex items-center gap-2'>
									<button
										onClick={() => setMonitorCurrentPage(prev => Math.max(1, prev - 1))}
										disabled={monitorCurrentPage === 1}
										className='px-3 py-1.5 bg-[#82695b] text-white rounded hover:bg-[#6b5649] disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
									>
										Previous
									</button>
									<div className='flex items-center gap-1'>
										{Array.from({ length: monitorTotalPages }, (_, i) => i + 1).map(page => (
											<button
												key={page}
												onClick={() => setMonitorCurrentPage(page)}
												className={`px-3 py-1.5 rounded transition-colors ${
													monitorCurrentPage === page
														? 'bg-[#901414] text-white'
														: 'bg-[#f8f3ed] text-[#82695b] hover:bg-[#82695b] hover:text-white'
												}`}
											>
												{page}
											</button>
										))}
									</div>
									<button
										onClick={() => setMonitorCurrentPage(prev => Math.min(monitorTotalPages, prev + 1))}
										disabled={monitorCurrentPage === monitorTotalPages}
										className='px-3 py-1.5 bg-[#82695b] text-white rounded hover:bg-[#6b5649] disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
									>
										Next
									</button>
								</div>
							</div>
						)}
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
			<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
				<div className="bg-[#feffff] rounded-lg p-4 sm:p-6 max-w-md w-full border border-[#82695b] max-h-[90vh] overflow-y-auto">
					<div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
						<Minus className="h-5 w-5 sm:h-6 sm:w-6 text-[#dc2626] flex-shrink-0" />
						<h3 className="text-base sm:text-lg font-semibold text-[#82695b]">Confirm Stock Removal</h3>
					</div>
					<div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
						<p className="text-xs sm:text-sm text-[#82695b] break-words">
							<strong>Product:</strong> {selectedProduct?.name}
						</p>
						<p className="text-xs sm:text-sm text-[#82695b]">
							<strong>Current Stock:</strong> {selectedProduct?.quantity} units
						</p>
						<p className="text-xs sm:text-sm text-[#82695b]">
							<strong>Quantity to Remove:</strong> {stockOutQuantity} units
						</p>
						<p className="text-xs sm:text-sm text-[#82695b]">
							<strong>Reason:</strong> {STOCK_OUT_REASONS.find(r => r.value === stockOutReason)?.label}
						</p>
						<p className="text-xs sm:text-sm text-[#82695b]">
							<strong>Remaining Stock:</strong> {selectedProduct?.quantity - parseInt(stockOutQuantity)} units
						</p>
					</div>
					<div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
						<button
							onClick={() => setShowStockOutConfirm(false)}
							className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-[#82695b] hover:bg-[#6b5649] active:bg-[#6b5649] text-[#feffff] rounded transition-colors active:scale-95"
						>
							Cancel
						</button>
						<button
							onClick={confirmStockOut}
							disabled={loading}
							className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-[#dc2626] hover:bg-[#b91c1c] active:bg-[#b91c1c] text-[#feffff] rounded transition-colors disabled:opacity-50 active:scale-95"
						>
							{loading ? 'Removing...' : 'Confirm Removal'}
						</button>
					</div>
				</div>
			</div>
		)}

		{/* Delete Confirmation Dialog */}
		{showDeleteConfirm && (
			<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
				<div className="bg-[#feffff] rounded-lg p-4 sm:p-6 max-w-md w-full border border-[#82695b]">
					<div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
						<Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-[#901414] flex-shrink-0" />
						<h3 className="text-base sm:text-lg font-semibold text-[#82695b]">Delete Product</h3>
					</div>
					<p className="text-xs sm:text-sm text-[#82695b] mb-4 sm:mb-6 break-words">
						Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be undone.
					</p>
					<div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
						<button
							onClick={() => setShowDeleteConfirm(false)}
							className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-[#82695b] hover:bg-[#6b5649] active:bg-[#6b5649] text-[#feffff] rounded transition-colors active:scale-95"
						>
							Cancel
						</button>
						<button
							onClick={handleDeleteProduct}
							disabled={loading}
							className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-[#901414] hover:bg-[#7a0f0f] active:bg-[#7a0f0f] text-[#feffff] rounded transition-colors disabled:opacity-50 active:scale-95"
						>
							{loading ? 'Deleting...' : 'Delete'}
						</button>
					</div>
				</div>
			</div>
		)}

            {/* Add New Weight Modal */}
            {showAddWeight && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
                    <div className="bg-[#feffff] rounded-lg p-4 sm:p-6 max-w-lg w-full border border-[#82695b] max-h-[90vh] overflow-y-auto">
                        <div className='mb-3 sm:mb-4'>
                            <h3 className='text-base sm:text-lg font-semibold text-[#82695b]'>Add New Weight</h3>
                            <p className='text-xs sm:text-sm text-[#82695b]'>Select category and product, then enter weight and initial stock.</p>
                        </div>
                        <AddWeightForm 
                            products={products}
                            onCancel={()=>setShowAddWeight(false)}
                            onSubmit={async (payload)=>{
                                await addWeightOption(payload.productId, { weightKg: payload.weightKg, stockUnits: payload.stockUnits, barcode: payload.barcode });
                                setShowAddWeight(false);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Barcode Print Modal */}
            {showBarcodeModal && (
                <BarcodePrintModal
                    isOpen={showBarcodeModal}
                    onClose={() => {
                        setShowBarcodeModal(false);
                        setSelectedWeightKg(null);
                    }}
                    barcode={selectedBarcode}
                    productName={selectedProductName}
                    weightKg={selectedWeightKg}
                />
            )}
		</AdminLayout>
	);
};

export default ManageProductsPage;



// Lightweight inline form component for adding weight
const AddWeightForm = ({ products, onCancel, onSubmit }) => {
    const [mode, setMode] = useState("manual"); // manual | scanner
    const [category, setCategory] = useState("");
    const [productId, setProductId] = useState("");
    const [weightKg, setWeightKg] = useState("");
    const [stockUnits, setStockUnits] = useState("");
    const [barcode, setBarcode] = useState("");
    const [lastScanned, setLastScanned] = useState("");

    const productChoices = useMemo(()=> (products||[]).filter(p => !category || p.category === category), [products, category]);
    const selected = useMemo(()=> {
        const found = (products||[]).find(p => p._id === productId);
        return found;
    }, [products, productId]);

    // USB Scanner handler for this modal
    useEffect(() => {
        if (mode !== 'scanner') return;
        
        let buffer = '';
        let lastTs = 0;
        
        const onKey = async (e) => {
            const now = Date.now();
            if (now - lastTs > 50) buffer = '';
            
            // Check if the Weight Barcode input field is focused
            const activeElement = document.activeElement;
            const isBarcodeInputFocused = activeElement && activeElement.type === 'text' && activeElement.placeholder?.includes('barcode');
            
            // If Weight Barcode field is focused, let the browser handle the input naturally (no product search)
            if (isBarcodeInputFocused) {
                lastTs = now;
                return;
            }
            
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent form submission
                e.stopPropagation(); // Stop event bubbling
                const code = buffer;
                buffer = '';
                if (!code) { lastTs = now; return; }
                
                setLastScanned(code);
                
                // Find product by product-level barcode (try exact match first, then try without dashes)
                let product = (products || []).find(p => p.barcode === code);
                
                // If not found, try removing dashes from scanned code
                if (!product) {
                    const codeNoDashes = code.replace(/-/g, '');
                    product = (products || []).find(p => p.barcode === codeNoDashes);
                }
                
                // If still not found, try comparing without dashes on both sides
                if (!product) {
                    const codeNoDashes = code.replace(/-/g, '');
                    product = (products || []).find(p => p.barcode?.replace(/-/g, '') === codeNoDashes);
                }
                
                // If still not found, check if it's a weight option barcode
                if (!product) {
                    const codeNoDashes = code.replace(/-/g, '');
                    product = (products || []).find(p => 
                        p.weightOptions?.some(opt => 
                            opt.barcode === code || 
                            opt.barcode === codeNoDashes || 
                            opt.barcode?.replace(/-/g, '') === codeNoDashes
                        )
                    );
                    if (product) {
                        // Found product by weight option barcode - auto-fill the weight barcode field
                        setCategory(product.category);
                        setProductId(product._id);
                        setBarcode(code);
                        toast.success(`Product selected: ${product.name} (weight barcode detected)`);
                    }
                } else {
                    // Found by product-level barcode
                    setCategory(product.category);
                    setProductId(product._id);
                    toast.success(`Product selected: ${product.name}`);
                }
                
                // Only show error if no product found at all
                if (!product) {
                    toast.error('Product not found with barcode: ' + code);
                }
                
                lastTs = now;
                return;
            }
            if (/^[0-9A-Za-z]$/.test(e.key)) buffer += e.key;
            lastTs = now;
        };
        
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [mode, products]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const w = parseFloat(weightKg);
        const s = parseInt(stockUnits, 10);
        const b = barcode.trim();
        
        // Validate required fields
        if (!productId || !Number.isFinite(w) || w <= 0 || !Number.isInteger(s) || s < 0 || !b) {
            if (!b) toast.error('Barcode is required');
            return;
        }
        
        const payload = { 
            productId, 
            weightKg: Math.round(w*100)/100, 
            stockUnits: s,
            barcode: b
        };
        
        onSubmit(payload);
    };

    return (
        <form onSubmit={handleSubmit} className='space-y-3'>
            {/* Mode Selector */}
            <div>
                <label className='block text-sm text-[#82695b] mb-1 font-medium'>Selection Mode</label>
                <div className='flex gap-2'>
                    <button
                        type='button'
                        onClick={() => { setMode('manual'); setCategory(''); setProductId(''); setLastScanned(''); }}
                        className={`flex-1 px-4 py-2 rounded font-medium transition-colors ${
                            mode === 'manual' 
                                ? 'bg-[#901414] text-white' 
                                : 'bg-[#f8f3ed] text-[#82695b] hover:bg-[#82695b] hover:text-white'
                        }`}
                    >
                        Manual
                    </button>
                    <button
                        type='button'
                        onClick={() => { setMode('scanner'); setCategory(''); setProductId(''); setLastScanned(''); }}
                        className={`flex-1 px-4 py-2 rounded font-medium transition-colors ${
                            mode === 'scanner' 
                                ? 'bg-[#901414] text-white' 
                                : 'bg-[#f8f3ed] text-[#82695b] hover:bg-[#82695b] hover:text-white'
                        }`}
                    >
                        Scanner
                    </button>
                </div>
                {mode === 'scanner' && (
                    <p className='text-xs text-[#82695b] mt-1'>Scan product barcode to auto-select product</p>
                )}
            </div>

            {/* Category Selection */}
            <div>
                <label className='block text-sm text-[#82695b] mb-1 font-medium'>Product Category</label>
                {mode === 'scanner' && category ? (
                    <div className='w-full bg-gray-100 border border-[#82695b] rounded px-3 py-2 text-[#82695b] capitalize'>
                        {category}
                    </div>
                ) : (
                    <select 
                        value={category} 
                        onChange={(e)=>{ setCategory(e.target.value); setProductId(""); }} 
                        disabled={mode === 'scanner'}
                        className='w-full bg-[#f8f3ed] border border-[#82695b] rounded px-3 py-2 text-[#82695b] disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        <option value=''>{mode === 'scanner' ? 'Will be auto-selected' : 'Select Category'}</option>
                        {FIXED_CATEGORIES.map(c=> <option key={c} value={c}>{c}</option>)}
                    </select>
                )}
            </div>

            {/* Product Name Selection */}
            <div>
                <label className='block text-sm text-[#82695b] mb-1 font-medium'>Product Name</label>
                {mode === 'scanner' && selected ? (
                    <div className='w-full bg-gray-100 border border-[#82695b] rounded px-3 py-2 text-[#82695b]'>
                        {selected.name}
                    </div>
                ) : (
                    <select 
                        value={productId} 
                        onChange={(e)=>setProductId(e.target.value)} 
                        disabled={mode === 'scanner' || (mode === 'manual' && !category)} 
                        className='w-full bg-[#f8f3ed] border border-[#82695b] rounded px-3 py-2 text-[#82695b] disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        <option value=''>
                            {mode === 'scanner' ? 'Will be auto-selected' : (category ? 'Select Product' : 'Select category first')}
                        </option>
                        {productChoices.map(p=> <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                )}
                {mode === 'scanner' && lastScanned && (
                    <p className='text-xs text-[#82695b] mt-1'>Last scanned: {lastScanned}</p>
                )}
            </div>

            {/* Weight Barcode */}
            <div>
                <label className='block text-sm text-[#82695b] mb-1 font-medium'>
                    Weight Barcode <span className='text-red-500'>*</span>
                </label>
                <input 
                    type='text' 
                    value={barcode} 
                    onChange={(e)=>setBarcode(e.target.value)} 
                    placeholder='Scan or enter unique barcode for this weight'
                    disabled={!productId}
                    required
                    className='w-full bg-[#f8f3ed] border border-[#82695b] rounded px-3 py-2 text-[#82695b] disabled:opacity-50 disabled:cursor-not-allowed'
                />
                <p className='text-xs text-[#82695b] mt-1'>Required: Each weight must have a unique barcode</p>
            </div>

            <div className='grid grid-cols-2 gap-3'>
                <div>
                    <label className='block text-sm text-[#82695b] mb-1 font-medium'>Weight (kg)</label>
                    <input type='number' step='0.01' min='0.01' value={weightKg} onChange={(e)=>setWeightKg(e.target.value)} disabled={!productId} className='w-full bg-[#f8f3ed] border border-[#82695b] rounded px-3 py-2 text-[#82695b] disabled:opacity-50' />
                </div>
                <div>
                    <label className='block text-sm text-[#82695b] mb-1 font-medium'>Stocks</label>
                    <input type='number' step='1' min='0' value={stockUnits} onChange={(e)=>setStockUnits(e.target.value)} disabled={!productId} className='w-full bg-[#f8f3ed] border border-[#82695b] rounded px-3 py-2 text-[#82695b] disabled:opacity-50' />
                </div>
            </div>

            {selected && (
                <div className='text-xs text-[#82695b]'>Current weight options: {(selected.weightOptions||[]).map(o=>`${o.weightKg}kg (${o.stockUnits})`).join(', ') || 'none'}</div>
            )}
            <div className='flex justify-end gap-2 pt-2'>
                <button type='button' onClick={onCancel} className='px-3 py-2 bg-[#82695b] hover:bg-[#6b5649] text-white rounded'>Cancel</button>
                <button type='submit' disabled={!productId || !weightKg || !stockUnits || !barcode.trim()} className='px-3 py-2 bg-[#901414] hover:bg-[#7a0f0f] text-white rounded disabled:opacity-50'>Add</button>
            </div>
        </form>
    );
};