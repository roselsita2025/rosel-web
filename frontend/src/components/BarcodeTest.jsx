import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

const BarcodeTest = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      try {
        JsBarcode(canvasRef.current, "123456789", {
          format: "CODE128",
          width: 2,
          height: 100,
          displayValue: true,
          fontSize: 16,
          margin: 10
        });
        console.log('Barcode generated successfully!');
      } catch (error) {
        console.error('Barcode generation error:', error);
      }
    }
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Barcode Test</h2>
      <canvas ref={canvasRef} className="border border-gray-300"></canvas>
      <p className="mt-2 text-sm text-gray-600">Test barcode: 123456789</p>
    </div>
  );
};

export default BarcodeTest;
