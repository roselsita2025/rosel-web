import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    const navigate = useNavigate();
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
		createPurchaseOrder,
	} = productStore();

	const [activeTab, setActiveTab] = useState("monitor"); // create | update | monitor
	const [updateSubTab, setUpdateSubTab] = useState("select"); // select | price | stocks | purchase-order

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
    
    const [stockOutQuantity, setStockOutQuantity] = useState("");
    const [stockOutReason, setStockOutReason] = useState("");
    const [showStockOutConfirm, setShowStockOutConfirm] = useState(false);

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

    const [showBarcodeModal, setShowBarcodeModal] = useState(false);
    const [selectedBarcode, setSelectedBarcode] = useState('');
    const [selectedProductName, setSelectedProductName] = useState('');
    const [selectedWeightKg, setSelectedWeightKg] = useState(null);

	// Update tab filters and sort (moved here before useMemo hooks)
	const [updateFilterText, setUpdateFilterText] = useState("");
	const [updateFilterCategory, setUpdateFilterCategory] = useState("");
	const [updateFilterStatus, setUpdateFilterStatus] = useState("");
	const [updateSortKey, setUpdateSortKey] = useState("nameAsc");

    const [showAddWeight, setShowAddWeight] = useState(false);
    const [showPurchaseOrderInWeight, setShowPurchaseOrderInWeight] = useState(false); // For PO flow in Add Weight modal
    const [pendingWeightForPO, setPendingWeightForPO] = useState(null); // Weight data pending PO creation
    const [newWeightPOCart, setNewWeightPOCart] = useState([]); // Cart for new weight PO
    const [weightFilterCategory, setWeightFilterCategory] = useState("");
    const [weightFilterText, setWeightFilterText] = useState("");
    const [weightSortKey, setWeightSortKey] = useState("nameAsc");
    const [addByKey, setAddByKey] = useState({}); // { [rowKey]: qty }

    const [priceFilterCategory, setPriceFilterCategory] = useState("");
    const [priceFilterText, setPriceFilterText] = useState("");
    const [priceSortKey, setPriceSortKey] = useState("nameAsc");
    const [editingRowId, setEditingRowId] = useState(null);
    const [isBatchEditing, setIsBatchEditing] = useState(false);
    const [isBatchStockEditing, setIsBatchStockEditing] = useState(false);
    const [draftPriceById, setDraftPriceById] = useState({});
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [priceCurrentPage, setPriceCurrentPage] = useState(1);
    const [weightCurrentPage, setWeightCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const [poSupplier, setPoSupplier] = useState('');
    const [poSupplierSearchText, setPoSupplierSearchText] = useState('');
    const [showPoSupplierDropdown, setShowPoSupplierDropdown] = useState(false);
    const [poSearchText, setPoSearchText] = useState('');
    const [poCart, setPoCart] = useState([]);
    const [allSuppliers, setAllSuppliers] = useState([]);
    const [showPoConfirmModal, setShowPoConfirmModal] = useState(false);
    const [createdPurchaseOrder, setCreatedPurchaseOrder] = useState(null);
    const [showPoSuccessModal, setShowPoSuccessModal] = useState(false);
    const [isCreatingProductPO, setIsCreatingProductPO] = useState(false); // Flag for create product PO flow
    const supplierDropdownRef = useRef(null);

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

    const allWeightRows = useMemo(() => (products || [])
        .filter(p => !updateFilterCategory || p.category === updateFilterCategory)
        .filter(p => {
            if (!updateFilterText) return true;
            const searchLower = updateFilterText.toLowerCase();
            if (p.name.toLowerCase().includes(searchLower)) return true;
            if (p.barcode?.toLowerCase().includes(searchLower)) return true;
            if (p.weightOptions?.some(opt => opt.barcode?.toLowerCase().includes(searchLower))) return true;
            return false;
        })
        .flatMap(p => {
            const hasOpts = Array.isArray(p.weightOptions) && p.weightOptions.length > 0;
            if (!hasOpts) {
                return [{
                    key: `${p._id}-legacy`,
                    productId: p._id,
                    name: p.name,
                    category: p.category,
                    supplier: p.supplier || '',
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
                supplier: p.supplier || '',
                weightLabel: typeof opt.weightKg === 'number' ? opt.weightKg.toFixed(2) : String(opt.weightKg),
                weightOptionId: opt._id,
                stocks: opt.stockUnits ?? 0,
                barcode: opt.barcode || '',
            }));
        })
        .sort((a,b)=>{
            switch(weightSortKey){
                case 'supplierAsc': return (a.supplier||'').localeCompare(b.supplier||'');
                case 'supplierDesc': return (b.supplier||'').localeCompare(a.supplier||'');
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
            if (p.name.toLowerCase().includes(searchLower)) return true;
            if (p.barcode?.toLowerCase().includes(searchLower)) return true;
            if (p.weightOptions?.some(opt => opt.barcode?.toLowerCase().includes(searchLower))) return true;
            return false;
        })
        .map((p) => ({
            productId: p._id,
            name: p.name,
            category: p.category,
            supplier: p.supplier || 'N/A',
            basePrice: Number(p.basePricePerKg ?? 1000),
        }))
        .sort((a,b)=>{
            switch(priceSortKey){
                case 'supplierAsc': return a.supplier.localeCompare(b.supplier);
                case 'supplierDesc': return b.supplier.localeCompare(a.supplier);
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

	// Extract unique suppliers when Purchase Order subtab is active
	useEffect(() => {
		if (updateSubTab === 'purchase-order') {
			const uniqueSuppliers = [...new Set(products.filter(p => p.supplier).map(p => p.supplier))];
			setAllSuppliers(uniqueSuppliers);
		}
	}, [updateSubTab, products]);

	// Handle URL parameters for deep linking
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const tab = urlParams.get('tab');
		const subtab = urlParams.get('subtab');
		
		if (tab && ['create', 'update', 'monitor', 'activity'].includes(tab)) {
			setActiveTab(tab);
		}
		
		if (subtab && ['select', 'price', 'stocks', 'purchase-order'].includes(subtab)) {
			setUpdateSubTab(subtab);
		}
	}, []); // Run once on mount
	
	// Handle product selection when products are loaded
	useEffect(() => {
		if (products.length > 0 && updateSubTab === 'purchase-order') {
			const urlParams = new URLSearchParams(window.location.search);
			const productIdParam = urlParams.get('productId') || urlParams.get('product');
			
			if (productIdParam) {
				const product = products.find(p => p._id === productIdParam);
				if (product && product.supplier) {
					setPoSupplier(product.supplier);
					setPoSupplierSearchText(product.supplier);
				}
			}
		}
	}, [products, updateSubTab]);

	// Handle click outside supplier dropdown
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(event.target)) {
				setShowPoSupplierDropdown(false);
			}
		};

		if (showPoSupplierDropdown) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showPoSupplierDropdown]);

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
		
		// Set flag and auto-select supplier from form if provided
		setIsCreatingProductPO(true);
		if (newProduct.supplier?.trim()) {
			setPoSupplier(newProduct.supplier.trim());
		}
		// Show PO confirmation modal
		setShowPoConfirmModal(true);
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

	// Purchase Order helper functions
	const filteredPoSuppliers = useMemo(() => {
		if (!allSuppliers || allSuppliers.length === 0) return [];
		
		if (!poSupplierSearchText) return allSuppliers;
		
		const searchLower = poSupplierSearchText.toLowerCase();
		return allSuppliers.filter(supplier => 
			supplier.toLowerCase().includes(searchLower)
		);
	}, [allSuppliers, poSupplierSearchText]);

	const filteredPoProducts = useMemo(() => {
		if (!products || products.length === 0) return [];
		
		let filtered = products.filter(p => {
			// Filter by supplier
			if (poSupplier && p.supplier !== poSupplier) return false;
			
			// Filter by search text
			if (poSearchText) {
				const searchLower = poSearchText.toLowerCase();
				if (!p.name.toLowerCase().includes(searchLower) && 
					!p.barcode?.toLowerCase().includes(searchLower) &&
					!p.weightOptions?.some(opt => opt.barcode?.toLowerCase().includes(searchLower))) {
					return false;
				}
			}
			
			return true;
		});
		
		return filtered;
	}, [products, poSupplier, poSearchText]);

	const addToPoCart = (product, weightOption) => {
		// Check if supplier matches
		if (poSupplier && product.supplier !== poSupplier) {
			toast.error(`Cannot add product from different supplier. Selected supplier: ${poSupplier}`);
			return;
		}

		const existingIndex = poCart.findIndex(
			item => item.productId === product._id && 
					item.weightOptionId === (weightOption?._id || null)
		);

		if (existingIndex >= 0) {
			const updatedCart = [...poCart];
			updatedCart[existingIndex].quantity += 1;
			setPoCart(updatedCart);
		} else {
			setPoCart([...poCart, {
				productId: product._id,
				productName: product.name,
				category: product.category,
				weightOptionId: weightOption?._id || null,
				weightKg: weightOption?.weightKg || 0,
				quantity: 1,
				basePricePerKg: product.basePricePerKg,
			}]);
		}
		toast.success(`${product.name} added to purchase order`);
	};

	const updatePoCartQuantity = (productId, weightOptionId, newQuantity) => {
		if (newQuantity <= 0) {
			setPoCart(poCart.filter(item => 
				!(item.productId === productId && item.weightOptionId === weightOptionId)
			));
			toast.success('Item removed from purchase order');
		} else {
			setPoCart(poCart.map(item =>
				item.productId === productId && item.weightOptionId === weightOptionId
					? { ...item, quantity: newQuantity }
					: item
			));
		}
	};

	const removePoCartItem = (productId, weightOptionId) => {
		setPoCart(poCart.filter(item => 
			!(item.productId === productId && item.weightOptionId === weightOptionId)
		));
		toast.success('Item removed from purchase order');
	};

	const handleCreatePurchaseOrder = () => {
		if (!poSupplier) {
			toast.error('Please select a supplier first');
			return;
		}

		if (poCart.length === 0) {
			toast.error('Please add products to the purchase order');
			return;
		}

		setShowPoConfirmModal(true);
	};

	const confirmCreatePurchaseOrder = async () => {
		setShowPoConfirmModal(false);
		
		// If creating a new product through create tab, create product first
        if (isCreatingProductPO) {
            const productResult = await createProduct({
				name: newProduct.name,
				description: newProduct.description,
				basePricePerKg: Number(newProduct.price),
				category: newProduct.category,
				quantity: Number(newProduct.quantity),
				weightKg: Number(newProduct.weightKg),
				weightBarcode: newProduct.weightBarcode.trim(),
				images: newProduct.images,
				barcode: newProduct.barcode?.trim() || undefined,
				supplier: newProduct.supplier?.trim() || "",
			});
			
			if (!productResult?.success) {
				setIsCreatingProductPO(false);
				return; // Error already shown by createProduct
			}
			
			// Prepare PO data with the newly created product
			const supplierForPO = newProduct.supplier?.trim() || poSupplier || "Unknown Supplier";
			const purchaseOrderData = {
				supplier: supplierForPO,
				items: [{
					productId: productResult.product._id,
					weightKg: Number(newProduct.weightKg),
					quantity: Number(newProduct.quantity)
				}]
			};
			
			const result = await createPurchaseOrder(purchaseOrderData);
			
			if (result?.success) {
				setCreatedPurchaseOrder(result.data);
				setShowPoSuccessModal(true);
				// Reset create product form
				setNewProduct({ name: "", description: "", price: "", category: "", quantity: "", weightKg: "", images: [], barcode: "", supplier: "", weightBarcode: "" });
				setIsCreatingProductPO(false);
				setPoCart([]); // Clear PO cart
			}
		} else {
			// Regular PO creation flow
			const purchaseOrderData = {
				supplier: poSupplier,
				items: poCart.map(item => ({
					productId: item.productId,
					weightOptionId: item.weightOptionId,
					weightKg: item.weightKg,
					quantity: item.quantity
				}))
			};

			const result = await createPurchaseOrder(purchaseOrderData);
			
			if (result?.success) {
				setCreatedPurchaseOrder(result.data);
				setShowPoSuccessModal(true);
				// Don't clear the cart yet - user will do it after seeing receipt
			}
		}
	};

	const handlePrintReceipt = () => {
		// Create a printable receipt window
		const receiptWindow = window.open('', '_blank', 'width=350,height=600');
		
		const receiptContent = `
			<!DOCTYPE html>
			<html>
			<head>
				<title>Purchase Order Receipt</title>
				<style>
					* { margin: 0; padding: 0; box-sizing: border-box; }
					body { font-family: 'Courier New', monospace; padding: 20px; background: white; font-size: 12px; }
					.receipt { max-width: 300px; margin: 0 auto; }
					.divider { border-top: 1px dashed #000; margin: 15px 0; }
					.header { text-align: center; margin-bottom: 15px; }
					.company-name { font-weight: bold; font-size: 16px; margin-bottom: 5px; }
					.order-info { margin: 15px 0; }
					.order-info p { display: flex; justify-content: space-between; margin: 3px 0; }
					.order-info .label { font-weight: bold; }
					.items-section { margin: 15px 0; }
					.item-header { font-weight: bold; margin-bottom: 5px; }
					.item { margin: 8px 0; }
					.item-name { margin-bottom: 2px; }
					.item-details { font-size: 11px; display: flex; justify-content: space-between; }
					.total-section { margin: 15px 0; }
					.total-line { display: flex; justify-content: space-between; margin: 5px 0; }
					.grand-total { font-weight: bold; font-size: 14px; border-top: 1px dashed #000; padding-top: 5px; margin-top: 10px; }
					.footer { text-align: center; margin-top: 20px; font-size: 11px; }
					.footer-message { font-weight: bold; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
					@media print {
						body { padding: 10px; }
						button { display: none; }
					}
				</style>
			</head>
			<body>
				<div class="receipt">
					<div class="header">
						<div class="company-name">ROSEL FROZEN MEATS</div>
						<div>Quality Frozen Meats for Your Family</div>
					</div>
					
					<div class="divider"></div>
					
					<div class="order-info">
						<div style="font-weight: bold; margin-bottom: 5px;">Transaction ID:</div>
						<div style="text-align: center; margin-bottom: 10px;">${createdPurchaseOrder.purchaseOrderId}</div>
						<p><span class="label">PO Number:</span> ${createdPurchaseOrder.purchaseOrderId.substring(0, 8)}</p>
						<p><span class="label">Supplier:</span> ${createdPurchaseOrder.supplier}</p>
						<p><span class="label">Date & Time:</span> ${new Date(createdPurchaseOrder.createdAt).toLocaleString('en-US', { 
							year: 'numeric', 
							month: 'short', 
							day: 'numeric',
							hour: '2-digit',
							minute: '2-digit'
						})}</p>
					</div>
					
					<div class="divider"></div>
					
					<div class="items-section">
						<div class="item-header">ITEMS PURCHASED:</div>
						${createdPurchaseOrder.items.map((item, idx) => `
							<div class="item">
								<div class="item-name">${item.productName} (${item.weightKg.toFixed(2)}kg)</div>
								<div class="item-details">
									<span>₱${parseFloat(item.unitPrice).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} x ${item.quantity}</span>
								</div>
								<div class="item-details">
									<span>₱${parseFloat(item.totalPrice).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
								</div>
							</div>
						`).join('')}
					</div>
					
					<div class="divider"></div>
					
					<div class="total-section">
						<div class="total-line">
							<span>Subtotal:</span>
							<span>₱${parseFloat(createdPurchaseOrder.subtotal).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
						</div>
						<div class="total-line grand-total">
							<span>TOTAL:</span>
							<span>₱${parseFloat(createdPurchaseOrder.totalAmount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
						</div>
					</div>
					
					<div class="divider"></div>
					
					<div class="footer">
						<div class="footer-message">THANK YOU FOR YOUR PURCHASE!</div>
						<div>Please keep this receipt for your records</div>
					</div>
				</div>
				<button onclick="window.print()" style="position: fixed; top: 10px; right: 10px; padding: 10px 20px; background: #860809; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Receipt</button>
			</body>
			</html>
		`;
		
		receiptWindow.document.write(receiptContent);
		receiptWindow.document.close();
	};

	const handleCreateNewOrder = () => {
		setPoCart([]);
		setPoSupplier('');
		setPoSearchText('');
		setCreatedPurchaseOrder(null);
		setShowPoSuccessModal(false);
		// Refresh products to reflect updated stock
		fetchAllProducts();
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
                                    {createBarcodeMode !== 'camera' && (
                                        <input 
                                            value={newProduct.barcode} 
                                            onChange={(e)=>setNewProduct({...newProduct, barcode: e.target.value})} 
                                            placeholder='Scan or enter product barcode' 
                                            className='flex-1 bg-[#fffefc] border border-gray-300 rounded px-3 py-2 text-[#030105] focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice'
                                            required
                                        />
                                    )}
                                </div>
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
								<input type='number' min='1' max='50' step='0.01' value={newProduct.weightKg} onChange={(e)=>setNewProduct({...newProduct, weightKg: e.target.value})} placeholder='Enter weight in kilograms' className='w-full bg-[#fffefc] border border-gray-300 rounded px-3 py-2 text-[#030105] focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice' required />
							</div>

							{/* Row 4: Base Price per Kilogram | Stocks */}
							<div>
								<label className='block text-sm text-[#a31f17] mb-1 font-medium font-alice'>Base Price per Kilogram</label>
								<input type='number' min='1' max='10000' step='0.01' value={newProduct.price} onChange={(e)=>setNewProduct({...newProduct, price: e.target.value})} className='w-full bg-[#fffefc] border border-gray-300 rounded px-3 py-2 text-[#030105] focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice' required />
							</div>
							<div>
								<label className='block text-sm text-[#a31f17] mb-1 font-medium font-alice'>Stocks (quantity)</label>
								<input type='number' min='1' max='100' value={newProduct.quantity} onChange={(e)=>setNewProduct({...newProduct, quantity: e.target.value})} className='w-full bg-[#fffefc] border border-gray-300 rounded px-3 py-2 text-[#030105] focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice' required />
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
							onClick={()=>setUpdateSubTab('purchase-order')} 
							className={`px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded font-alice transition-colors text-xs sm:text-sm active:scale-95 ${updateSubTab==='purchase-order' ? 'bg-[#860809] text-white' : 'bg-[#a31f17] text-white hover:bg-[#860809]'}`}
						>
							<span className='whitespace-nowrap'>Purchase Order</span>
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
                        <div className='flex gap-2'>
                            {!isBatchEditing ? (
                                <button
                                    type='button'
                                    onClick={()=>{
                                        setIsBatchEditing(true);
                                        // seed all current rows into draft map
                                        const next = {};
                                        (priceRows||[]).forEach(r=>{ next[r.productId] = Number(r.basePrice).toFixed(2); });
                                        setDraftPriceById(prev=>({ ...next, ...prev }));
                                    }}
                                    className='px-3 py-2 bg-[#901414] text-white rounded hover:bg-[#7a0f0f] font-alice'
                                >Batch Update</button>
                            ) : (
                                <>
                                    <button
                                        type='button'
                                        onClick={async()=>{
                                            // apply all changed prices
                                            const tasks = [];
                                            (priceRows||[]).forEach(r=>{
                                                const raw = draftPriceById[r.productId];
                                                if (raw !== undefined && String(raw) !== String(r.basePrice)) {
                                                    const val = Math.round(Number(raw) * 100) / 100;
                                                    if (Number.isFinite(val) && val >= 0) {
                                                        tasks.push(updateBasePricePerKg(r.productId, val));
                                                    }
                                                }
                                            });
                                            await Promise.all(tasks);
                                            setIsBatchEditing(false);
                                        }}
                                        className='px-3 py-2 bg-[#901414] text-white rounded hover:bg-[#7a0f0f] font-alice'
                                    >Update</button>
                                    <button
                                        type='button'
                                        onClick={()=>{ setIsBatchEditing(false); setDraftPriceById({}); }}
                                        className='px-3 py-2 bg-[#82695b] text-white rounded hover:bg-[#6b5649] font-alice'
                                    >Cancel</button>
                                </>
                            )}
                        </div>
                    </div>

                        <div className='overflow-x-auto'>
                            <table className='min-w-full divide-y divide-[#82695b]'>
                                <thead className='bg-[#82695b]'>
                                    <tr>
                                        {renderPriceHeader('Supplier','supplier')}
                                        {renderPriceHeader('Product Name','name')}
                                        {renderPriceHeader('Product Category','category')}
                                        {renderPriceHeader('Base Price Per Kilo','price')}
                                        <th className='px-4 py-3 text-left text-xs font-medium text-[#feffff] uppercase tracking-wider'>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className='bg-[#feffff] divide-y divide-[#82695b]'>
                                    {priceRows.map((row)=> (
                                        <tr key={row.productId} className='hover:bg-[#f8f3ed] transition-colors'>
                                            <td className='px-4 py-3 text-[#82695b] text-sm'>{row.supplier}</td>
                                            <td className='px-4 py-3 text-[#82695b] text-sm'>{row.name}</td>
                                            <td className='px-4 py-3 text-[#82695b] text-sm capitalize'>{row.category}</td>
                                            <td className='px-4 py-3 text-[#82695b] text-sm'>
                                                {(editingRowId === row.productId) || isBatchEditing ? (
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
                                                {isBatchEditing ? (
                                                    <span className='text-xs text-[#82695b] opacity-70'>Batch editing…</span>
                                                ) : editingRowId === row.productId ? (
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
                                        <tr><td colSpan='5' className='px-4 py-6 text-center text-[#82695b]'>No products found</td></tr>
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

			{/* Purchase Order Sub-Tab */}
			{updateSubTab === 'purchase-order' && (
				<div className='grid grid-cols-1 lg:grid-cols-[60%_40%] gap-6'>
					{/* Left Column - Product Selection */}
					<motion.div className='bg-[#fffefc] shadow-lg rounded-lg p-6 border border-gray-300' initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
					<div className='mb-6 flex justify-between items-start'>
						<div>
							<h3 className='text-lg font-semibold text-[#860809] font-libre mb-2'>Purchase Order</h3>
							<p className='text-sm text-[#82695b]'>Create a new purchase order to add products to inventory from a supplier</p>
						</div>
						<div className='flex gap-2'>
							<button
								onClick={() => navigate('/purchase-order-history')}
								className='bg-[#860809] text-white px-4 py-2 rounded hover:bg-[#7a0f0f] flex items-center gap-2 whitespace-nowrap'
							>
								<History size={18} />
								View History
							</button>
							<button
								onClick={() => setShowAddWeight(true)}
								className='bg-[#82695b] text-white px-4 py-2 rounded hover:bg-[#6b5649] font-alice whitespace-nowrap'
							>
								Add New Weight
							</button>
						</div>
					</div>

						{/* Supplier Selection */}
						<div className='mb-6 relative'>
							<label className='block text-sm font-medium text-[#82695b] mb-2'>Select Supplier</label>
							<div className='relative' ref={supplierDropdownRef}>
								<input
									type='text'
									value={poSupplierSearchText}
									onChange={(e) => {
										setPoSupplierSearchText(e.target.value);
										setShowPoSupplierDropdown(true);
									}}
									onFocus={() => setShowPoSupplierDropdown(true)}
									placeholder='Type to search suppliers'
									className='w-full bg-[#fffefc] border border-[#82695b] rounded px-3 py-2 text-[#82695b] focus:ring-2 focus:ring-[#860809]'
								/>
								{showPoSupplierDropdown && filteredPoSuppliers.length > 0 && (
									<div className='absolute z-10 w-full mt-1 bg-white border border-[#82695b] rounded shadow-lg max-h-60 overflow-y-auto'>
										{filteredPoSuppliers.map(supplier => (
											<button
												key={supplier}
												type='button'
												onClick={() => {
													setPoSupplier(supplier);
													setPoSupplierSearchText(supplier);
													setShowPoSupplierDropdown(false);
													setPoCart([]); // Clear cart if supplier changes
												}}
												className='w-full text-left px-3 py-2 hover:bg-[#f8f3ed] text-[#82695b] block'
											>
												{supplier}
											</button>
										))}
									</div>
								)}
							</div>
							{poSupplier && (
								<div className='mt-2'>
									<span className='text-sm text-[#82695b]'>Selected: </span>
									<span className='text-sm font-semibold text-[#860809]'>{poSupplier}</span>
								</div>
							)}
						</div>

						{/* Product Search */}
						<div className='mb-6'>
							<label className='block text-sm font-medium text-[#82695b] mb-2'>Search Products</label>
							<input
								type='text'
								value={poSearchText}
								onChange={(e) => setPoSearchText(e.target.value)}
								placeholder='Search by name or barcode'
								className='w-full bg-[#fffefc] border border-[#82695b] rounded px-3 py-2 text-[#82695b] focus:ring-2 focus:ring-[#860809]'
							/>
						</div>

						{/* Available Products */}
						<div>
							<h4 className='text-md font-semibold text-[#860809] mb-3'>Available Products</h4>
							{!poSupplier ? (
								<div className='text-center text-[#82695b] py-8'>
									Please select a supplier first
								</div>
							) : filteredPoProducts.length === 0 ? (
								<div className='text-center text-[#82695b] py-8'>
									No products found for supplier: {poSupplier}
								</div>
							) : (
								<div className='overflow-x-auto max-h-[600px] overflow-y-auto'>
									<table className='min-w-full divide-y divide-[#82695b]'>
										<thead className='bg-[#82695b] sticky top-0'>
											<tr>
												<th className='px-3 py-2 text-left text-xs font-medium text-[#feffff] uppercase'>Product</th>
												<th className='px-3 py-2 text-left text-xs font-medium text-[#feffff] uppercase'>Stock</th>
												<th className='px-3 py-2 text-left text-xs font-medium text-[#feffff] uppercase'>Weight</th>
												<th className='px-3 py-2 text-left text-xs font-medium text-[#feffff] uppercase'>Price</th>
												<th className='px-3 py-2 text-left text-xs font-medium text-[#feffff] uppercase'>Action</th>
											</tr>
										</thead>
										<tbody className='bg-[#feffff] divide-y divide-[#82695b]'>
											{filteredPoProducts.flatMap(product => 
												product.weightOptions && product.weightOptions.length > 0
													? product.weightOptions.map(opt => {
														const basePrice = product.basePricePerKg * opt.weightKg;
														const PRODUCT_MARKUP = 50;
														const purchasePrice = Math.max(0, basePrice - PRODUCT_MARKUP);
														
														return (
															<tr key={`${product._id}-${opt._id}`} className='hover:bg-[#f8f3ed]'>
																<td className='px-3 py-2 text-sm text-[#82695b]'>{product.name}</td>
																<td className='px-3 py-2 text-sm text-[#82695b]'>{opt.stockUnits || 0}</td>
																<td className='px-3 py-2 text-sm text-[#82695b]'>{opt.weightKg.toFixed(2)}kg</td>
																<td className='px-3 py-2 text-sm text-[#82695b]'>₱{purchasePrice.toFixed(2)}</td>
																<td className='px-3 py-2 text-sm'>
																	<button
																		onClick={() => addToPoCart(product, opt)}
																		disabled={!poSupplier || product.supplier !== poSupplier}
																		className='bg-[#a31f17] text-white px-2 py-1 rounded hover:bg-[#860809] disabled:opacity-50 disabled:cursor-not-allowed text-xs'
																	>
																		Add
																	</button>
																</td>
															</tr>
														);
													})
													: []
											)}
										</tbody>
									</table>
								</div>
							)}
						</div>
					</motion.div>

					{/* Right Column - Purchase Summary */}
					<motion.div className='bg-[#fffefc] shadow-lg rounded-lg p-6 border border-gray-300' initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
						<h4 className='text-md font-semibold text-[#860809] mb-3'>Purchase Order Summary</h4>
						{!poSupplier ? (
							<div className='bg-[#f8f3ed] p-8 rounded-lg text-center border border-[#82695b]'>
								<p className='text-[#82695b]'>Please select a supplier to start creating a purchase order</p>
							</div>
						) : poCart.length === 0 ? (
							<div className='bg-[#f8f3ed] p-8 rounded-lg text-center border border-[#82695b]'>
								<p className='text-[#82695b]'>No items added yet</p>
								<p className='text-sm text-[#82695b] mt-2'>Add products from the left column</p>
							</div>
						) : (
							<div className='space-y-4'>
								{/* Cart Items */}
								<div className='overflow-x-auto max-h-[500px] overflow-y-auto'>
									<table className='min-w-full divide-y divide-[#82695b]'>
										<thead className='bg-[#82695b] sticky top-0'>
											<tr>
												<th className='px-3 py-2 text-left text-xs font-medium text-[#feffff] uppercase'>Product</th>
												<th className='px-3 py-2 text-left text-xs font-medium text-[#feffff] uppercase'>Qty</th>
												<th className='px-3 py-2 text-left text-xs font-medium text-[#feffff] uppercase'>Price</th>
												<th className='px-3 py-2 text-left text-xs font-medium text-[#feffff] uppercase'>Total</th>
												<th className='px-3 py-2 text-left text-xs font-medium text-[#feffff] uppercase'></th>
											</tr>
										</thead>
										<tbody className='bg-[#feffff] divide-y divide-[#82695b]'>
											{poCart.map(item => {
												const basePrice = item.basePricePerKg * item.weightKg;
												const PRODUCT_MARKUP = 50;
												const purchasePrice = Math.max(0, basePrice - PRODUCT_MARKUP);
												const total = purchasePrice * item.quantity;
												
												return (
													<tr key={`${item.productId}-${item.weightOptionId}`} className='hover:bg-[#f8f3ed]'>
														<td className='px-3 py-2 text-sm text-[#82695b]'>
															<div>
																<div className='font-semibold'>{item.productName}</div>
																<div className='text-xs text-gray-500'>{item.weightKg.toFixed(2)}kg</div>
															</div>
														</td>
														<td className='px-3 py-2 text-sm text-[#82695b]'>
															<div className='flex items-center gap-2'>
																<button onClick={() => updatePoCartQuantity(item.productId, item.weightOptionId, item.quantity - 1)} className='bg-gray-200 px-2 py-1 rounded hover:bg-gray-300'>-</button>
																<span className='min-w-[2rem] text-center'>{item.quantity}</span>
																<button onClick={() => updatePoCartQuantity(item.productId, item.weightOptionId, item.quantity + 1)} className='bg-gray-200 px-2 py-1 rounded hover:bg-gray-300'>+</button>
															</div>
														</td>
														<td className='px-3 py-2 text-sm text-[#82695b]'>₱{purchasePrice.toFixed(2)}</td>
														<td className='px-3 py-2 text-sm text-[#82695b] font-semibold'>₱{total.toFixed(2)}</td>
														<td className='px-3 py-2 text-sm'>
															<button onClick={() => removePoCartItem(item.productId, item.weightOptionId)} className='text-red-600 hover:text-red-800'>
																<Trash2 size={16} />
															</button>
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>

								{/* Total and Submit */}
								<div className='bg-[#f8f3ed] p-4 rounded-lg border border-[#82695b]'>
									<div className='flex justify-between items-center mb-4'>
										<span className='text-lg font-semibold text-[#860809]'>Total Amount:</span>
										<span className='text-xl font-bold text-[#860809]'>
											₱{poCart.reduce((sum, item) => {
												const basePrice = item.basePricePerKg * item.weightKg;
												const PRODUCT_MARKUP = 50;
												const purchasePrice = Math.max(0, basePrice - PRODUCT_MARKUP);
												return sum + (purchasePrice * item.quantity);
											}, 0).toFixed(2)}
										</span>
									</div>
									<button
										onClick={handleCreatePurchaseOrder}
										className='w-full bg-[#860809] text-white px-6 py-3 rounded hover:bg-[#7a0f0f] disabled:opacity-50 disabled:cursor-not-allowed font-semibold'
										disabled={loading || poCart.length === 0 || !poSupplier}
									>
										{loading ? 'Creating Purchase Order...' : 'Create Purchase Order'}
									</button>
								</div>
							</div>
						)}
					</motion.div>
				</div>
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
																			<th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Created At</th>
																			<th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Expire At</th>
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
																						{option.createdAt ? new Date(option.createdAt).toLocaleDateString('en-US', { 
																							year: 'numeric', 
																							month: 'short', 
																							day: 'numeric' 
																						}) : 'N/A'}
																					</td>
																					<td className='px-4 py-2 text-sm text-gray-900'>
																						{option.expireAt ? new Date(option.expireAt).toLocaleDateString('en-US', { 
																							year: 'numeric', 
																							month: 'short', 
																							day: 'numeric' 
																						}) : 'N/A'}
																					</td>
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
                            hideStocks={updateSubTab === 'purchase-order'}
                            onCancel={()=>setShowAddWeight(false)}
                            onSubmit={async (payload)=>{
                                if (updateSubTab === 'purchase-order') {
                                    setPendingWeightForPO(payload);
                                    setShowAddWeight(false);
                                    setShowPurchaseOrderInWeight(true);
                                } else {
                                    await addWeightOption(payload.productId, { weightKg: payload.weightKg, stockUnits: payload.stockUnits, barcode: payload.barcode });
                                    setShowAddWeight(false);
                                }
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Purchase Order for New Weight Modal */}
            {showPurchaseOrderInWeight && pendingWeightForPO && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
                    <div className='bg-[#feffff] rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-[#82695b]'>
                        <div className='mb-4 flex justify-between items-start'>
                            <div>
                                <h3 className='text-xl font-semibold text-[#860809] mb-2'>Create Purchase Order for New Weight</h3>
                                <p className='text-sm text-[#82695b]'>Add the new weight option to your purchase order</p>
                            </div>
                            <button
                                onClick={() => navigate('/purchase-order-history')}
                                className='bg-[#860809] text-white px-4 py-2 rounded hover:bg-[#7a0f0f] flex items-center gap-2'
                            >
                                <History size={18} />
                                View History
                            </button>
                        </div>

                        <div className='grid grid-cols-1 lg:grid-cols-[60%_40%] gap-4'>
                            {/* Left: Product Info */}
                            <div className='bg-[#f8f3ed] p-4 rounded-lg border border-[#82695b]'>
                                <h4 className='text-md font-semibold text-[#860809] mb-3'>New Weight Details</h4>
                                {(() => {
                                    const product = products.find(p => p._id === pendingWeightForPO.productId);
                                    if (!product) return <p className='text-[#82695b]'>Loading...</p>;
                                    
                                    return (
                                        <div className='space-y-2 text-sm text-[#82695b]'>
                                            <p><span className='font-semibold'>Product:</span> {product.name}</p>
                                            <p><span className='font-semibold'>Category:</span> {product.category}</p>
                                            <p><span className='font-semibold'>Supplier:</span> {product.supplier || 'N/A'}</p>
                                            <p><span className='font-semibold'>Weight:</span> {pendingWeightForPO.weightKg}kg</p>
                                            <p><span className='font-semibold'>Barcode:</span> {pendingWeightForPO.barcode}</p>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Right: Purchase Summary */}
                            <div className='bg-[#f8f3ed] p-4 rounded-lg border border-[#82695b]'>
                                <h4 className='text-md font-semibold text-[#860809] mb-3'>Purchase Summary</h4>
                                {newWeightPOCart.length === 0 ? (
                                    <div className='text-center text-[#82695b] py-8'>
                                        <p>Add this weight to create a purchase order</p>
                                        <button
                                            onClick={() => {
                                                setNewWeightPOCart([{
                                                    ...pendingWeightForPO,
                                                    quantity: 1
                                                }]);
                                            }}
                                            className='mt-4 px-4 py-2 bg-[#860809] text-white rounded hover:bg-[#7a0f0f]'
                                        >
                                            Add to Purchase Order
                                        </button>
                                    </div>
                                ) : (
                                    <div className='space-y-3'>
                                        <div className='space-y-2'>
                                            {newWeightPOCart.map((item, idx) => {
                                                const product = products.find(p => p._id === item.productId);
                                                const basePrice = product?.basePricePerKg || 0;
                                                const PRODUCT_MARKUP = 50;
                                                const purchasePrice = Math.max(0, basePrice * parseFloat(item.weightKg) - PRODUCT_MARKUP);
                                                const total = purchasePrice * item.quantity;
                                                
                                                return (
                                                    <div key={idx} className='bg-white p-3 rounded border border-[#82695b]'>
                                                        <p className='font-semibold text-[#82695b]'>{product?.name}</p>
                                                        <p className='text-xs text-[#82695b]'>{item.weightKg}kg</p>
                                                        <div className='flex items-center justify-between mt-2'>
                                                            <div className='flex items-center gap-2'>
                                                                <button
                                                                    onClick={() => setNewWeightPOCart(prev => prev.map((cartItem, index) => index === idx ? { ...cartItem, quantity: Math.max(0, cartItem.quantity - 1) } : cartItem))}
                                                                    className='w-6 h-6 flex items-center justify-center bg-[#860809] text-white rounded'
                                                                >
                                                                    -
                                                                </button>
                                                                <span className='text-[#82695b]'>{item.quantity}</span>
                                                                <button
                                                                    onClick={() => setNewWeightPOCart(prev => prev.map((cartItem, index) => index === idx ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem))}
                                                                    className='w-6 h-6 flex items-center justify-center bg-[#860809] text-white rounded'
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                            <span className='font-semibold text-[#860809]'>₱{total.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        
                                        <div className='border-t border-[#82695b] pt-2'>
                                            <div className='flex justify-between items-center'>
                                                <span className='font-semibold text-[#82695b]'>Total:</span>
                                                <span className='text-lg font-bold text-[#860809]'>
                                                    ₱{newWeightPOCart.reduce((sum, item) => {
                                                        const product = products.find(p => p._id === item.productId);
                                                        const basePrice = product?.basePricePerKg || 0;
                                                        const PRODUCT_MARKUP = 50;
                                                        const purchasePrice = Math.max(0, basePrice * parseFloat(item.weightKg) - PRODUCT_MARKUP);
                                                        return sum + (purchasePrice * item.quantity);
                                                    }, 0).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className='flex gap-2'>
                                            <button
                                                onClick={async () => {
                                                    const product = products.find(p => p._id === pendingWeightForPO.productId);
                                                    const supplier = product?.supplier || '';
                                                    
                                                    if (!supplier) {
                                                        toast.error('Product has no supplier');
                                                        return;
                                                    }

                                                    const items = newWeightPOCart.map(item => ({
                                                        productId: item.productId,
                                                        weightKg: parseFloat(item.weightKg),
                                                        quantity: item.quantity
                                                    }));

                                                    try {
                                                        await addWeightOption(pendingWeightForPO.productId, { 
                                                            weightKg: pendingWeightForPO.weightKg, 
                                                            stockUnits: pendingWeightForPO.stockUnits, 
                                                            barcode: pendingWeightForPO.barcode 
                                                        });
                                                        
                                                        const result = await createPurchaseOrder({
                                                            supplier: supplier,
                                                            items: items
                                                        });

                                                        if (result?.success) {
                                                            setCreatedPurchaseOrder(result.data);
                                                            setShowPurchaseOrderInWeight(false);
                                                            setNewWeightPOCart([]);
                                                            setPendingWeightForPO(null);
                                                            setShowPoSuccessModal(true);
                                                            toast.success('Purchase order created and weight added!');
                                                            await fetchAllProducts(); // Refresh products
                                                        } else {
                                                            toast.error(result?.error || 'Failed to create purchase order');
                                                        }
                                                    } catch (error) {
                                                        toast.error('Failed to create weight option: ' + (error.message || 'Unknown error'));
                                                    }
                                                }}
                                                className='flex-1 px-4 py-2 bg-[#860809] text-white rounded hover:bg-[#7a0f0f]'
                                            >
                                                Create Purchase Order
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowPurchaseOrderInWeight(false);
                                                    setNewWeightPOCart([]);
                                                    setPendingWeightForPO(null);
                                                }}
                                                className='px-4 py-2 bg-[#82695b] text-white rounded hover:bg-[#6b5649]'
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
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

		{/* Purchase Order Confirmation Modal */}
		{showPoConfirmModal && (
			<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
				<div className='bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
					<h3 className='text-xl font-bold text-[#860809] mb-4'>
						{isCreatingProductPO ? 'Create Product & Purchase Order' : 'Confirm Purchase Order'}
					</h3>
					
					{isCreatingProductPO ? (
						// New Product Creation Summary
						<div>
							<p className='text-sm text-gray-600 mb-4'>Creating a new product and adding it to purchase order</p>
							<div className='mb-4'>
								<p className='text-[#82695b] font-semibold'>Product: {newProduct.name}</p>
								<p className='text-[#82695b] font-semibold'>Supplier: {newProduct.supplier?.trim() || poSupplier || 'Not specified'}</p>
								<p className='text-[#82695b]'>Weight: {newProduct.weightKg} kg</p>
								<p className='text-[#82695b]'>Quantity: {newProduct.quantity} units</p>
								<p className='text-[#82695b]'>Base Price: ₱{newProduct.price} per kg</p>
								<p className='text-[#82695b] font-semibold text-lg mt-2'>
									Total: ₱{(Number(newProduct.price) * Number(newProduct.weightKg) * Number(newProduct.quantity)).toFixed(2)}
								</p>
							</div>
						</div>
					) : (
						// Regular PO Summary
						<>
							<div className='mb-4'>
								<p className='text-[#82695b] font-semibold'>Supplier: {poSupplier}</p>
								<p className='text-[#82695b]'>Items: {poCart.length}</p>
								<p className='text-[#82695b] font-semibold text-lg'>
									Total: ₱{poCart.reduce((sum, item) => {
										const basePrice = item.basePricePerKg * item.weightKg;
										const PRODUCT_MARKUP = 50;
										const purchasePrice = Math.max(0, basePrice - PRODUCT_MARKUP);
										return sum + (purchasePrice * item.quantity);
									}, 0).toFixed(2)}
								</p>
							</div>
							<div className='mb-4'>
								<p className='text-sm text-[#82695b] mb-2'>Items:</p>
								<div className='max-h-60 overflow-y-auto'>
									{poCart.map(item => {
										const basePrice = item.basePricePerKg * item.weightKg;
										const PRODUCT_MARKUP = 50;
										const purchasePrice = Math.max(0, basePrice - PRODUCT_MARKUP);
										return (
											<div key={`${item.productId}-${item.weightOptionId}`} className='border-b py-2'>
												<p className='font-semibold text-[#82695b]'>{item.productName}</p>
												<p className='text-sm text-[#82695b]'>
													{item.weightKg.toFixed(2)}kg × {item.quantity} @ ₱{purchasePrice.toFixed(2)} = ₱{(purchasePrice * item.quantity).toFixed(2)}
												</p>
											</div>
										);
									})}
								</div>
							</div>
						</>
					)}
					
					<div className='flex gap-3 justify-end'>
						<button
							onClick={() => {
								setShowPoConfirmModal(false);
								setIsCreatingProductPO(false);
							}}
							className='px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded text-gray-800'
						>
							Cancel
						</button>
						<button
							onClick={confirmCreatePurchaseOrder}
							className='px-4 py-2 bg-[#860809] hover:bg-[#7a0f0f] rounded text-white'
						>
							{isCreatingProductPO ? 'Create Product & Order' : 'Confirm & Create Order'}
						</button>
					</div>
				</div>
			</div>
		)}

			{/* Purchase Order Success Modal */}
			{showPoSuccessModal && createdPurchaseOrder && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
					<div className='bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto font-mono'>
						{/* Receipt Header */}
						<div className='text-center mb-6'>
							<div className='text-xl font-bold mb-2'>ROSEL FROZEN MEATS</div>
							<div className='text-xs text-gray-600'>Quality Frozen Meats for Your Family</div>
						</div>

						<div className='border-t border-dashed border-gray-400 my-4'></div>

						{/* Order Info */}
						<div className='mb-4'>
							<div className='text-xs font-bold mb-2'>Transaction ID:</div>
							<div className='text-xs text-center mb-3 break-all'>{createdPurchaseOrder.purchaseOrderId}</div>
							<div className='text-xs flex justify-between'>
								<span className='font-bold'>PO Number:</span>
								<span>{createdPurchaseOrder.purchaseOrderId.substring(0, 8)}</span>
							</div>
							<div className='text-xs flex justify-between mt-1'>
								<span className='font-bold'>Supplier:</span>
								<span>{createdPurchaseOrder.supplier}</span>
							</div>
							<div className='text-xs flex justify-between mt-1'>
								<span className='font-bold'>Date & Time:</span>
								<span>{new Date(createdPurchaseOrder.createdAt).toLocaleString('en-US', { 
									year: 'numeric', 
									month: 'short', 
									day: 'numeric',
									hour: '2-digit',
									minute: '2-digit'
								})}</span>
							</div>
						</div>

						<div className='border-t border-dashed border-gray-400 my-4'></div>

						{/* Items */}
						<div className='mb-4'>
							<div className='text-xs font-bold mb-2'>ITEMS PURCHASED:</div>
							{createdPurchaseOrder.items.map((item, idx) => (
								<div key={idx} className='mb-3'>
									<div className='text-xs mb-1'>{item.productName} ({item.weightKg.toFixed(2)}kg)</div>
									<div className='text-xs flex justify-between'>
										<span>₱{parseFloat(item.unitPrice).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} x {item.quantity}</span>
									</div>
									<div className='text-xs flex justify-between font-semibold'>
										<span>₱{parseFloat(item.totalPrice).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
									</div>
								</div>
							))}
						</div>

						<div className='border-t border-dashed border-gray-400 my-4'></div>

						{/* Totals */}
						<div className='mb-4'>
							<div className='text-xs flex justify-between mb-1'>
								<span>Subtotal:</span>
								<span>₱{parseFloat(createdPurchaseOrder.subtotal).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
							</div>
							<div className='text-sm flex justify-between font-bold border-t border-dashed border-gray-400 pt-2 mt-2'>
								<span>TOTAL:</span>
								<span>₱{parseFloat(createdPurchaseOrder.totalAmount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
							</div>
						</div>

						<div className='border-t border-dashed border-gray-400 my-4'></div>

						{/* Footer */}
						<div className='text-center text-xs mb-6'>
							<div className='font-bold uppercase'>Thank You For Your Purchase!</div>
							<div className='mt-1'>Please keep this receipt for your records</div>
						</div>

						{/* Action Buttons */}
						<div className='flex gap-3 justify-end pt-4 border-t border-gray-300'>
							<button
								onClick={handlePrintReceipt}
								className='px-4 py-2 bg-[#82695b] hover:bg-[#6b5649] rounded text-white flex items-center gap-2'
							>
								<Printer size={18} />
								Print Receipt
							</button>
							<button
								onClick={handleCreateNewOrder}
								className='px-4 py-2 bg-[#860809] hover:bg-[#7a0f0f] rounded text-white'
							>
								Create New Order
							</button>
						</div>
					</div>
				</div>
			)}
		</AdminLayout>
	);
};

export default ManageProductsPage;



const AddWeightForm = ({ products, hideStocks = false, onCancel, onSubmit }) => {
    const [mode, setMode] = useState("manual"); // manual | scanner
    const [supplier, setSupplier] = useState("");
    const [productId, setProductId] = useState("");
    const [weightKg, setWeightKg] = useState("");
    const [stockUnits, setStockUnits] = useState("");
    const [barcode, setBarcode] = useState("");
    const [lastScanned, setLastScanned] = useState("");

    const productChoices = useMemo(()=> (products||[]).filter(p => !supplier || p.supplier === supplier), [products, supplier]);
    const selected = useMemo(()=> {
        const found = (products||[]).find(p => p._id === productId);
        return found;
    }, [products, productId]);

    useEffect(() => {
        if (mode !== 'scanner') return;
        
        let buffer = '';
        let lastTs = 0;
        
        const onKey = async (e) => {
            const now = Date.now();
            if (now - lastTs > 50) buffer = '';
            
            const activeElement = document.activeElement;
            const isBarcodeInputFocused = activeElement && activeElement.type === 'text' && activeElement.placeholder?.includes('barcode');
            
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
                
                let product = (products || []).find(p => p.barcode === code);
                
                if (!product) {
                    const codeNoDashes = code.replace(/-/g, '');
                    product = (products || []).find(p => p.barcode === codeNoDashes);
                }
                
                if (!product) {
                    const codeNoDashes = code.replace(/-/g, '');
                    product = (products || []).find(p => p.barcode?.replace(/-/g, '') === codeNoDashes);
                }
                
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
                        setSupplier(product.supplier || '');
                        setProductId(product._id);
                        setBarcode(code);
                        toast.success(`Product selected: ${product.name} (weight barcode detected)`);
                    }
                } else {
                    setSupplier(product.supplier || '');
                    setProductId(product._id);
                    toast.success(`Product selected: ${product.name}`);
                }
                
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
        const s = stockUnits ? parseInt(stockUnits, 10) : 0; // Default to 0 if hidden
        const b = barcode.trim();
        
        if (!productId || !Number.isFinite(w) || w <= 0 || (hideStocks ? false : (!Number.isInteger(s) || s < 0)) || !b) {
            if (!b) toast.error('Barcode is required');
            return;
        }
        
        const payload = { 
            productId, 
            weightKg: Math.round(w*100)/100, 
            stockUnits: hideStocks ? 0 : s, // Don't send stocks if hidden
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
                        onClick={() => { setMode('manual'); setSupplier(''); setProductId(''); setLastScanned(''); }}
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
                        onClick={() => { setMode('scanner'); setSupplier(''); setProductId(''); setLastScanned(''); }}
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

            {/* Supplier Selection */}
            <div>
                <label className='block text-sm text-[#82695b] mb-1 font-medium'>Supplier</label>
                {mode === 'scanner' && supplier ? (
                    <div className='w-full bg-gray-100 border border-[#82695b] rounded px-3 py-2 text-[#82695b]'>
                        {supplier}
                    </div>
                ) : (
                    <select 
                        value={supplier} 
                        onChange={(e)=>{ setSupplier(e.target.value); setProductId(""); }} 
                        disabled={mode === 'scanner'}
                        className='w-full bg-[#f8f3ed] border border-[#82695b] rounded px-3 py-2 text-[#82695b] disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        <option value=''>{mode === 'scanner' ? 'Will be auto-selected' : 'Select Supplier'}</option>
                        {[...new Set((products||[]).filter(p => p.supplier).map(p => p.supplier))].map(s=> <option key={s} value={s}>{s}</option>)}
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
                        disabled={mode === 'scanner' || (mode === 'manual' && !supplier)} 
                        className='w-full bg-[#f8f3ed] border border-[#82695b] rounded px-3 py-2 text-[#82695b] disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        <option value=''>
                            {mode === 'scanner' ? 'Will be auto-selected' : (supplier ? 'Select Product' : 'Select supplier first')}
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

            {hideStocks ? (
                <div>
                    <label className='block text-sm text-[#82695b] mb-1 font-medium'>Weight (kg)</label>
                    <input type='number' step='0.01' min='0.01' value={weightKg} onChange={(e)=>setWeightKg(e.target.value)} disabled={!productId} className='w-full bg-[#f8f3ed] border border-[#82695b] rounded px-3 py-2 text-[#82695b] disabled:opacity-50' />
                </div>
            ) : (
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
            )}

            {selected && (
                <div className='text-xs text-[#82695b]'>Current weight options: {(selected.weightOptions||[]).map(o=>`${o.weightKg}kg (${o.stockUnits})`).join(', ') || 'none'}</div>
            )}
            <div className='flex justify-end gap-2 pt-2'>
                <button type='button' onClick={onCancel} className='px-3 py-2 bg-[#82695b] hover:bg-[#6b5649] text-white rounded'>Cancel</button>
                <button type='submit' disabled={!productId || !weightKg || !barcode.trim() || (!hideStocks && !stockUnits)} className='px-3 py-2 bg-[#901414] hover:bg-[#7a0f0f] text-white rounded disabled:opacity-50'>Add</button>
            </div>
        </form>
    );
};