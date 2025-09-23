import { useState } from "react";

const luzonProvinces = [
    "Abra", "Apayao", "Benguet", "Ifugao", "Kalinga", "Mountain Province", // Cordillera Administrative Region
    "Batanes", "Cagayan", "Isabela", "Nueva Vizcaya", "Quirino", // Cagayan Valley
    "Aurora", "Bataan", "Bulacan", "Nueva Ecija", "Pampanga", "Tarlac", "Zambales", // Central Luzon
    "Batangas", "Cavite", "Laguna", "Quezon", "Rizal", // CALABARZON
    "Marinduque", "Occidental Mindoro", "Oriental Mindoro", "Palawan", "Romblon", // MIMAROPA
    "Albay", "Camarines Norte", "Camarines Sur", "Catanduanes", "Masbate", "Sorsogon", // Bicol Region
    "Metro Manila" // National Capital Region
];

const ProvinceDropdown = ({ value, onChange, className = "", placeholder = "Select Province" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredProvinces = luzonProvinces.filter(province =>
        province.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (province) => {
        onChange(province);
        setIsOpen(false);
        setSearchTerm("");
    };

    return (
        <div className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#901414] focus:border-[#901414]"
            >
                <span className={value ? "text-gray-900" : "text-gray-500"}>
                    {value || placeholder}
                </span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </span>
            </button>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    <div className="p-2">
                        <input
                            type="text"
                            placeholder="Search provinces..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#901414] focus:border-[#901414]"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        {filteredProvinces.map((province) => (
                            <button
                                key={province}
                                type="button"
                                onClick={() => handleSelect(province)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-[#f8f3ed] focus:bg-[#f8f3ed] focus:outline-none"
                            >
                                {province}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProvinceDropdown;
