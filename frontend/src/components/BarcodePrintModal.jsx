import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Printer, X } from 'lucide-react';

const BarcodePrintModal = ({ isOpen, onClose, barcode, productName, weightKg = null }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isOpen && barcode && canvasRef.current) {
      try {
        // Clear previous barcode
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Generate new barcode
        JsBarcode(canvas, barcode, {
          format: "CODE128",
          width: 2,
          height: 100,
          displayValue: true,
          fontSize: 16,
          margin: 10,
          background: "#ffffff",
          lineColor: "#000000"
        });
      } catch (error) {
        console.error('Barcode generation error:', error);
      }
    }
  }, [isOpen, barcode]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=600,height=400');
    
    if (!printWindow) {
      alert('Please allow popups for printing functionality');
      return;
    }

    const displayName = weightKg ? `${productName} (${weightKg} kg)` : productName;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode - ${displayName}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              margin: 20px;
              background: white;
            }
            .barcode-container { 
              border: 2px solid #333; 
              padding: 20px; 
              margin: 20px auto; 
              max-width: 400px;
              background: white;
            }
            .product-name { 
              font-size: 20px; 
              font-weight: bold; 
              margin-bottom: 15px;
              color: #333;
            }
            .weight-info {
              font-size: 16px;
              color: #860809;
              margin-bottom: 10px;
            }
            .barcode-number { 
              font-size: 16px; 
              margin-top: 15px;
              font-weight: bold;
              color: #666;
            }
            .company-info {
              font-size: 12px;
              color: #999;
              margin-top: 10px;
            }
            @media print {
              body { margin: 0; }
              .barcode-container { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            <div class="product-name">${productName}</div>
            ${weightKg ? `<div class="weight-info">${weightKg} kg</div>` : ''}
            <canvas id="barcode-canvas" width="400" height="120"></canvas>
            <div class="barcode-number">${barcode}</div>
            <div class="company-info">Rosel Frozen Meats</div>
          </div>
        </body>
      </html>
    `);
    
    // Generate barcode in the new window
    setTimeout(() => {
      const canvas = printWindow.document.getElementById('barcode-canvas');
      if (canvas) {
        try {
          JsBarcode(canvas, barcode, {
            format: "CODE128",
            width: 2,
            height: 100,
            displayValue: true,
            fontSize: 16,
            margin: 10,
            background: "#ffffff",
            lineColor: "#000000"
          });
        } catch (error) {
          console.error('Print barcode generation error:', error);
        }
      }
      
      // Auto-print after a short delay
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-[#860809] font-libre">Barcode Preview</h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="text-center mb-6">
          <div className="font-semibold mb-3 text-[#030105] font-alice">
            {productName}
            {weightKg && <span className="text-[#860809] ml-2">({weightKg} kg)</span>}
          </div>
          <div className="border border-gray-300 rounded p-4 bg-white">
            <canvas 
              ref={canvasRef} 
              className="max-w-full h-auto"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
          <div className="text-sm text-gray-600 mt-3 font-mono">{barcode}</div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handlePrint}
            className="flex-1 bg-[#860809] text-white px-4 py-2 rounded hover:bg-[#a31f17] transition-colors flex items-center justify-center gap-2 font-alice"
          >
            <Printer className="h-4 w-4" />
            Print Barcode
          </button>
          <button 
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors font-alice"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodePrintModal;
