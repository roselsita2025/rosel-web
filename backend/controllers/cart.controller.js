import Product from "../models/product.model.js";

export const getCartProducts = async (req, res) => {
	try {
		const products = await Product.find({ _id: { $in: req.user.cartItems.map(item => item.id) } });

		// Create cart items with weight option information
		const cartItems = req.user.cartItems.map((cartItem) => {
			const product = products.find(p => p._id.toString() === cartItem.id);
			if (!product) return null;

			const cartItemData = {
				...product.toJSON(),
				cartQuantity: cartItem.quantity,
				weightOptionId: cartItem.weightOptionId || null
			};

			// If this is a weighted product, add weight and unit price info
			if (cartItem.weightOptionId && product.hasWeightOptions) {
				const selectedOption = product.weightOptions.find(opt => 
					String(opt._id) === String(cartItem.weightOptionId)
				);
				if (selectedOption) {
					cartItemData.weightKg = selectedOption.weightKg;
					cartItemData.unitPrice = selectedOption.price || (product.basePricePerKg * selectedOption.weightKg);
					cartItemData.stockQuantity = selectedOption.stockUnits;
				}
			} else {
				// Legacy product
				cartItemData.stockQuantity = product.quantity;
				cartItemData.unitPrice = product.price;
			}

			return cartItemData;
		}).filter(Boolean); // Remove null items

		res.json(cartItems);
	} catch (error) {
		console.log("Error in getCartProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const addToCart = async (req, res) => {
    try {
        const { productId, weightOptionId } = req.body;
        const user = req.user;

        // Find existing cart item with same product and weight option
        const existingItem = user.cartItems.find((item) => 
            item.id === productId && 
            String(item.weightOptionId || '') === String(weightOptionId || '')
        );

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            // Create new cart item with weight option info
            const newItem = {
                id: productId,
                quantity: 1,
                ...(weightOptionId && { weightOptionId })
            };
            user.cartItems.push(newItem);
        }

        await user.save();
        res.json(user.cartItems);

    } catch (error) {
        console.log("Error in addToCart controller", error);
        res.status(500).json({message: "Server error", error: error.message});
    }
};

export const removeAllFromCart = async (req, res) => {
    try {
        const { productId, weightOptionId } = req.body;
        const user = req.user;  
        
        if (!productId) {
            user.cartItems = [];            
        } else {
            // Remove specific product with specific weight option
            user.cartItems = user.cartItems.filter(item => 
                !(item.id === productId && 
                  String(item.weightOptionId || '') === String(weightOptionId || ''))
            );
        }
        await user.save();
        res.json(user.cartItems);
    } catch (error) {
        console.log("Error in removeAllFromCart controller", error.message);
        res.status(500).json({message: "Server error", error: error.message});
    }
};

export const updateQuantity = async (req, res) => {
    try {
        const {id:productId} = req.params;
        const {quantity, weightOptionId} = req.body;
        const user = req.user;
        
        const existingItem = user.cartItems.find(item => 
            item.id === productId && 
            String(item.weightOptionId || '') === String(weightOptionId || '')
        );

        if(existingItem) {
            if (quantity === 0) {
                user.cartItems = user.cartItems.filter(item => 
                    !(item.id === productId && 
                      String(item.weightOptionId || '') === String(weightOptionId || ''))
                );
                await user.save();
                return res.json(user.cartItems);
            } 

            existingItem.quantity = quantity;   
            await user.save();
            res.json(user.cartItems);
            
        } else {
            return res.status(404).json({message: "Product not found in cart"});
        }

    } catch (error) {
        console.log("Error in updateQuantity controller", error.message);
        res.status(500).json({message: "Server error", error: error.message});
    }
};

